# patient/serializers.py
from rest_framework import serializers
from .models import Patient, Appointment, PatientProvider, Document
import uuid
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import datetime, timedelta, date
from django.core.files.storage import default_storage
from tenant_telehealth.models import TelehealthMeeting, ScheduledMeetingAttendee
from accounts.models import TeleHealthGuestAccessToken
from tenant_telehealth.email_service import EmailService
import logging
import json
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db import connection
from django_tenants.utils import schema_context
from payment_posting.models import PaymentLedger
from decimal import Decimal

logger = logging.getLogger(__name__)

class PatientSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.CharField(source='__str__', read_only=True)
    age = serializers.SerializerMethodField()

    # Optional fields with proper null/blank handling
    service_type_code = serializers.CharField(
        source='serviceTypeCode',
        required=False,
        allow_blank=True,
        allow_null=True
    )
    member_id = serializers.CharField(
        source="memberId",
        required=False,
        allow_blank=True,
        allow_null=True
    )

    # Profile picture - upload support
    profile_picture = serializers.ImageField(
        source='profilePicture',
        required=False,
        allow_null=True
    )
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = "__all__"   # or explicitly list if you want more control later
        extra_kwargs = {
            'mobile_phone': {'required': False, 'allow_blank': True},
            # If you want email to be optional too:
            'email': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    # ======================
    # 1. Better age calculation (timezone-aware + more robust)
    # ======================
    def get_age(self, obj):
        if not obj.dob:
            return None
        
        today = date.today()
        age = today.year - obj.dob.year
        
        # Birthday hasn't occurred yet this year
        if (today.month, today.day) < (obj.dob.month, obj.dob.day):
            age -= 1
            
        return max(age, 0)  # prevent negative age

    # ======================
    # 2. Safer profile picture URL
    # ======================
    def get_profile_picture_url(self, obj):
        request = self.context.get("request")
        if not obj.profilePicture:
            return None
            
        try:
            url = obj.profilePicture.url
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None

    # ======================
    # 3. Prevent duplicate emails (recommended - model-level + friendly error)
    # ======================
    def validate_email(self, value):
        """
        Custom validation: prevent duplicate emails (case-insensitive)
        Skip if value is empty/null or if this is the same patient
        """
        if not value:  # empty or None → allowed
            return value

        # Case-insensitive check
        qs = Patient.objects.filter(email__iexact=value)
        
        # During update → exclude current instance
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "This email address is already in use by another patient."
            )
        
        return value

    # ======================
    # 4. Optional: Catch database-level unique constraint errors
    #    (good safety net if you add unique=True / UniqueConstraint in model)
    # ======================
    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            if 'email' in str(e).lower() or 'unique' in str(e).lower():
                raise ValidationError({
                    "email": ["This email address is already in use."]
                })
            raise

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except IntegrityError as e:
            if 'email' in str(e).lower() or 'unique' in str(e).lower():
                raise ValidationError({
                    "email": ["This email address is already in use."]
                })
            raise


class PatientProviderSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        allow_null=True
    )

    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = PatientProvider
        fields = [
            "id", "first_name", "last_name", "date_of_birth",
            "NPI", "practice_name", "address", "city", "zipcode",
            "email", "password", "confirm_password",
            "about", "week", "qualification", "service",
            "profile_picture", "country", "state",
            "telehealth", "taxid_ssn", "taxid_ein", "sub_specialty",
            "specialty", "provider_type", "medicare_ptan", "medicaid_id",
            "taxonomy", "created_at", "updated_at",
            "medical_license_number", "organization_name"
        ]
        extra_kwargs = {
            "password": {
                "write_only": True,
                "required": False,
                "allow_null": True,
            }
        }

    # -------------------------
    # VALIDATION
    # -------------------------
    def validate(self, data):
        password = data.get("password")
        confirm = data.get("confirm_password")

        # If password is provided, confirm must match
        if password:
            if not confirm:
                raise serializers.ValidationError(
                    {"confirm_password": "Confirm password is required when setting password"}
                )
            if password != confirm:
                raise serializers.ValidationError(
                    {"confirm_password": "Passwords do not match"}
                )

        return data

    # -------------------------
    # CREATE
    # -------------------------
    def create(self, validated_data):
        validated_data.pop("confirm_password", None)

        profile_picture = validated_data.pop("profile_picture", None)

        # Hash password only if provided
        if validated_data.get("password"):
            validated_data["password"] = make_password(validated_data["password"])
        else:
            validated_data.pop("password", None)

        provider = PatientProvider.objects.create(**validated_data)

        # Save profile picture under provider ID folder
        if profile_picture:
            filename = f"patient_providers/{provider.id}/{profile_picture.name}"
            saved_path = default_storage.save(filename, profile_picture)
            provider.profile_picture.name = saved_path
            provider.save(update_fields=["profile_picture"])

        return provider

    # -------------------------
    # UPDATE
    # -------------------------
    def update(self, instance, validated_data):
        validated_data.pop("confirm_password", None)

        # Detect explicit profile_picture intent
        profile_picture_provided = "profile_picture" in self.initial_data
        profile_picture = validated_data.pop("profile_picture", None)

        # Handle password
        if validated_data.get("password"):
            validated_data["password"] = make_password(validated_data["password"])
        else:
            validated_data.pop("password", None)

        instance = super().update(instance, validated_data)

        # -------------------------
        # PROFILE PICTURE HANDLING
        # -------------------------
        if profile_picture_provided:
            # Case 1: Explicit null → delete existing picture
            if profile_picture is None:
                if instance.profile_picture and default_storage.exists(instance.profile_picture.name):
                    default_storage.delete(instance.profile_picture.name)

                instance.profile_picture = None
                instance.save(update_fields=["profile_picture"])

            # Case 2: New file uploaded → replace
            else:
                if instance.profile_picture and default_storage.exists(instance.profile_picture.name):
                    default_storage.delete(instance.profile_picture.name)

                filename = f"patient_providers/{instance.id}/{profile_picture.name}"
                saved_path = default_storage.save(filename, profile_picture)
                instance.profile_picture.name = saved_path
                instance.save(update_fields=["profile_picture"])

        return instance

    # -------------------------
    # RESPONSE (FULL URL)
    # -------------------------
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")

        if instance.profile_picture and request:
            data["profile_picture"] = request.build_absolute_uri(
                instance.profile_picture.url
            )

        return data


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField(read_only=True)
    provider_name = serializers.SerializerMethodField(read_only=True)
    eligibility_status_detail = serializers.SerializerMethodField(read_only=True)
    provider_network_detail = serializers.SerializerMethodField(read_only=True)
    eligibility_last_checked_detail = serializers.SerializerMethodField(read_only=True)

    meeting_id = serializers.SerializerMethodField(read_only=True)
    meeting_link = serializers.SerializerMethodField(read_only=True)
    
    # Add optional field to determine if telehealth meeting should be created
    create_telehealth_meeting = serializers.BooleanField(write_only=True, required=False, default=False)
    
    class Meta:
        model = Appointment
        fields = "__all__"
        extra_kwargs = {
            'create_telehealth_meeting': {'write_only': True}
        }

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None
    
    def get_eligibility_status_detail(self, obj):
        if obj.patient:
            return f"{obj.patient.eligibility_status}"
        return None
    
    def get_provider_network_detail(self, obj):
        if obj.patient:
            return f"{obj.patient.provider_network}"
        return None
    
    def get_eligibility_last_checked_detail(self, obj):
        if obj.patient:
            return f"{obj.patient.eligibility_last_checked}"
        return None
    
    def get_provider_name(self, obj):
        if obj.provider:
            return f"{obj.provider.first_name} {obj.provider.last_name}"
        return None
    
    def get_meeting_id(self, obj):
        """Get associated telehealth meeting ID if exists"""
        try:
            meeting = TelehealthMeeting.objects.filter(
                appoinment=obj,
                is_active=True
            ).first()
            return meeting.id if meeting else None
        except:
            return None
    
    def get_meeting_link(self, obj):
        """Get meeting join link if meeting exists"""
        try:
            from django.conf import settings
            meeting = TelehealthMeeting.objects.filter(
                appoinment=obj,
                is_active=True
            ).first()
            if meeting and meeting.meeting_id:
                base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                return f"{base_url}/meeting/join/{meeting.meeting_id}"
            return None
        except:
            return None
    
    def _get_duration_minutes(self, duration):
        if not duration:
            return 0

        # If already numeric
        if isinstance(duration, (int, float)):
            return int(duration)

        duration = str(duration).lower().strip()

        # Plain number string
        if duration.isdigit():
            return int(duration)

        if "hour" in duration:
            value = float(duration.split()[0])
            return int(value * 60)

        if "minute" in duration:
            return int(duration.split()[0])

        return 0


    def validate(self, attrs):
        instance = self.instance

        # PATCH-safe values
        patient = attrs.get("patient", getattr(instance, "patient", None))
        provider = attrs.get("provider", getattr(instance, "provider", None))
        date = attrs.get("date", getattr(instance, "date", None))
        time = attrs.get("time", getattr(instance, "time", None))
        duration = attrs.get("duration", getattr(instance, "duration", None))

        # If date/time missing \u2192 skip overlap check
        if not all([date, time, duration]):
            return attrs

        duration_minutes = self._get_duration_minutes(duration)

        start_dt = timezone.make_aware(datetime.combine(date, time))
        end_dt = start_dt + timedelta(minutes=duration_minutes)

        now = timezone.now()
        if start_dt < now:
            raise serializers.ValidationError(
                {"time": "Cannot book appointment in the past."}
            )

        qs = Appointment.objects.filter(
            date=date
        ).exclude(
            id=getattr(instance, "id", None)
        )

        if instance:
            qs = qs.exclude(id=instance.id)

        # ---------------------------------------------------
        # 1\ufe0f\u20e3 SAME PATIENT overlap check
        # ---------------------------------------------------
        for appt in qs.filter(patient=patient):
            appt_start = timezone.make_aware(
                datetime.combine(appt.date, appt.time)
            )
            appt_end = appt_start + timedelta(
                minutes=self._get_duration_minutes(appt.duration)
            )

            if start_dt < appt_end and end_dt > appt_start:
                raise serializers.ValidationError(
                    {
                        "patient": (
                            "Patient already has an overlapping appointment "
                            f"from {appt_start.time()} to {appt_end.time()}."
                        )
                    }
                )

        # ---------------------------------------------------
        # 2\ufe0f\u20e3 SAME PROVIDER overlap check
        # ---------------------------------------------------
        for appt in qs.filter(provider=provider):
            appt_start = timezone.make_aware(
                datetime.combine(appt.date, appt.time)
            )
            appt_end = appt_start + timedelta(
                minutes=self._get_duration_minutes(appt.duration)
            )

            if start_dt < appt_end and end_dt > appt_start:
                raise serializers.ValidationError(
                    {
                        "provider": (
                            "Provider already has an overlapping appointment "
                            f"from {appt_start.time()} to {appt_end.time()}."
                        )
                    }
                )

        return attrs
    
    def create(self, validated_data):
        """Create appointment and optionally create telehealth meeting"""
        # Remove telehealth flag before saving appointment
        create_telehealth = validated_data.pop('create_telehealth_meeting', False)
        
        # Create the appointment
        appointment = Appointment.objects.create(**validated_data)

        # Create PaymentLedger entry if copay or deposit is available
        total_patient_charge = appointment.copay_amt + appointment.deposite_amt
        if total_patient_charge > 0:
            try:
                PaymentLedger.objects.create(
                    patient=appointment.patient,
                    entry_type="CHARGE",
                    amount=-Decimal(total_patient_charge), # Charges are usually negative in this system based on clean() method
                    responsibility_type='PATIENT',
                    posting_date=timezone.now().date(),
                    notes=f"Charge for Appointment {appointment.id} (Copay: {appointment.copay_amt}, Deposit: {appointment.deposite_amt})"
                )
            except Exception as e:
                logger.error(f"Error creating PaymentLedger for appointment {appointment.id}: {str(e)}")

        try:
            EmailService.send_appointment_created_email(appointment)
        except Exception as e:
            logger.error(
                f"Appointment email failed for {appointment.id}: {str(e)}"
            )
        # Create telehealth meeting if requested
        if create_telehealth:
            try:
                self._create_telehealth_meeting(appointment)
            except Exception as e:
                logger.error(f"Error creating telehealth meeting for appointment {appointment.id}: {str(e)}")
                # Don't fail appointment creation if meeting creation fails
        
        return appointment
    
    def _create_telehealth_meeting(self, appointment):
        """Helper method to create telehealth meeting for appointment"""
        # Calculate start and end times
        start_datetime = timezone.make_aware(
            datetime.combine(appointment.date, appointment.time)
        )
        duration_minutes = self._get_duration_minutes(appointment.duration)
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)
        
        # Create meeting title
        meeting_title = f"Appointment: {appointment.patient.first_name} {appointment.patient.last_name} with {appointment.provider.first_name} {appointment.provider.last_name}"
        meeting_description = appointment.reason or "Scheduled telehealth appointment"

        tenant_schema = connection.schema_name
        
        # Generate token
        token = TeleHealthGuestAccessToken.generate_token()
        token_hash = TeleHealthGuestAccessToken.hash_token(token)
        
        # Calculate expiry
        expires_at = end_datetime + timedelta(minutes=30)
        # Store in PUBLIC schema (so it's accessible across tenants)
        

        # Create the telehealth meeting
        meeting = TelehealthMeeting.objects.create(
            appoinment=appointment,
            meeting_title=meeting_title,
            meeting_description=meeting_description,
            scheduled_start_time=start_datetime,
            scheduled_end_time=end_datetime,
            status='scheduled',
            is_active=True
        )
        with schema_context('public'):
            guest_token = TeleHealthGuestAccessToken.objects.create(
                token=token,
                token_hash=token_hash,
                meeting_db_id=meeting.id,
                user_name=appointment.patient.first_name + " " + appointment.patient.last_name,
                user_email=appointment.patient.email,
                user_phone=appointment.patient.mobile_phone or '',
                tenant_schema=tenant_schema,
                expires_at=expires_at
            )
        
        
        # Add attendees
        attendees = []
        
        # Add provider as organizer
        if appointment.provider.email:
            provider_attendee = ScheduledMeetingAttendee.objects.create(
                meeting=meeting,
                email=appointment.provider.email,
                name=f"{appointment.provider.first_name} {appointment.provider.last_name}",
                is_organizer=True,
                user=appointment.provider.user if hasattr(appointment.provider, 'user') else None
            )
            attendees.append(provider_attendee)
        
        # Add patient
        if appointment.patient.email:
            patient_attendee = ScheduledMeetingAttendee.objects.create(
                meeting=meeting,
                email=appointment.patient.email,
                name=f"{appointment.patient.first_name} {appointment.patient.last_name}",
                is_organizer=False,
                user=appointment.patient.user if hasattr(appointment.patient, 'user') else None
            )
            attendees.append(patient_attendee)
        
        # Send creation emails
        if attendees:
            try:
                EmailService.send_meeting_created_email(meeting, attendees)
                meeting.creation_email_sent = True
                meeting.save()
                logger.info(f"Telehealth meeting created and emails sent for appointment {appointment.id}")
            except Exception as e:
                logger.error(f"Error sending meeting creation emails: {str(e)}")
        
        return meeting

class MinimalPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'dob', 'gender']


class MinimalPatientProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProvider
        fields = ['id', 'first_name', 'last_name']




class PatientMinimalSerializer(serializers.ModelSerializer):
    patient_id = serializers.UUIDField(source="id")
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ["patient_id", "patient_name"]

    def get_patient_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class ProviderMinimalSerializer(serializers.ModelSerializer):
    provider_id = serializers.IntegerField(source="id")
    provider_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientProvider
        fields = ["provider_id", "provider_name"]

    def get_provider_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class ProviderAvailabilitySerializer(serializers.ModelSerializer):
    provider_id = serializers.IntegerField(source="id")
    provider_name = serializers.SerializerMethodField()
    week = serializers.SerializerMethodField()

    class Meta:
        model = PatientProvider
        fields = ["provider_id", "provider_name", "week"]

    def get_provider_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_week(self, obj):
        if not obj.week:
            return []
            
        try:
            week_data = obj.week if isinstance(obj.week, dict) else json.loads(obj.week)
        except (ValueError, TypeError):
            return []
            
        result = []
        
        # Date context
        request = self.context.get("request")
        ref_date = timezone.now().date()
        if request:
            date_param = request.query_params.get("date")
            if date_param:
                try:
                    ref_date = datetime.strptime(date_param, "%Y-%m-%d").date()
                except ValueError:
                    pass
        
        # Weekday mapping
        days_map = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, 
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }

        target_weekday = None
        if request and request.query_params.get("date"):
            target_weekday = ref_date.weekday()
        
        # Helper to parse time string "HH:MM" to minutes
        def to_minutes(time_str):
            if not time_str: return 0
            try:
                h, m = map(int, time_str.split(':'))
                return h * 60 + m
            except ValueError:
                return 0
            
        def from_minutes(mins):
            h = mins // 60
            m = mins % 60
            return f"{h:02d}:{m:02d}"

        # Helper for duration
        def get_duration_minutes(duration):
            if not duration: return 0
            if isinstance(duration, (int, float)): return int(duration)
            s = str(duration).lower().strip()
            if s.isdigit(): return int(s)
            if "hour" in s:
                try:
                    return int(float(s.split()[0]) * 60)
                except:
                    return 0
            if "minute" in s:
                try:
                    return int(s.split()[0])
                except:
                    return 0
            return 0
            
        # Current week start (Monday)
        current_weekday = ref_date.weekday()
        week_start = ref_date - timedelta(days=current_weekday)
        
        for place, days in week_data.items():
            if not isinstance(days, dict): continue
            
            for day_name, day_info in days.items():
                if not isinstance(day_info, dict) or not day_info.get("enabled"):
                    continue

                if target_weekday is not None:
                    day_idx_check = days_map.get(day_name)
                    if day_idx_check != target_weekday:
                        continue
                    
                ranges = day_info.get("ranges", [])
                if not ranges:
                    continue
                
                # Calculate target date for this day
                day_idx = days_map.get(day_name)
                if day_idx is None:
                    continue
                    
                target_date = week_start + timedelta(days=day_idx)
                
                # Fetch appointments
                appointments = Appointment.objects.filter(
                    provider=obj,
                    date=target_date
                ).exclude(confirmationstatus__in=['cancelled', 'rescheduled', 'no_show'])
                
                # Convert availability ranges to minute intervals
                avail_intervals = []
                for r in ranges:
                    start = to_minutes(r.get('start'))
                    end = to_minutes(r.get('end'))
                    if start < end:
                        avail_intervals.append((start, end))
                
                # Subtract appointment times
                for appt in appointments:
                    if not appt.time: continue
                    
                    appt_start = appt.time.hour * 60 + appt.time.minute
                    duration = get_duration_minutes(appt.duration)
                    appt_end = appt_start + duration
                    
                    new_intervals = []
                    for (start, end) in avail_intervals:
                        # No overlap
                        if appt_end <= start or appt_start >= end:
                            new_intervals.append((start, end))
                        else:
                            # Overlap, split
                            if appt_start > start:
                                new_intervals.append((start, appt_start))
                            if appt_end < end:
                                new_intervals.append((appt_end, end))
                    avail_intervals = new_intervals
                
                # Format back
                final_ranges = []
                for (start, end) in sorted(avail_intervals):
                    final_ranges.append({
                        "start": from_minutes(start),
                        "end": from_minutes(end)
                    })
                
                result.append({
                    "Place": place,
                    "Day": day_name,
                    "Available Slots": final_ranges
                })
                    
        return result

class AppointmentMinimalSerializer(serializers.ModelSerializer):
    patient = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = "__all__"

    def get_patient(self, obj):
        return {
            "id": obj.patient.id,
            "first_name": obj.patient.first_name,
            "last_name": obj.patient.last_name,
            "member_id": obj.patient.memberId,
            "dob": obj.patient.dob,
            "servicetypecode": obj.patient.serviceTypeCode,
            "insurance_name": obj.patient.insurance_name,
        }

    def get_provider(self, obj):
        return {
            "id": obj.provider.id,
            "first_name": obj.provider.first_name,
            "last_name": obj.provider.last_name,
            "practice_name": obj.provider.practice_name,
            "NPI": obj.provider.NPI,
        }

# uploading the tenant files
class EncounterDocumentUploadSerializer(serializers.Serializer):
    patient = serializers.UUIDField()
    appointment = serializers.IntegerField(required=False, allow_null=True)
    file = serializers.FileField()
    label = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, default="active")

    def validate_file(self, file):
        allowed = (".pdf", ".png", ".jpg", ".jpeg")
        if not file.name.lower().endswith(allowed):
            raise serializers.ValidationError("Unsupported file format")
        return file
    
class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
