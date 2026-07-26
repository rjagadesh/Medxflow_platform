from rest_framework import serializers
from .models import MinutesOfMeetings, MailTemplate, Signature


class MinutesOfMeetingsSerializer(serializers.ModelSerializer):
    transcription_file = serializers.FileField(max_length=None, allow_empty_file=True, use_url=True)
    output_file = serializers.FileField(max_length=None, allow_empty_file=True, use_url=True)
    pdf_url = serializers.SerializerMethodField()


    class Meta:
        model = MinutesOfMeetings
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
    
    def get_pdf_url(self, obj):
        request = self.context.get("request")
        if not obj.output_file:
            return None
        return request.build_absolute_uri(f"/app/minutes-of-meeting/minutes/mom/pdf/{obj.pk}/")


class MailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailTemplate
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "client")


class SignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signature
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "user")
