from rest_framework import serializers
from django.db import transaction, IntegrityError
from .models import *
from .models import AgentLifeCycle, TelephonySettings, AgentVersion, ConversationProcess, ConfigJSON, AgentScript
from voiceAI.service import call_gemini
from modules.models import *
from accounts.models import *
from datetime import datetime
import pytz

class AgentScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentScript
        fields = "__all__"

class AgentVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    created_date = serializers.SerializerMethodField()
    createdBot = serializers.SerializerMethodField()
    prompt = AgentScriptSerializer(read_only=True)

    class Meta:
        model = AgentVersion
        fields = "__all__"
        read_only_fields = ['client_id']
    
    def get_created_date(self, obj):
        return obj.created_at.strftime("%m/%d/%Y")

    def get_createdBot(self, obj):
         # Frontend column name is 'createdBot', mapping to created_at for now as per mock data
        return obj.created_at.strftime("%m/%d/%Y")

    def create(self, validated_data):
        with transaction.atomic():
            lifecycle = AgentLifeCycle.objects.create()
            telephony = TelephonySettings.objects.create(client=self.context['request'].user.client)
            validated_data['life_cycle_id'] = lifecycle
            validated_data['Telephony_Settings_id'] = telephony
            
            return super().create(validated_data)


class AgentLifeCycleSerializer(serializers.ModelSerializer):
    allowed_api_keys = serializers.JSONField()
    trigger_mode = serializers.JSONField()
    forward_condition = serializers.JSONField()
    forward_keys = serializers.JSONField(required=False)
    forward_data = serializers.JSONField()
    end_call_keys = serializers.JSONField(required=False)
    uni_directional_calls = serializers.JSONField(required=False)
    bi_directional_calls = serializers.JSONField(required=False)

    class Meta:
        model = AgentLifeCycle
        fields = "__all__"

    def _validate_function_list(self, value, field_name):
        """
        Validate a list of function objects.
        Each function may contain an optional 'headers' list of {key, value} dicts.
        """
        if value is None:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError(
                {field_name: "Must be a list of function objects."}
            )
        for idx, fn in enumerate(value):
            if not isinstance(fn, dict):
                raise serializers.ValidationError(
                    {field_name: f"Item at index {idx} must be an object."}
                )
            headers = fn.get("headers", [])
            if headers is None:
                headers = []
            if not isinstance(headers, list):
                raise serializers.ValidationError(
                    {field_name: f"'headers' in item {idx} must be a list."}
                )
            for h_idx, header in enumerate(headers):
                if not isinstance(header, dict):
                    raise serializers.ValidationError(
                        {field_name: f"Header at index {h_idx} in item {idx} must be an object."}
                    )
                if "key" not in header or "value" not in header:
                    raise serializers.ValidationError(
                        {field_name: f"Header at index {h_idx} in item {idx} must have 'key' and 'value' fields."}
                    )
        return value

    def validate_uni_directional_calls(self, value):
        return self._validate_function_list(value, "uni_directional_calls")

    def validate_bi_directional_calls(self, value):
        return self._validate_function_list(value, "bi_directional_calls")


