from rest_framework import serializers
from django.urls import reverse
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Document
        fields = ['id', 'name', 'content', 'created_at']

    def validate(self, data):
        user = self.context['request'].user
        name = data.get('name')

        if Document.objects.filter(user=user, name__iexact=name).exists():
            raise serializers.ValidationError(
                {"name": "Document name already exists for this user"}
            )

        return data


from rest_framework import serializers
from .models import FAQ

class FAQSerializer(serializers.ModelSerializer):
    video_file_url = serializers.SerializerMethodField(read_only=True)
    pdf_file_url = serializers.SerializerMethodField(read_only=True)
    txt_file_url = serializers.SerializerMethodField(read_only=True)
    json_file_url = serializers.SerializerMethodField(read_only=True)
    py_file_url = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = FAQ
        fields = [
            'id', 'title', 'description', 
            'video_file', 'pdf_file', 'txt_file', 'json_file', 'py_file',
            'video_file_url', 'pdf_file_url', 'txt_file_url', 
            'json_file_url', 'py_file_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_file_url(self, obj, field_name):
        request = self.context.get('request')
        file = getattr(obj, field_name)
        if file and request:
            return request.build_absolute_uri(file.url)
        return None

    def get_video_file_url(self, obj):
        # Return the streaming endpoint instead of direct storage URL
        request = self.context.get('request')
        if getattr(obj, 'video_file') and request:
            url = reverse('faq_video', kwargs={'pk': obj.pk})
            return request.build_absolute_uri(url)
        return None

    def get_pdf_file_url(self, obj):
        return self.get_file_url(obj, 'pdf_file')

    def get_txt_file_url(self, obj):
        return self.get_file_url(obj, 'txt_file')

    def get_json_file_url(self, obj):
        return self.get_file_url(obj, 'json_file')

    def get_py_file_url(self, obj):
        return self.get_file_url(obj, 'py_file')
