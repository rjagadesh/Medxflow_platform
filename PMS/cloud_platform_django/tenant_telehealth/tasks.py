from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import TelehealthMeeting, ScheduledMeetingAttendee
from .services import ChimeService
from .email_service import EmailService
import logging
from accounts.models import TeleHealthGuestAccessToken
from django.conf import settings
logger = logging.getLogger(__name__)


@shared_task
def check_and_send_reminder_emails():
    """
    Celery task to check for meetings starting in 15 minutes
    and send reminder emails
    Run this task every 5 minutes
    """
    now = timezone.now()
    reminder_time = now + timedelta(minutes=15)
    
    # Find meetings scheduled to start in approximately 15 minutes
    # Using a range to catch meetings within a 5-minute window
    meetings = TelehealthMeeting.objects.filter(
        scheduled_start_time__gte=reminder_time - timedelta(minutes=2),
        scheduled_start_time__lte=reminder_time + timedelta(minutes=2),
        reminder_email_sent=False,
        status='scheduled',
        is_active=True
    )
    
    for meeting in meetings:
        try:
            # Get scheduled attendees
            attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
            jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meetings.id)
            from django.conf import settings
            base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
            attendee = attendees.first()

            meeting_link = (
                f"{base_url}/patient-telehealth"
                f"?token={jointoken.token}"
                f"&meetingid={meeting.meeting_id}"
                f"&name={attendee.name if attendee else ''}"
            )
            # Send reminder emails
            if EmailService.send_meeting_reminder_email(meeting, attendees, meeting_link):
                meeting.reminder_email_sent = True
                meeting.save()
                logger.info(f"Reminder emails sent for meeting {meeting.id}")
        except Exception as e:
            logger.error(f"Error sending reminder for meeting {meeting.id}: {str(e)}")


@shared_task
def check_and_start_scheduled_meetings():
    """
    Celery task to check for meetings that should start now
    and create the actual Chime meeting
    Run this task every minute
    """
    now = timezone.now()
    
    # Find meetings scheduled to start within the next minute
    meetings = TelehealthMeeting.objects.filter(
        scheduled_start_time__lte=now + timedelta(minutes=1),
        scheduled_start_time__gte=now - timedelta(minutes=1),
        status='scheduled',
        is_active=True,
        meeting_id__isnull=True  # Meeting not yet created in Chime
    )
    
    for meeting in meetings:
        try:
            # Create the actual Chime meeting
            chime_service = ChimeService()
            meeting_info = chime_service.create_meeting()
            
            # Update meeting with Chime details
            meeting.meeting_id = meeting_info['meeting_id']
            meeting.external_meeting_id = meeting_info['external_meeting_id']
            meeting.media_region = meeting_info['media_region']
            meeting.media_placement = meeting_info['media_placement']
            meeting.actual_start_time = now
            meeting.status = 'started'
            meeting.save()
            jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meetings.id)
            # Generate meeting link (adjust based on your frontend URL structure)
            from django.conf import settings
            base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
            attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
            attendee = attendees.first()

            meeting_link = (
                f"{base_url}/patient-telehealth"
                f"?token={jointoken.token}"
                f"&meetingid={meeting.meeting_id}"
                f"&name={attendee.name if attendee else ''}"
            )

            
            # Send meeting started emails with link
            if EmailService.send_meeting_started_email(meeting, attendees, meeting_link):
                meeting.start_email_sent = True
                meeting.save()
            
            logger.info(f"Started meeting {meeting.id} and sent emails")
        except Exception as e:
            logger.error(f"Error starting meeting {meeting.id}: {str(e)}")


@shared_task
def cleanup_old_meetings():
    """
    Celery task to cleanup meetings that ended more than 24 hours ago
    Run this task once daily
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    # Find meetings that ended more than 24 hours ago
    old_meetings = TelehealthMeeting.objects.filter(
        actual_end_time__lt=cutoff_time,
        status='ended',
        is_active=True
    )
    
    for meeting in old_meetings:
        try:
            # Optionally delete from Chime if still exists
            if meeting.meeting_id:
                chime_service = ChimeService()
                try:
                    chime_service.delete_meeting(meeting.meeting_id)
                except Exception:
                    pass  # Meeting might already be deleted
            
            # Mark as inactive
            meeting.is_active = False
            meeting.save()
            
            logger.info(f"Cleaned up old meeting {meeting.id}")
        except Exception as e:
            logger.error(f"Error cleaning up meeting {meeting.id}: {str(e)}")


@shared_task
def send_meeting_summary_email(meeting_id):
    """
    Send meeting summary after meeting ends
    """
    try:
        meeting = TelehealthMeeting.objects.get(id=meeting_id)
        attendees = ScheduledMeetingAttendee.objects.filter(meeting=meeting)
        
        # Calculate meeting duration
        if meeting.actual_start_time and meeting.actual_end_time:
            duration = meeting.actual_end_time - meeting.actual_start_time
            duration_minutes = int(duration.total_seconds() / 60)
        else:
            duration_minutes = 0
        
        # Get recording info if available
        recordings = meeting.recordings.filter(status='completed')
        
        subject = f"Meeting Summary: {meeting.meeting_title}"
        
        for attendee in attendees:
            text_content = f"""
Hello {attendee.name},

Meeting Summary for "{meeting.meeting_title}":

Scheduled: {meeting.scheduled_start_time.strftime('%B %d, %Y at %I:%M %p')}
Actual Start: {meeting.actual_start_time.strftime('%B %d, %Y at %I:%M %p') if meeting.actual_start_time else 'N/A'}
Duration: {duration_minutes} minutes
{'Recordings Available: ' + str(recordings.count()) if recordings.exists() else 'No recordings available'}

Thank you for attending!
            """
            
            from django.core.mail import send_mail
            send_mail(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [attendee.email],
                fail_silently=True
            )
        
        logger.info(f"Summary email sent for meeting {meeting_id}")
    except Exception as e:
        logger.error(f"Error sending summary email for meeting {meeting_id}: {str(e)}")