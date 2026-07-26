from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import logging
import requests
from datetime import date, datetime
import base64

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

    @staticmethod
    def send_meeting_id_email(attendee_name, attendee_email, url, meeting_id):
        try:
            subject = "Your Meeting ID"
            logo_url = getattr(
                settings,
                "LOGO_URL",
                "https://dev-cloud.droidal.com/media/images/icon_3.ico/"
            )

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
                        color: #4CAF50;
                    }}
                    .details {{
                        background-color: #f9f9f9;
                        padding: 20px;
                        border-radius: 6px;
                        margin-top: 20px;
                        text-align: center;
                        font-size: 18px;
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

                    <h2>Meeting Created Successfully</h2>

                    <p>Hello <strong>{attendee_name}</strong>,</p>

                    <p>Your meeting has been created successfully.</p>
                    <div class="details">
                        <strong>Meeting URL:</strong>

                        {url}
                    </div>
                    <div class="details">
                        <strong>Meeting ID:</strong>

                        {meeting_id}
                    </div>

                    <p style="margin-top: 20px;">
                        Please keep this Meeting ID safe. You will need it to join the meeting.
                    </p>

                    <div class="footer">
                        <p>Best regards,
<strong>Droidal Cloud Platform</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """

            response = send_graph_email(attendee_email, subject, html_content)

            if response and response.status_code == 202:
                logger.info(f"✅ Meeting ID email sent to {attendee_email}")
                return True
            else:
                logger.error(f"❌ Failed to send meeting email to {attendee_email}")
                return False

        except Exception as e:
            logger.error(f"❌ Error sending meeting email: {str(e)}")
            return False
