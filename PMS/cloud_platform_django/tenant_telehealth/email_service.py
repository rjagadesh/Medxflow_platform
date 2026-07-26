from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import logging
import requests
from datetime import date, datetime
import base64
from accounts.models import TeleHealthGuestAccessToken
logger = logging.getLogger(__name__)

def send_graph_email(to_email, subject, html_content, attachment=None, name=None):
    """
    Send email using Microsoft Graph API
    """
    def format_recipients(to_email):
        # If single email → convert to list
        if isinstance(to_email, str):
            to_email = [to_email]
        # Now to_email is always a list
        return [{"emailAddress": {"address": email}} for email in to_email]
    
    if name is None:
        name = "attachment.pdf"

    TENANT_ID = '35800adc-eb69-4c43-b94c-66398463ce04'
    CLIENT_ID = '5aa2a216-4c93-4f35-a308-07fb498a463d'
    import os
    CLIENT_SECRET = os.getenv('AZURE_CLIENT_SECRET', '')
    SENDER_EMAIL = 'cloud@droidal.com'

    # Step 1: Get OAuth2 access token
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    token_data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default',
    }

    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()

    if 'access_token' not in token_json:
        logger.error(f"Failed to get token: {token_json}")
        return None

    access_token = token_json['access_token']

    # Step 2: Prepare email
    email_url = f"https://graph.microsoft.com/v1.0/users/{SENDER_EMAIL}/sendMail"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    email_data = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "html",
                "content": html_content
            },
            "toRecipients": format_recipients(to_email)
        },
        "saveToSentItems": "true"
    }

    if attachment:
        attachment_content = base64.b64encode(attachment.getvalue()).decode('utf-8')
        
        email_data["message"]["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": name,
                "contentType": "application/pdf",
                "contentBytes": attachment_content
            }
        ]

    # Step 3: Send the email
    response = requests.post(email_url, headers=headers, json=email_data)
    logger.info(f"Email sent - Status code: {response.status_code}")
    
    if response.status_code == 202:
        logger.info(f"✅ Email sent successfully to {to_email}")
    else:
        logger.error(f"❌ Failed to send email - Response: {response.text}")
    
    return response

