from django.db import models
import os
from accounts.models import User

class Document(models.Model):
    name = models.CharField(max_length=255)
    content = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="document_user",
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'documents'
        unique_together = ['name', 'user']


def upload_to_faq(instance, filename, folder):
    """Generic upload function for FAQ files"""
    return f'faq/{folder}/{filename}'

def upload_video(instance, filename):
    return upload_to_faq(instance, filename, 'videos')

def upload_pdf(instance, filename):
    return upload_to_faq(instance, filename, 'pdfs')

def upload_txt(instance, filename):
    return upload_to_faq(instance, filename, 'txts')

def upload_json(instance, filename):
    return upload_to_faq(instance, filename, 'jsons')

def upload_py(instance, filename):
    return upload_to_faq(instance, filename, 'py_files')


class FAQ(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    video_file = models.FileField(upload_to=upload_video, null=True, blank=True)
    pdf_file = models.FileField(upload_to=upload_pdf, null=True, blank=True)
    txt_file = models.FileField(upload_to=upload_txt, null=True, blank=True)
    json_file = models.FileField(upload_to=upload_json, null=True, blank=True)
    py_file = models.FileField(upload_to=upload_py, null=True, blank=True)

    class Meta:
        db_table = 'faqs'

    def __str__(self):
        return self.title