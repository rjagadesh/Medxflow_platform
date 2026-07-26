from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    Allergy, PatientAllergyProfile, PatientProblem, Medications, PatientVitals,
    ClinicalNote, LabOrder, PatientHistory,
)
from tenant_app.models import Patient, Appointment
from .serializers import (
    AllergySerializer,
    PatientAllergyProfileSerializer,
    PatientProblemSerializer,
    MedicationsSerializer,
    PatientVitalsSerializer,
    ClinicalNoteSerializer,
    LabOrderSerializer,
    PatientHistorySerializer,
)
from rest_framework.views import APIView
from django_tenants.utils import schema_context


class TenantAPIView(APIView):

    def dispatch(self, request, *args, **kwargs):

        tenant = getattr(request, "tenant", None)

        if tenant and tenant.schema_name:
            with schema_context(tenant.schema_name):
                return super().dispatch(request, *args, **kwargs)

        return super().dispatch(request, *args, **kwargs)


class AllergyView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = Allergy.objects.all()
        serializer = AllergySerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "allergies": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = AllergySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(
                {
                    "message": "Allergy created",
                    "allergy": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AllergyDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Allergy, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        allergy = self.get_object(pk)
        serializer = AllergySerializer(allergy)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        allergy = self.get_object(pk)
        serializer = AllergySerializer(
            allergy,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response({
                "message": "Allergy updated",
                "allergy": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        allergy = self.get_object(pk)
        serializer = AllergySerializer(
            allergy,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            data = serializer.validated_data

            # handle reconciliation
            if data.get("reconciled") is True:
                serializer.save(
                    reconciled_at=timezone.now(),
                    reconciled_by=request.user,
                    updated_by=request.user
                )
            else:
                serializer.save(updated_by=request.user)

            return Response({
                "message": "Allergy partially updated",
                "allergy": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        allergy = self.get_object(pk)
        allergy.delete()

        return Response(
            {"message": "Allergy deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class PatientAllergiesView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        allergies = Allergy.objects.filter(patient=patient)
        serializer = AllergySerializer(allergies, many=True)
        return Response({
            "count": allergies.count(),
            "allergies": serializer.data
        })


class PatientAllergyProfileView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, patient_id):
        return get_object_or_404(
            PatientAllergyProfile,
            patient_id=patient_id
        )

    # 🔹 RETRIEVE
    def get(self, request, patient_id):
        profile = self.get_object(patient_id)
        serializer = PatientAllergyProfileSerializer(profile)
        return Response(serializer.data)

    # 🔹 CREATE or UPDATE
    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        profile, created = PatientAllergyProfile.objects.get_or_create(patient=patient)
        
        serializer = PatientAllergyProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Allergy profile created" if created else "Allergy profile updated",
                    "profile": serializer.data
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProblemView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = PatientProblem.objects.all()
        serializer = PatientProblemSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "problems": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = PatientProblemSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                {
                    "message": "Problem created",
                    "problem": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProblemDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(PatientProblem, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        problem = self.get_object(pk)
        serializer = PatientProblemSerializer(problem)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        problem = self.get_object(pk)
        serializer = PatientProblemSerializer(
            problem,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Problem updated",
                "problem": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        problem = self.get_object(pk)
        serializer = PatientProblemSerializer(
            problem,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            data = serializer.validated_data

            # handle reconciliation
            if data.get("reconciliation_performed") is True:
                serializer.save(
                    reconciled_at=timezone.now(),
                    reconciled_by=request.user
                )
            else:
                serializer.save()

            return Response({
                "message": "Problem partially updated",
                "problem": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        problem = self.get_object(pk)
        problem.delete()

        return Response(
            {"message": "Problem deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class PatientProblemsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        problems = PatientProblem.objects.filter(patient=patient)
        serializer = PatientProblemSerializer(problems, many=True)
        return Response({
            "count": problems.count(),
            "problems": serializer.data
        })


class MedicationsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = Medications.objects.all()
        serializer = MedicationsSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "medications": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = MedicationsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Medication created",
                    "medication": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicationDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Medications, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        medication = self.get_object(pk)
        serializer = MedicationsSerializer(medication)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        medication = self.get_object(pk)
        serializer = MedicationsSerializer(
            medication,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Medication updated",
                "medication": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        medication = self.get_object(pk)
        serializer = MedicationsSerializer(
            medication,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Medication partially updated",
                "medication": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        medication = self.get_object(pk)
        medication.delete()

        return Response(
            {"message": "Medication deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class MedicationMarkAsErrorView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        medication = get_object_or_404(Medications, pk=pk)
        medication.status = "not_administered"
        medication.save()

        serializer = MedicationsSerializer(medication)
        return Response({
            "message": "Medication marked as error",
            "medication": serializer.data
        })


class PatientMedicationsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        medications = Medications.objects.filter(patient=patient)
        serializer = MedicationsSerializer(medications, many=True)
        return Response({
            "count": medications.count(),
            "medications": serializer.data
        })


class PatientVitalsView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = PatientVitals.objects.all()
        serializer = PatientVitalsSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "vitals": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = PatientVitalsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                {
                    "message": "Vitals created",
                    "vitals": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientVitalsDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(PatientVitals, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        vitals = self.get_object(pk)
        serializer = PatientVitalsSerializer(vitals)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        vitals = self.get_object(pk)
        serializer = PatientVitalsSerializer(
            vitals,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Vitals updated",
                "vitals": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        vitals = self.get_object(pk)
        serializer = PatientVitalsSerializer(
            vitals,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Vitals partially updated",
                "vitals": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        vitals = self.get_object(pk)
        vitals.delete()

        return Response(
            {"message": "Vitals deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class PatientVitalsByPatientView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        vitals = PatientVitals.objects.filter(patient=patient)
        serializer = PatientVitalsSerializer(vitals, many=True)
        return Response({
            "count": vitals.count(),
            "vitals": serializer.data
        })


class ClinicalNoteView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # 🔹 LIST
    def get(self, request):
        qs = ClinicalNote.objects.all()
        serializer = ClinicalNoteSerializer(qs, many=True)
        return Response({
            "count": qs.count(),
            "notes": serializer.data
        })

    # 🔹 CREATE
    def post(self, request):
        serializer = ClinicalNoteSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response(
                {
                    "message": "Clinical Note created",
                    "note": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClinicalNoteDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ClinicalNote, pk=pk)

    # 🔹 RETRIEVE
    def get(self, request, pk):
        note = self.get_object(pk)
        serializer = ClinicalNoteSerializer(note)
        return Response(serializer.data)

    # 🔹 FULL UPDATE
    def put(self, request, pk):
        note = self.get_object(pk)
        serializer = ClinicalNoteSerializer(
            note,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response({
                "message": "Clinical Note updated",
                "note": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 PARTIAL UPDATE
    def patch(self, request, pk):
        note = self.get_object(pk)
        serializer = ClinicalNoteSerializer(
            note,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response({
                "message": "Clinical Note partially updated",
                "note": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE
    def delete(self, request, pk):
        note = self.get_object(pk)
        note.delete()

        return Response(
            {"message": "Clinical Note deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class ClinicalNoteByAppointmentView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, appointment_id, patient_id):
        return get_object_or_404(
            ClinicalNote, 
            appointment_id=appointment_id, 
            patient_id=patient_id
        )

    def get(self, request, appointment_id, patient_id):
        note = self.get_object(appointment_id, patient_id)
        serializer = ClinicalNoteSerializer(note)
        return Response(serializer.data)

    def post(self, request, appointment_id, patient_id):
        # Upsert: Create or Update
        try:
            note = ClinicalNote.objects.get(appointment_id=appointment_id, patient_id=patient_id)
            created = False
        except ClinicalNote.DoesNotExist:
            note = None
            created = True
        
        # Inject IDs into data
        data = request.data.copy()
        data['appointment'] = appointment_id
        data['patient'] = patient_id
        
        if note:
            # Update existing note
            serializer = ClinicalNoteSerializer(note, data=data, partial=True)
        else:
            # Create new note
            serializer = ClinicalNoteSerializer(data=data)

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response(
                {
                    "message": "Clinical Note created" if created else "Clinical Note updated",
                    "note": serializer.data
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, appointment_id, patient_id):
        note = self.get_object(appointment_id, patient_id)
        
        data = request.data.copy()
        data['appointment'] = appointment_id
        data['patient'] = patient_id
        
        serializer = ClinicalNoteSerializer(note, data=data)

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response({
                "message": "Clinical Note updated",
                "note": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, appointment_id, patient_id):
        note = self.get_object(appointment_id, patient_id)
        
        serializer = ClinicalNoteSerializer(note, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save(saved_by=request.user, saved_at=timezone.now())
            return Response({
                "message": "Clinical Note partially updated",
                "note": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, appointment_id, patient_id):
        note = self.get_object(appointment_id, patient_id)
        note.delete()
        return Response(
            {"message": "Clinical Note deleted"},
            status=status.HTTP_204_NO_CONTENT
        )


class ClinicalNoteSignOffView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        note = get_object_or_404(ClinicalNote, pk=pk)
        
        note.is_signed = True
        note.sign_off_by = request.user
        note.sign_off_at = timezone.now()
        note.save()
        
        serializer = ClinicalNoteSerializer(note)
        return Response({
            "message": "Clinical Note signed off",
            "note": serializer.data
        })


class ClinicalNoteByPatientView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        notes = ClinicalNote.objects.filter(patient=patient)
        serializer = ClinicalNoteSerializer(notes, many=True)
        return Response({
            "count": notes.count(),
            "notes": serializer.data
        })


# ───────────────────────────────────────────────────────────────
#               Labs / Studies Orders
# ───────────────────────────────────────────────────────────────
class LabOrderView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # LIST (optional ?patient= and ?type= filters)
    def get(self, request):
        qs = LabOrder.objects.all().prefetch_related("diagnoses", "items")
        patient_id = request.query_params.get("patient")
        order_type = request.query_params.get("type")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if order_type:
            qs = qs.filter(order_type=order_type)
        serializer = LabOrderSerializer(qs, many=True)
        return Response({"count": qs.count(), "orders": serializer.data})

    # CREATE
    def post(self, request):
        serializer = LabOrderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                {"message": "Order created", "order": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LabOrderDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(LabOrder, pk=pk)

    def get(self, request, pk):
        return Response(LabOrderSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = LabOrderSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Order updated", "order": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = LabOrderSerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Order partially updated", "order": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response({"message": "Order deleted"}, status=status.HTTP_204_NO_CONTENT)


class PatientLabOrdersView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        qs = LabOrder.objects.filter(patient=patient).prefetch_related("diagnoses", "items")
        order_type = request.query_params.get("type")
        if order_type:
            qs = qs.filter(order_type=order_type)
        serializer = LabOrderSerializer(qs, many=True)
        return Response({"count": qs.count(), "orders": serializer.data})


# ───────────────────────────────────────────────────────────────
#               Past Medical / Surgical History
# ───────────────────────────────────────────────────────────────
class PatientHistoryView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    # LIST (optional ?patient= and ?type=medical|surgical filters)
    def get(self, request):
        qs = PatientHistory.objects.all()
        patient_id = request.query_params.get("patient")
        history_type = request.query_params.get("type")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if history_type:
            qs = qs.filter(history_type=history_type)
        serializer = PatientHistorySerializer(qs, many=True)
        return Response({"count": qs.count(), "history": serializer.data})

    # CREATE (single object or a list of objects for bulk save)
    def post(self, request):
        many = isinstance(request.data, list)
        serializer = PatientHistorySerializer(data=request.data, many=many)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                {"message": "History saved", "history": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientHistoryDetailView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(PatientHistory, pk=pk)

    def get(self, request, pk):
        return Response(PatientHistorySerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = PatientHistorySerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "History updated", "history": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = PatientHistorySerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "History partially updated", "history": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response({"message": "History deleted"}, status=status.HTTP_204_NO_CONTENT)


class PatientHistoryByPatientView(TenantAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        qs = PatientHistory.objects.filter(patient=patient)
        history_type = request.query_params.get("type")
        if history_type:
            qs = qs.filter(history_type=history_type)
        serializer = PatientHistorySerializer(qs, many=True)
        return Response({"count": qs.count(), "history": serializer.data})