class EmailService:
    """Service for sending meeting-related emails using Microsoft Graph API"""
    @staticmethod
    def send_appointment_updated_email(appointment, changed_fields=None):
        """
        Send appointment updated email to patient & provider
        """
        try:
            subject = "Appointment Updated"
            logo_url = getattr(
                settings,
                "LOGO_URL",
                "https://dev-cloud.droidal.com/media/images/icon_3.ico/"
            )

            recipients = []

            if appointment.patient and appointment.patient.email:
                recipients.append({
                    "email": appointment.patient.email,
                    "name": f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    "role": "Patient"
                })

            if appointment.provider and appointment.provider.email:
                recipients.append({
                    "email": appointment.provider.email,
                    "name": f"{appointment.provider.first_name} {appointment.provider.last_name}",
                    "role": "Provider"
                })

            if not recipients:
                logger.warning(
                    f"No recipients found for appointment {appointment.id}"
                )
                return False

            appt_datetime = timezone.make_aware(
                datetime.combine(appointment.date, appointment.time)
            )

            changes_html = ""
            if changed_fields:
                changes_html = "<ul>"
                for field, values in changed_fields.items():
                    changes_html += (
                        f"<li><strong>{field}</strong>: "
                        f"{values['old']} → {values['new']}</li>"
                    )
                changes_html += "</ul>"

            for r in recipients:
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{
                            font-family: Arial, sans-serif;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }}
                        .container {{
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #fff;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }}
                        .logo {{
                            max-width: 120px;
                            display: block;
                            margin: 0 auto 20px;
                        }}
                        h2 {{
                            text-align: center;
                            color: #2196F3;
                        }}
                        .details {{
                            background-color: #f9f9f9;
                            padding: 20px;
                            border-radius: 6px;
                            margin-top: 20px;
                        }}
                        .footer {{
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #777;
                            text-align: center;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <img src="{logo_url}" class="logo" />

                        <h2>Appointment Updated</h2>

                        <p>Hello <strong>{r["name"]}</strong>,</p>

                        <p>
                            Your appointment has been updated. Please review the latest details below.
                        </p>

                        <div class="details">
                            <p><strong>Patient:</strong> {appointment.patient.first_name} {appointment.patient.last_name}</p>
                            <p><strong>Provider:</strong> {appointment.provider.first_name} {appointment.provider.last_name}</p>
                            <p><strong>Date:</strong> {appt_datetime.strftime('%B %d, %Y')}</p>
                            <p><strong>Time:</strong> {appt_datetime.strftime('%I:%M %p')}</p>
                            <p><strong>Duration:</strong> {appointment.duration}</p>
                            <p><strong>Reason:</strong> {appointment.reason or "—"}</p>
                        </div>

                        {f"<h4>What changed:</h4>{changes_html}" if changes_html else ""}

                        <p style="margin-top: 20px;">
                            If you did not request this change, please contact support.
                        </p>

                        <div class="footer">
                            <p>Best regards,<br><strong>Droidal Cloud Platform</strong></p>
                        </div>
                    </div>
                </body>
                </html>
                """

                response = send_graph_email(
                    r["email"],
                    subject,
                    html_content
                )

                if response and response.status_code == 202:
                    logger.info(
                        f"✅ Appointment update email sent to {r['email']}"
                    )
                else:
                    logger.error(
                        f"❌ Failed to send appointment update email to {r['email']}"
                    )

            return True

        except Exception as e:
            logger.error(
                f"❌ Error sending appointment update email: {str(e)}"
            )
            return False
        
    @staticmethod
    def send_appointment_created_email(appointment):
        """
        Send appointment confirmation email (non-telehealth or telehealth-neutral)
        """
        try:
            subject = "Appointment Confirmed"
            logo_url = getattr(
                settings,
                "LOGO_URL",
                "https://dev-cloud.droidal.com/media/images/icon_3.ico/"
            )

            recipients = []

            if appointment.patient and appointment.patient.email:
                recipients.append({
                    "email": appointment.patient.email,
                    "name": f"{appointment.patient.first_name} {appointment.patient.last_name}",
                    "role": "Patient"
                })

            if appointment.provider and appointment.provider.email:
                recipients.append({
                    "email": appointment.provider.email,
                    "name": f"{appointment.provider.first_name} {appointment.provider.last_name}",
                    "role": "Provider"
                })

            if not recipients:
                logger.warning(
                    f"No recipients found for appointment {appointment.id}"
                )
                return False

            appt_datetime = timezone.make_aware(
                datetime.combine(appointment.date, appointment.time)
            )

            for r in recipients:
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{
                            font-family: Arial, sans-serif;
                            background-color: #f5f5f5;
                            padding: 0;
                            margin: 0;
                        }}
                        .container {{
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #fff;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }}
                        .logo {{
                            display: block;
                            margin: 0 auto 20px;
                            max-width: 120px;
                        }}
                        h2 {{
                            text-align: center;
                            color: #4CAF50;
                        }}
                        .details {{
                            background-color: #f9f9f9;
                            padding: 20px;
                            border-radius: 6px;
                            margin-top: 20px;
                        }}
                        .details p {{
                            margin: 8px 0;
                        }}
                        .footer {{
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #777;
                            text-align: center;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <img src="{logo_url}" class="logo" />

                        <h2>Appointment Confirmed</h2>

                        <p>Hello <strong>{r["name"]}</strong>,</p>

                        <p>
                            Your appointment has been successfully scheduled.
                        </p>

                        <div class="details">
                            <p><strong>Patient:</strong> {appointment.patient.first_name} {appointment.patient.last_name}</p>
                            <p><strong>Provider:</strong> {appointment.provider.first_name} {appointment.provider.last_name}</p>
                            <p><strong>Date:</strong> {appt_datetime.strftime('%B %d, %Y')}</p>
                            <p><strong>Time:</strong> {appt_datetime.strftime('%I:%M %p')}</p>
                            <p><strong>Duration:</strong> {appointment.duration}</p>
                            <p><strong>Reason:</strong> {appointment.reason or "—"}</p>
                        </div>

                        <p style="margin-top: 20px;">
                            Please arrive on time. Contact support if you need to reschedule.
                        </p>

                        <div class="footer">
                            <p>Best regards,<br><strong>Droidal Cloud Platform</strong></p>
                        </div>
                    </div>
                </body>
                </html>
                """

                response = send_graph_email(
                    r["email"],
                    subject,
                    html_content
                )

                if response and response.status_code == 202:
                    logger.info(
                        f"✅ Appointment email sent to {r['email']}"
                    )
                else:
                    logger.error(
                        f"❌ Failed to send appointment email to {r['email']}"
                    )

            return True

        except Exception as e:
            logger.error(
                f"❌ Error sending appointment email: {str(e)}"
            )
            return False

    @staticmethod
    def send_meeting_created_email(meeting, attendees):
        """Send email when meeting is scheduled"""
        try:
            subject = f"Meeting Scheduled: {meeting.meeting_title}"
            # Get logo URL from settings or use default
            logo_url = getattr(settings, 'LOGO_URL', 'https://dev-cloud.droidal.com/media/images/icon_3.ico/')
            
            for attendee in attendees:
                try:
                    # Validate attendee has email
                    if not attendee.email:
                        logger.warning(f"Attendee {attendee.name} has no email address")
                        continue
                    
                    organizer_name = meeting.created_by.get_full_name() if meeting.created_by else 'System'
                    jointoken = TeleHealthGuestAccessToken.objects.get(meeting_db_id=meeting.id)
                    base_url = getattr(settings, 'FRONTEND_URL', 'https://dev-cloud.droidal.com')
                    meeting_link = f"{base_url}/patient-telehealth?token={jointoken.token}&meetingid={meeting.meeting_id}&name={attendee.name}"

                    # HTML content with Droidal branding
                    join_button = ''
                    if meeting_link:
                        join_button = f'''
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{meeting_link}" style="display: inline-block; padding: 15px 40px; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Join Meeting Now
                            </a>
                        </div>
                        '''
                    html_content = f"""
                    <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }}
                            .container {{
                                max-width: 600px;
                                margin: 50px auto;
                                background-color: #fff;
                                padding: 30px;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }}
                            .logo {{
                                max-width: 120px;
                                margin-bottom: 20px;
                                display: block;
                                margin-left: auto;
                                margin-right: auto;
                            }}
                            h2 {{
                                color: #4CAF50;
                                text-align: center;
                            }}
                            .meeting-details {{
                                background-color: #f5f5f5;
                                padding: 20px;
                                border-radius: 5px;
                                margin: 20px 0;
                            }}
                            .meeting-details p {{
                                margin: 10px 0;
                                line-height: 1.6;
                            }}
                            .footer {{
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                font-size: 12px;
                                color: #888;
                                text-align: center;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
                            <h2>Meeting Scheduled</h2>
                            <p>Hello <strong>{attendee.name}</strong>,</p>
                            <p>A telehealth meeting has been scheduled:</p>
                            
                            <div class="meeting-details">
                                <p><strong>Title:</strong> {meeting.meeting_title}</p>
                                <p><strong>Description:</strong> {meeting.meeting_description or 'No description provided'}</p>
                                <p><strong>Start Time:</strong> {meeting.scheduled_start_time.strftime('%B %d, %Y at %I:%M %p')}</p>
                                <p><strong>End Time:</strong> {meeting.scheduled_end_time.strftime('%B %d, %Y at %I:%M %p')}</p>
                                <p><strong>Organized by:</strong> {organizer_name}</p>
                            </div>
                            <p style="color: #666;">You will receive a meeting link 15 minutes before the scheduled start time.</p>
                            
                            <div class="footer">
                                <p>Best regards,<br><strong>Droidal Cloud Platform</strong></p>
                                <p>If you have any questions, please contact support.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    response = send_graph_email(attendee.email, subject, html_content)
                    
                    if response and response.status_code == 202:
                        logger.info(f"✅ Meeting creation email sent to {attendee.email}")
                    else:
                        logger.error(f"❌ Failed to send email to {attendee.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send email to {attendee.email}: {str(e)}")
                    continue
            
            return True
        except Exception as e:
            logger.error(f"❌ Error sending meeting creation emails: {str(e)}")
            return False
    
    @staticmethod
    def send_meeting_reminder_email(meeting, attendees, meeting_link=None):
        """Send reminder email 15 minutes before meeting"""
        try:
            subject = f"Meeting Reminder: {meeting.meeting_title} starts in 15 minutes"
            logo_url = getattr(settings, 'LOGO_URL', 'https://dev-cloud.droidal.com/media/images/icon_3.ico/')

            
            for attendee in attendees:
                try:
                    if not attendee.email:
                        logger.warning(f"Attendee {attendee.name} has no email address")
                        continue
                    
                    # Join button HTML
                    join_button = ''
                    if meeting_link:
                        join_button = f'''
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{meeting_link}" style="display: inline-block; padding: 15px 40px; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Join Meeting Now
                            </a>
                        </div>
                        '''
                    
                    html_content = f"""
                    <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }}
                            .container {{
                                max-width: 600px;
                                margin: 50px auto;
                                background-color: #fff;
                                padding: 30px;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }}
                            .logo {{
                                max-width: 120px;
                                margin-bottom: 20px;
                                display: block;
                                margin-left: auto;
                                margin-right: auto;
                            }}
                            h2 {{
                                color: #FF9800;
                                text-align: center;
                            }}
                            .reminder-box {{
                                background-color: #fff3cd;
                                padding: 20px;
                                border-radius: 5px;
                                margin: 20px 0;
                                border-left: 4px solid #FF9800;
                            }}
                            .footer {{
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                font-size: 12px;
                                color: #888;
                                text-align: center;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
                            <h2>Meeting Reminder</h2>
                            <p>Hello <strong>{attendee.name}</strong>,</p>
                            <p><strong style="color: #FF9800;">Your meeting starts in 15 minutes!</strong></p>
                            
                            <div class="reminder-box">
                                <p><strong>Title:</strong> {meeting.meeting_title}</p>
                                <p><strong>Start Time:</strong> {meeting.scheduled_start_time.strftime('%B %d, %Y at %I:%M %p')}</p>
                            </div>
                            
                            {join_button if meeting_link else '<p style="color: #666;">The meeting link will be sent shortly.</p>'}
                            
                            <div class="footer">
                                <p>Best regards,<br><strong>Droidal Cloud Platform</strong></p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    response = send_graph_email(attendee.email, subject, html_content)
                    
                    if response and response.status_code == 202:
                        logger.info(f"✅ Meeting reminder email sent to {attendee.email}")
                    else:
                        logger.error(f"❌ Failed to send reminder to {attendee.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send reminder to {attendee.email}: {str(e)}")
                    continue
            
            return True
        except Exception as e:
            logger.error(f"❌ Error sending meeting reminder emails: {str(e)}")
            return False
    
    @staticmethod
    def send_meeting_started_email(meeting, attendees, meeting_link):
        """Send email with meeting link when meeting starts"""
        try:
            subject = f"Meeting Started: {meeting.meeting_title} - Join Now"
            logo_url = getattr(settings, 'LOGO_URL', 'https://dev-cloud.droidal.com/media/images/icon_3.ico/')

            
            for attendee in attendees:
                try:
                    if not attendee.email:
                        logger.warning(f"Attendee {attendee.name} has no email address")
                        continue
                    
                    organizer_name = meeting.created_by.get_full_name() if meeting.created_by else 'System'
                    
                    html_content = f"""
                    <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }}
                            .container {{
                                max-width: 600px;
                                margin: 50px auto;
                                background-color: #fff;
                                padding: 30px;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }}
                            .logo {{
                                max-width: 120px;
                                margin-bottom: 20px;
                                display: block;
                                margin-left: auto;
                                margin-right: auto;
                            }}
                            h2 {{
                                color: #4CAF50;
                                text-align: center;
                            }}
                            .btn {{
                                display: inline-block;
                                padding: 15px 40px;
                                margin-top: 20px;
                                font-size: 18px;
                                color: #fff;
                                background-color: #4CAF50;
                                text-decoration: none;
                                border-radius: 5px;
                                font-weight: bold;
                            }}
                            .link-box {{
                                background-color: #f5f5f5;
                                padding: 15px;
                                border-radius: 5px;
                                margin: 20px 0;
                                word-break: break-all;
                                font-size: 14px;
                            }}
                            .footer {{
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                font-size: 12px;
                                color: #888;
                                text-align: center;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
                            <h2>Meeting Started!</h2>
                            <p>Hello <strong>{attendee.name}</strong>,</p>
                            <p>The meeting <strong>"{meeting.meeting_title}"</strong> has started!</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a class="btn" href="{meeting_link}">Join Meeting Now</a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
                            <div class="link-box">
                                {meeting_link}
                            </div>
                            
                            <div class="footer">
                                <p>Best regards,<br><strong>{organizer_name}</strong></p>
                                <p><strong>Droidal Cloud Platform</strong></p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    response = send_graph_email(attendee.email, subject, html_content)
                    
                    if response and response.status_code == 202:
                        logger.info(f"✅ Meeting started email sent to {attendee.email}")
                    else:
                        logger.error(f"❌ Failed to send start email to {attendee.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send start email to {attendee.email}: {str(e)}")
                    continue
            
            return True
        except Exception as e:
            logger.error(f"❌ Error sending meeting started emails: {str(e)}")
            return False
    
    @staticmethod
    def send_meeting_cancelled_email(meeting, attendees):
        """Send email when meeting is cancelled"""
        try:
            subject = f"Meeting Cancelled: {meeting.meeting_title}"
            logo_url = getattr(settings, 'LOGO_URL', 'https://dev-cloud.droidal.com/media/images/icon_3.ico/')

            
            for attendee in attendees:
                try:
                    if not attendee.email:
                        logger.warning(f"Attendee {attendee.name} has no email address")
                        continue
                    
                    html_content = f"""
                    <html>
                    <head>
                        <style>
                            body {{
                                font-family: Arial, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }}
                            .container {{
                                max-width: 600px;
                                margin: 50px auto;
                                background-color: #fff;
                                padding: 30px;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }}
                            .logo {{
                                max-width: 120px;
                                margin-bottom: 20px;
                                display: block;
                                margin-left: auto;
                                margin-right: auto;
                            }}
                            h2 {{
                                color: #f44336;
                                text-align: center;
                            }}
                            .cancel-box {{
                                background-color: #ffebee;
                                padding: 20px;
                                border-radius: 5px;
                                margin: 20px 0;
                                border-left: 4px solid #f44336;
                            }}
                            .footer {{
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                font-size: 12px;
                                color: #888;
                                text-align: center;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
                            <h2>Meeting Cancelled</h2>
                            <p>Hello <strong>{attendee.name}</strong>,</p>
                            
                            <div class="cancel-box">
                                <p>The meeting <strong>"{meeting.meeting_title}"</strong> scheduled for:</p>
                                <p><strong>{meeting.scheduled_start_time.strftime('%B %d, %Y at %I:%M %p')}</strong></p>
                                <p>has been <strong>cancelled</strong>.</p>
                            </div>
                            
                            <p>If you have any questions, please contact the organizer.</p>
                            
                            <div class="footer">
                                <p>Best regards,<br><strong>Droidal Cloud Platform</strong></p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    response = send_graph_email(attendee.email, subject, html_content)
                    
                    if response and response.status_code == 202:
                        logger.info(f"✅ Meeting cancellation email sent to {attendee.email}")
                    else:
                        logger.error(f"❌ Failed to send cancellation to {attendee.email}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send cancellation to {attendee.email}: {str(e)}")
                    continue
            
            return True
        except Exception as e:
            logger.error(f"❌ Error sending meeting cancellation emails: {str(e)}")
            return False