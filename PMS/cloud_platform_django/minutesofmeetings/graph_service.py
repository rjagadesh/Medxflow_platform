import os
import requests
from django.conf import settings

class MicrosoftGraphService:
    BASE_URL = "https://graph.microsoft.com/v1.0"
    
    def __init__(self):
        self.tenant_id = os.getenv("AZURE_TENANT_ID")
        self.client_id = os.getenv("AZURE_CLIENT_ID")
        self.client_secret = os.getenv("AZURE_CLIENT_SECRET")
        self.scope = "https://graph.microsoft.com/.default"
        
        # We can also check settings if env vars are not directly found, 
        # assuming django-environ loads them into settings or os.environ
        
    def get_access_token(self):
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            raise ValueError("Azure credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are missing.")

        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'client_id': self.client_id,
            'scope': self.scope,
            'client_secret': self.client_secret,
            'grant_type': 'client_credentials'
        }
        
        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to obtain access token: {str(e)}")

    def send_mail(self, subject, content, to_recipients, user_id=None, attachments=None, save_to_sent_items=True):
        """
        user_id: The userPrincipalName or ID of the user to send mail from. 
                 If None, uses os.getenv("AZURE_SENDER_EMAIL")
        to_recipients: List of email addresses strings
        """
        if not user_id:
            user_id = os.getenv("AZURE_SENDER_EMAIL")
            
        if not user_id:
            raise ValueError("Sender User ID is required")
            
        token = self.get_access_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Prepare recipients
        to_list = [{"emailAddress": {"address": email.strip()}} for email in to_recipients if email.strip()]
        
        email_msg = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": content
                },
                "toRecipients": to_list
            },
            "saveToSentItems": save_to_sent_items
        }
        
        if attachments:
            email_msg["message"]["attachments"] = attachments

        url = f"{self.BASE_URL}/users/{user_id}/sendMail"
        
        try:
            response = requests.post(url, headers=headers, json=email_msg)
            if response.status_code != 202: # 202 Accepted is the typical success response for sendMail
                # Sometimes it might return other codes, but 202 is documented for sendMail
                # However, response.raise_for_status() will handle 4xx and 5xx.
                pass 
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                error_msg += f" Response: {e.response.text}"
            raise Exception(f"Failed to send email: {error_msg}")
