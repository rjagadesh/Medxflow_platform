from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab
# 1. Tell Celery which Django settings module to use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cloudproject.settings')

# 2. Create Celery application instance
app = Celery('cloudproject')

# 3. Load Celery settings from Django settings.py (only keys starting with CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# 4. Auto-discover tasks from all Django apps
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'check-reminder-emails-every-5-minutes': {
        'task': 'tenant_telehealth.tasks.check_and_send_reminder_emails',
        'schedule': 300.0,  # Every 5 minutes (in seconds)
    },
    'check-and-start-meetings-every-minute': {
        'task': 'tenant_telehealth.tasks.check_and_start_scheduled_meetings',
        'schedule': 60.0,  # Every minute
    },
    'cleanup-old-meetings-daily': {
        'task': 'tenant_telehealth.tasks.cleanup_old_meetings',
        'schedule': crontab(hour=2, minute=0),  # Every day at 2 AM
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')