class TelephonySettingsSerializer(serializers.ModelSerializer):

    phone_number = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    primary_phone_number = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
        allow_blank=True
    )

    class Meta:
        model = TelephonySettings
        fields = "__all__"
        read_only_fields = ["client"]  # 🔒 Prevent client injection

    # --------------------------------
    # Representation
    # --------------------------------
    def to_representation(self, instance):
        data = super().to_representation(instance)

        numbers = list(
            instance.mobile_numbers.values_list("mobile_number", flat=True)
        )

        data["phone_number"] = numbers
        data["primary_phone_number"] = numbers[0] if numbers else None

        return data

    # --------------------------------
    # Create
    # --------------------------------
    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        client = request.user.client

        numbers = validated_data.pop("phone_number", [])
        validated_data.pop("primary_phone_number", None)

        # 🔥 Force client from logged-in user
        validated_data["client"] = client

        instance = TelephonySettings.objects.create(**validated_data)

        self._attach_numbers(instance, numbers)

        return instance

    # --------------------------------
    # Update
    # --------------------------------
    @transaction.atomic
    def update(self, instance, validated_data):
        numbers = validated_data.pop("phone_number", None)
        validated_data.pop("primary_phone_number", None)

        # 🔒 Never allow client change
        validated_data.pop("client", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if numbers is not None:
            MobileNumber.objects.filter(
                telephony_settings=instance
            ).update(telephony_settings=None)

            self._attach_numbers(instance, numbers)

        return instance

    # --------------------------------
    # Attach Numbers Logic
    # --------------------------------
    def _attach_numbers(self, instance, numbers):
        request = self.context["request"]
        client = request.user.client

        for number in numbers:
            mobile_obj, created = MobileNumber.objects.get_or_create(
                mobile_number=number,
                defaults={
                    "twilio_sid": "",
                    # ❌ Remove this line - MobileNumber has no client field
                    # "client": client,
                    "telephony_settings": instance,
                }
            )

            if not created:
                # ✅ Updated validation
                if mobile_obj.client and mobile_obj.client != client:
                    raise serializers.ValidationError(
                        f"{number} belongs to another client"
                    )

                if (
                    mobile_obj.telephony_settings and
                    mobile_obj.telephony_settings != instance
                ):
                    raise serializers.ValidationError(
                        f"{number} is already assigned to another agent"
                    )

                mobile_obj.telephony_settings = instance
                mobile_obj.save()


    
class ConfigJSONSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigJSON
        fields = "__all__"

    
class MobileNumberSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = MobileNumber
        fields  = "__all__"


class AppMiniSerializer(serializers.ModelSerializer):
    config_json = ConfigJSONSerializer(many=True, read_only=True)
    class Meta:
        model = App
        fields = ("app_name", "api_key",'id',"config_json")


class ClientMiniSerializer(serializers.ModelSerializer):
    mobile_number = MobileNumberSerializer(read_only=True)
    class Meta:
        model = Client
        fields = "__all__"
class UserMiniSerializer(serializers.ModelSerializer):
    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("username", "first_name", "phone_number")

    def get_phone_number(self, obj):
        if obj.client:
            numbers = obj.client.mobile_number_purchased.all()
            return [n.mobile_number for n in numbers]
        return []

class RetriveAgentDataSerializer(serializers.ModelSerializer):
    apps = AppMiniSerializer()
    user = UserMiniSerializer()

    class Meta:
        model = GeneratedAPI
        fields = ("apps","user")

# phone number serializer
class PhoneNumberAgentLifeCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentLifeCycle
        fields = '__all__'


class PhoneNumberTelephonySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelephonySettings
        fields = '__all__'


class PhoneNumberAgentVersionSerializer(serializers.ModelSerializer):
    app_id = serializers.IntegerField(source='app.id', read_only=True, allow_null=True)
    app_name = serializers.CharField(source='app.name', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = AgentVersion
        fields = '__all__'


class PhoneNumberAgentPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentScript
        fields = '__all__'


class PhoneNumberConfigJSONSerializer(serializers.ModelSerializer):
    app_id = serializers.IntegerField(source='app.id', read_only=True, allow_null=True)
    
    class Meta:
        model = ConfigJSON
        fields = '__all__'


class CallLogSerializer(serializers.ModelSerializer):
    duration_formatted = serializers.ReadOnlyField()
    agent_name = serializers.SerializerMethodField()
    app_name = serializers.SerializerMethodField()
    user_mail = serializers.SerializerMethodField()
    
    class Meta:
        model = CallLog
        fields = [
            'id',
            'call_id',
            'agent_version',
            'agent_name',
            'agent_task',   # 👈 ADD THIS
            'user',
            'user_mail',
            'app',
            'app_name',
            'from_number',
            'to_number',
            'start_time',
            'end_time',
            'duration_seconds',
            'duration_formatted',
            'voice',
            'model',
            'config_source',
            'recording_path',
            'transcript_path',
            'recording_s3_url',
            'transcript_s3_url',
            'call_log_s3_url',
            'extracted_s3_url',
            'status',
            'call_metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_agent_name(self, obj):
        if obj.agent_version:
            return f"{obj.agent_version.version_number}"
        return None
    
    def get_app_name(self, obj):
        if obj.app:
            return obj.app.app_name
        return None
    
    def get_user_mail(self, obj):
        if obj.user:
            return obj.user.mail
        return None


class CallLogCreateSerializer(serializers.Serializer):
    # Required fields
    call_id = serializers.CharField(max_length=255)
    
    # Optional identification (at least one required)
    phone_number = serializers.CharField(max_length=20, required=False, allow_null=True)
    app_id = serializers.IntegerField(required=False, allow_null=True)
    user_id = serializers.IntegerField(required=False, allow_null=True)
    agent_id = serializers.IntegerField(required=False, allow_null=True)
    agent_task_id = serializers.IntegerField(required=False, allow_null=True)
    # Phone numbers
    from_number = serializers.CharField(max_length=20, required=False, allow_null=True)
    to_number = serializers.CharField(max_length=20, required=False, allow_null=True)
    
    # Timing
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    end_time = serializers.DateTimeField(required=False, allow_null=True)
    duration_seconds = serializers.FloatField(required=False, allow_null=True)
    
    # Configuration
    voice = serializers.CharField(max_length=100, required=False, allow_null=True)
    model = serializers.CharField(max_length=255, required=False, allow_null=True)
    config_source = serializers.CharField(max_length=20, required=False, default="Default")
    
    # File paths
    recording_path = serializers.CharField(required=False, allow_null=True)
    transcript_path = serializers.CharField(required=False, allow_null=True)
    
    # S3 URLs
    recording_s3_url = serializers.URLField(required=False, allow_null=True)
    transcript_s3_url = serializers.URLField(required=False, allow_null=True)
    call_log_s3_url = serializers.URLField(required=False, allow_null=True)
    extracted_s3_url = serializers.URLField(required=False, allow_null=True) 
    
    # Status
    status = serializers.CharField(max_length=20, required=False, default="in_progress")
    
    # Metadata
    call_metadata = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        # Must provide either phone_number OR (app_id + user_id)
        has_phone = data.get('phone_number')
        has_ids = data.get('app_id') and data.get('user_id')
        
        if not has_phone and not has_ids:
            raise serializers.ValidationError(
                "Must provide either 'phone_number' or both 'app_id' and 'user_id'"
            )
        
        return data
    
    def create(self, validated_data):
        
        # Extract identification fields
        phone_number = validated_data.pop('phone_number', None)
        app_id = validated_data.pop('app_id', None)
        user_id = validated_data.pop('user_id', None)
        agent_id = validated_data.pop('agent_id', None)
        agent_task_id = validated_data.pop('agent_task_id', None)
        # Resolve app_id and user_id from phone_number if provided
        if phone_number and not (app_id and user_id):
            # Find agent version by phone number
            try:
                telephony_settings = TelephonySettings.objects.filter(
                    phone_number__contains=[phone_number]
                ).first()
                
                if telephony_settings:
                    agent_version = AgentVersion.objects.filter(
                        Telephony_Settings_id=telephony_settings
                    ).first()
                    
                    if agent_version:
                        agent_id = agent_version.id
                        app_id = agent_version.app_id
                        user_id = agent_version.created_by_id
            except Exception as e:
                print(f"Error resolving phone number: {e}")
        
        # Create CallLog instance
        call_log = CallLog.objects.create(
            agent_task_id=agent_task_id,
            agent_version_id=agent_id,
            app_id=app_id,
            user_id=user_id,
            **validated_data
        )
        
        return call_log
    

class OutboundAgentSerializer(serializers.ModelSerializer):
    api_key = serializers.SerializerMethodField()
    phone_numbers = serializers.SerializerMethodField()
    is_available_now = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()

    class Meta:
        model = AgentVersion
        fields = [
            "id",
            "api_key",
            "phone_numbers",
            "agent_name",
            "agent_type",
            "voice_type",
            "voice",
            "language",
            "timezone",
            "start_time",
            "end_time",
            "weekend_support",
            "active_days",       # ← ADD THIS
            "schedule",
            "is_available_now",
        ]

    def get_api_key(self, obj):
        generated = GeneratedAPI.objects.filter(
            user=obj.created_by,
            apps=obj.app,
        ).first()
        return generated.api_key if generated else None

    def get_phone_numbers(self, obj):
        if not obj.Telephony_Settings_id:
            return []
        return list(
            obj.Telephony_Settings_id.mobile_numbers
            .values_list("mobile_number", flat=True)
        )

    def get_schedule(self, obj):
        return {
            "timezone": obj.timezone,
            "start_time": obj.start_time.strftime("%H:%M") if obj.start_time else None,
            "end_time": obj.end_time.strftime("%H:%M") if obj.end_time else None,
            "weekend_support": obj.weekend_support,
            "active_days": obj.active_days,
        }

    def get_is_available_now(self, obj):
        if not obj.timezone or not obj.start_time or not obj.end_time:
            return False

        try:
            tz = pytz.timezone(obj.timezone)
        except pytz.UnknownTimeZoneError:
            return False

        now_local = datetime.now(tz)
        current_time = now_local.time().replace(second=0, microsecond=0)

        # --- ACTIVE DAYS CHECK ---
        if obj.active_days:
            # If specific days are selected, check against them
            today_weekday = str(now_local.weekday())
            if today_weekday not in obj.active_days:
                return False
        # If active_days is empty/None → available all 7 days, skip day check

        # --- TIME WINDOW CHECK ---
        if obj.start_time <= obj.end_time:
            # Normal window e.g. 10:00 → 19:00
            return obj.start_time <= current_time <= obj.end_time
        else:
            # Overnight window e.g. 22:00 → 06:00
            return current_time >= obj.start_time or current_time <= obj.end_time

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation.get("api_key"):
            return None
        return representation

    

class MobileNumberSerializerclient(serializers.ModelSerializer):
    is_assigned = serializers.BooleanField(read_only=True)
    status = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()

    class Meta:
        model = MobileNumber
        fields = ['id', 'mobile_number', 'twilio_sid', 'is_assigned', 'status', 'assigned_to', 'created_at']

    def get_status(self, obj):
        return "In Use" if obj.telephony_settings else "Available"

    def get_assigned_to(self, obj):
        if obj.telephony_settings:
            return {
                'telephony_settings_id': obj.telephony_settings.id,
                'client': str(obj.telephony_settings.client)
            }
        return None
    
