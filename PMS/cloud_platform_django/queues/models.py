from django.db import models
from projects.models import Project

class Queue(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    queue_name = models.CharField(max_length=255)
    description = models.TextField()
    retry_count = models.IntegerField()
    truncate_date = models.DateTimeField()

    def __str__(self):
        return self.queue_name
    class Meta:
        db_table = "queue"

class QueueRecord(models.Model):
    queue = models.ForeignKey(Queue, on_delete=models.CASCADE)
    data = models.JSONField()
    status = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.queue.queue_name} - {self.status}"
    class Meta:
        db_table = "queue_records"