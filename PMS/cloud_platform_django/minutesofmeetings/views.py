from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.conf import settings

from .models import MinutesOfMeetings, MailTemplate, Signature
from .serializers import MinutesOfMeetingsSerializer, MailTemplateSerializer, SignatureSerializer
from .services import process_minutes_of_meeting
from django.core.files import File
import os
from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from .graph_service import MicrosoftGraphService
from .utils import extract_images_and_replace_sources

def view_mom_pdf(request, pk):
    obj = get_object_or_404(MinutesOfMeetings, pk=pk)

    if not obj.output_file:
        raise Http404("No output file found")

    file_path = obj.output_file.path

    if not os.path.exists(file_path):
        raise Http404("File not found")

    file_handle = open(file_path, 'rb')

    response = FileResponse(file_handle, content_type="application/docx")
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
    
    return response




class MinutesOfMeetingsViewSet(viewsets.ModelViewSet):
    queryset = MinutesOfMeetings.objects.all().order_by("-date", "-created_at")
    serializer_class = MinutesOfMeetingsSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Expect: name, date, client, optional transcription text, optional file ("transcript_file")
        data = request.data.copy()
        user = request.user

        client = getattr(user, "client", None)
        if not client:
            raise ValidationError({"detail": "Authenticated user has no client assigned."})


        transcript_text = data.get("transcription") or None
        uploaded_file = request.FILES.get("transcription_file")

        if not transcript_text and not uploaded_file:
            raise ValidationError({
                "detail": "Either 'transcription' text or 'transcription_file' (.txt/.docx) is required."
            })

        # Run Gemini + DOCX generation before saving the record
        try:
            mom_text, relative_docx_path = process_minutes_of_meeting(
                transcript_text=transcript_text,
                uploaded_file=uploaded_file,
            )
        except Exception as exc:
            raise ValidationError({"detail": f"Failed to generate minutes: {exc}"})

        # Ensure DB stores the actual transcript and the generated MoM text
        data["transcription"] = transcript_text or ""  # filled by service if file was used
        data["output"] = mom_text
        data["client"] = client.id
        if relative_docx_path:
            # Get the full filesystem path
            full_path = os.path.join(settings.MEDIA_ROOT, relative_docx_path)
            
            # Read file into memory
            with open(full_path, 'rb') as f:
                file_content = f.read()
            
            # Create ContentFile (stays in memory, doesn't need open file)
            data["output_file"] = ContentFile(
                file_content, 
                name=os.path.basename(relative_docx_path)
            )
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)

        # Add URL to generated DOCX file in response (not stored in the model)
        docx_url = None
        if relative_docx_path:
            base = request.build_absolute_uri(settings.MEDIA_URL)
            docx_url = base + relative_docx_path

        response_data = serializer.data.copy()
        response_data["docx_url"] = docx_url

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
       
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        data = request.data.copy()
        client = getattr(request.user, "client", None)

        # Check if frontend indicates changes that require reprocessing
        changed = data.get("changed", "").lower() == "true"
        
        transcript_text = data.get("transcription")
        uploaded_file = request.FILES.get("transcription_file")
        
        # If changed flag is true, regenerate the minutes
        if changed:
            if not transcript_text and not uploaded_file:
                # If both are empty after changes, raise error
                if not instance.transcription and not instance.output_file:
                    raise ValidationError({
                        "detail": "Either 'transcription' text or 'transcription_file' is required."
                    })
                # Use existing transcription if nothing new provided
                transcript_text = instance.transcription
            
            try:
                mom_text, relative_docx_path = process_minutes_of_meeting(
                    transcript_text=transcript_text,
                    uploaded_file=uploaded_file,
                )
            except Exception as exc:
                raise ValidationError({"detail": f"Failed to generate minutes: {exc}"})
            
            # Update the data with new processed content
            data["output"] = mom_text
            data["client"] = client.id

            if transcript_text:
                data["transcription"] = transcript_text
            
            if relative_docx_path:
                # Get the full filesystem path
                full_path = os.path.join(settings.MEDIA_ROOT, relative_docx_path)
                
                # Read file into memory
                with open(full_path, 'rb') as f:
                    file_content = f.read()
                
                # Create ContentFile
                data["output_file"] = ContentFile(
                    file_content, 
                    name=os.path.basename(relative_docx_path)
                )
                
                # Delete old output file if it exists
                if instance.output_file:
                    old_file_path = instance.output_file.path
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
        data["client"] = client.id
        # Proceed with normal update
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        # Add URL to generated DOCX file in response
        docx_url = None
        if instance.output_file:
            base = request.build_absolute_uri(settings.MEDIA_URL)
            docx_url = base + instance.output_file.name

        response_data = serializer.data.copy()
        response_data["docx_url"] = docx_url

        return Response(response_data)
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class MailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = MailTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter by user's client
        user = self.request.user
        if user.client:
            return MailTemplate.objects.filter(client=user.client)
        return MailTemplate.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.client:
             raise ValidationError({"detail": "User has no client assigned."})
        serializer.save(created_by=user, client=user.client)


class SignatureViewSet(viewsets.ModelViewSet):
    serializer_class = SignatureSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter by user
        return Signature.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SendMailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        
        template_id = data.get('template_id')
        signature_id = data.get('signature_id')
        
        subject = data.get('subject')
        body = data.get('body')
        to_mails = data.get('to_mails')
        
        # Use Case 1: Template and Signature
        if template_id and signature_id:
            try:
                template = MailTemplate.objects.get(pk=template_id)
                signature = Signature.objects.get(pk=signature_id)
                
                # Check permissions (optional but recommended, e.g. client check)
                if template.client != request.user.client:
                     return Response({"detail": "Template not found."}, status=status.HTTP_404_NOT_FOUND)
                if signature.user != request.user:
                     return Response({"detail": "Signature not found."}, status=status.HTTP_404_NOT_FOUND)
                
                subject = template.subject
                # Combine body and signature
                tpl_body = template.body or ""
                sig_content = signature.content or ""
                
                full_html = f"{tpl_body}<br><br>{sig_content}"
                
                # Recipients from template
                if not to_mails:
                    to_mails = template.to_mails
                    
            except MailTemplate.DoesNotExist:
                return Response({"detail": "Template not found."}, status=status.HTTP_404_NOT_FOUND)
            except Signature.DoesNotExist:
                return Response({"detail": "Signature not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Use Case 2: Direct (subject, body, to_mails required)
        else:
            if not subject or not body or not to_mails:
                return Response({"detail": "Subject, body, and to_mails are required for direct sending."}, status=status.HTTP_400_BAD_REQUEST)
            full_html = body

        # Extract images
        processed_html, attachments = extract_images_and_replace_sources(full_html)
        
        # Parse recipients string to list if it's a string
        recipient_list = []
        if isinstance(to_mails, str):
            recipient_list = [email.strip() for email in to_mails.split(',') if email.strip()]
        elif isinstance(to_mails, list):
            recipient_list = to_mails
            
        if not recipient_list:
             return Response({"detail": "No valid recipients provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Send mail
        try:
            graph_service = MicrosoftGraphService()
            # We assume the sender is the configured system user or we could check request.user.email if we had that setup
            # For now, relying on graph_service default or provided user_id
            
            graph_service.send_mail(
                subject=subject,
                content=processed_html,
                to_recipients=recipient_list,
                attachments=attachments
            )
            
            return Response({"detail": "Email sent successfully."}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"detail": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
