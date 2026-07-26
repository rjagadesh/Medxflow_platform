from rest_framework import serializers
from .models import Project, Task, AssetDetails

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('tenant',)

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()
    apikey_value = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'project',
            'project_name',
            'task_name',
            'task_data',
            'description',
            'created_at',
            'updated_at',
            'apikey_value',  # show apikey in response
        ]

    def get_project_name(self, obj):
        return obj.project.project_name if obj.project else None

    def get_apikey_value(self, obj):
        return obj.apikey.api_key if obj.apikey else None

class TaskJsonSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'project', 'project_name', 'task_name', 'task_data']

    def get_project_name(self, obj):
        return obj.project.project_name if obj.project else None

class TaskCodeSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'project', 'project_name', 'task_name', 'python_code']

    def get_project_name(self, obj):
        return obj.project.project_name if obj.project else None

class AssetDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDetails
        fields = '__all__'

from rest_framework import serializers
from .models import UserAPIKey

class UserAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAPIKey
        fields = ["id", "key", "is_active", "created_at"]
