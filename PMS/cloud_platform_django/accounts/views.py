from django.shortcuts import render
from django.contrib.auth.backends import ModelBackend
from .models import User,Client,AppVersion, SummaryReportAlert, InvoiceAlert
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import *
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from projects.models import Project, Task
from licenses.models import Machine
from trigger.models import TriggerDetails
from queues.models import Queue  # adjust import to your queue app
from rest_framework.decorators import api_view, permission_classes
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
import six
from django.db.models import Q
import json
import random
from django.db.models import Sum,Count
from rest_framework import generics
import os
import uuid
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes, force_str
import logging
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from reportlab.pdfgen import canvas
from datetime import timedelta, datetime
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from django.db.models import Case, When, F, Value, DecimalField
from django.template.loader import render_to_string
from django.http import HttpResponse, FileResponse
import pdfkit
import shutil
from xhtml2pdf import pisa
from rest_framework.decorators import api_view, permission_classes, authentication_classes
import base64
from modules.models import LogRecords
import pyotp
import qrcode
from django.db import transaction
import re
from modules.views import ModuleListAPIView,AppListAPIView
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from rest_framework.test import APIRequestFactory

logger = logging.getLogger(__name__)

class UserPasswordResetTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk) + six.text_type(timestamp) +
            six.text_type(user.is_active)
        )

password_reset_token = UserPasswordResetTokenGenerator()

 
class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}{user.is_active}"
 
email_token_generator = EmailVerificationTokenGenerator()
class UserSearchAPIView(APIView):
    # permission_classes = [IsAuthenticated]   # remove if public
    permission_classes = [AllowAny] 

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        # search by username OR mail (case-insensitive)
        users = User.objects.filter(
            Q(mail__icontains=query) | Q(username__icontains=query),
            roles="client"
        )[:10]

        serializer = UserSearchSerializer(users, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    users = User.objects.all().values()
    return Response(list(users))

class RegisterAPIView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send verification email
            send_verification_email(user, request)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
User = get_user_model()

class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(username=username)

            if not user.user_verify:
                # Log the failed attempt for unverified user
                LogRecords.objects.create(
                    user=user,
                    log_type="login",
                    log_status="failed",
                    description=f"Failed login attempt for unverified user {user.username}."
                )

            # Check if user is verified
            if not user.user_verify:
                return Response(
                    {
                        'detail': 'Your account is not verified. '
                                  'Please check your email for the verification link.'
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check password
            if check_password(password, user.password):
                # Store user info in session
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                request.session['user_role'] = str(user.roles)
                request.session['is_authenticated'] = True
 
                # Log successful login
                log = LogRecords.objects.create(
                    user=user,
                    log_type="login",
                    log_status="success",
                    description=f"User {user.username} logged in successfully."
                )

                # Check if MFA enabled
                if user.mfa_enabled:
                    return Response(
                        {
                            "mfa_required": True,
                            "user_id": user.id,
                            "detail": "MFA verification required.",
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    # MFA not enabled, issue JWT tokens as usual
                    refresh = RefreshToken.for_user(user)
                    return Response(
                        {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                            'user_role': str(user.roles),
                            'user_name': str(user.username),
                            'user_id': str(user.id),
                            'success': True,
                        },
                        status=status.HTTP_200_OK,
                    )
            else:
                LogRecords.objects.create(
                    user=user,
                    log_type="login",
                    log_status="failed",
                    description=f"Failed login attempt for user {user.username} (invalid password)."
                )
                return Response(
                    {'detail': 'Invalid password.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        except User.DoesNotExist:
            LogRecords.objects.create(
                user=None,
                log_type="login",
                description=f"Failed login attempt for non-existent username '{username}'."
            )
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

class UserListAPIView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins can see all users of their client
        return User.objects.filter(client=self.request.user.client)


class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # User can only manage users in their client
        return User.objects.filter(client=self.request.user.client)

class UserCreateAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Only admins or client-level users should be allowed
        if self.request.user.roles not in ["admin", "client"]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not allowed to create users.")
        serializer.save()

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            user = request.user
 
            # Store logout info in session
            request.session['is_authenticated'] = False
            request.session['logout_time'] = str(token.current_time)  # optional: store logout time
            request.session['user_id'] = user.id
            request.session['username'] = user.username
            request.session['user_role'] = str(user.roles)
 
            # Save logout record in LogRecords table
            LogRecords.objects.create(
                user=user,
                log_type="logout",
                log_status="success",
                description=f"User {user.username} logged out successfully."
            )

            return Response({"message": "Logged out successfully"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            LogRecords.objects.create(
                user=request.user if request.user.is_authenticated else None,
                log_type="logout",
                log_status="failed",
                description=f"Logout failed for user {request.user.username if request.user.is_authenticated else 'Unknown'}: {str(e)}"
            )
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "projects_count": Project.objects.filter(tenant=user).count(),
            "tasks_count": Task.objects.filter(project__tenant=user).count(),
            "triggers_count": TriggerDetails.objects.filter(user=user).count(),
            "queues_count": Queue.objects.filter(project__tenant=user).count(),
            "machines_count": Machine.objects.filter(client=user).count(),
        }
        return Response(data)


class LoggedInUserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            serializer = UserDetailsSerializer(user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "User details not found", "detail": str(e)}, 
                status=status.HTTP_404_NOT_FOUND
            )
        

token_generator = PasswordResetTokenGenerator()

@api_view(['POST'])
@permission_classes([AllowAny]) 
@authentication_classes([])  # 👈 disables token authentication for this view
def forgot_password(request):
    email = request.data.get('mail')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(mail=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = password_reset_token.make_token(user)
    current_site = get_current_site(request)
    reset_link = f"https://{current_site.domain}/reset-password/{uidb64}/{token}/"

    subject = "Password Reset Request"
    logo_url = f"https://{current_site.domain}/media/images/icon_3.ico/"

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
                text-align: center;
            }}
            h2 {{
                color: #d9534f;
            }}
            p {{
                line-height: 1.6;
            }}
            .btn {{
                display: inline-block;
                padding: 12px 25px;
                margin-top: 20px;
                font-size: 16px;
                color: #fff;
                background-color: #d9534f;
                text-decoration: none;
                border-radius: 5px;
            }}
            .footer {{
                margin-top: 30px;
                font-size: 12px;
                color: #888;
            }}
            .logo {{
                max-width: 120px;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
            <h2>Hello {user.first_name} {user.last_name},</h2>
            <p>You requested a password reset for your <b>Droidal Cloud</b> account. Click the button below to reset your password:</p>
            <a class="btn" href="{reset_link}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
            <p class="footer">This link will expire soon for your security.</p>
        </div>
    </body>
    </html>
    """

    # Use Graph API instead of Django send_mail
    send_graph_email(email, subject, html_content)

    return Response({"message": "Password reset link sent"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny]) 
@authentication_classes([])  # 👈 disables token authentication for this view
def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)

    if not password_reset_token.check_token(user, token):
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not new_password or not confirm_password:
        return Response({"error": "Both password fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)



logger = logging.getLogger(__name__)

# def generate_license_pdf(client_object, user_object):
#     """
#     Renders the professional HTML license certificate and converts it to a PDF.
#     """
#     print("DEBUG: Starting PDF generation...")
#     start_date = client_object.created_date or datetime.now()
    
#     # Handle the end date, which can be None for perpetual licenses
#     if client_object.end_date:
#         end_date_str = client_object.end_date.strftime('%d %b %Y')
#     else:
#         one_year_later = start_date + timedelta(days=365)
#         end_date_str = one_year_later.strftime('%d %b %Y')
    
#     # Prepare the context dictionary with all the data for the template
#     context = {
#         'certificate_id': f"CERT-{client_object.id}-{datetime.now().strftime('%Y%m%d')}",
#         'issue_date': start_date.strftime('%d %b %Y'),
        
#         # New Licensee Info
#         'licensee_name': f"{user_object.first_name} {user_object.last_name}",
#         'client_name': client_object.client_name,
#         'licensee_email': user_object.mail,
#         'licensee_tax_id': user_object.tax_id or "N/A",
        
#         # License Table Items
#         'items': [
#             {
#                 'quantity': f"{client_object.dev_count} Dev, {client_object.prod_count} Prod",
#                 'product_name': f"Droidal License - {client_object.license_tier.capitalize()} Tier",
#                 'start_date': start_date.strftime('%d %b %Y'),
#                 'end_date': end_date_str,
#                 'license_key': client_object.license_key
#             }
#         ]
#     }

#     # Load and render the HTML template
#     # Ensure 'license_certificate.html' is in your app's 'templates' folder
#     html = render_to_string('license.html', context)
    
#     # Create the PDF
#     result = BytesIO()
#     pdf = pisa.CreatePDF(BytesIO(html.encode("UTF-8")), dest=result)

#     if not pdf.err:
#         print("DEBUG: PDF generated successfully.")
#         result.seek(0)
#         return result
#     else:
#         print(f"ERROR: PDF generation failed: {pdf.err}")
#         return None
    
class ClientRegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Extract email from request data before serialization
        email_to_send = request.data.get('mail') or request.user.mail
        
        serializer = ClientRegisterSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            client = serializer.save()
            
            # Beautiful HTML email template
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Droidal License Certificate</title>
                <style>
                    body {{
                        font-family: "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.6;
                        color: #4a5568;
                        background-color: #f7fafc;
                        margin: 0;
                        padding: 20px;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #0a2541 0%, #1e40af 100%);
                        color: white;
                        padding: 30px 40px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .header h2 {{
                        margin: 10px 0 0 0;
                        font-size: 16px;
                        font-weight: 400;
                        opacity: 0.9;
                    }}
                    .content {{
                        padding: 40px;
                    }}
                    .welcome-message {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .welcome-message h3 {{
                        color: #0a2541;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }}
                    .welcome-message p {{
                        color: #718096;
                        font-size: 16px;
                    }}
                    .info-section {{
                        background-color: #f8fafc;
                        border-radius: 8px;
                        padding: 25px;
                        margin: 25px 0;
                        border-left: 4px solid #0a2541;
                    }}
                    .info-section h4 {{
                        color: #0a2541;
                        margin-top: 0;
                        margin-bottom: 15px;
                        font-size: 18px;
                    }}
                    .license-table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }}
                    .license-table th {{
                        background-color: #0a2541;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 14px;
                    }}
                    .license-table td {{
                        padding: 12px;
                        border-bottom: 1px solid #e2e8f0;
                        background-color: #ffffff;
                    }}
                    .license-table tr:last-child td {{
                        border-bottom: none;
                    }}
                    .license-key {{
                        font-family: "SF Mono", "Courier New", monospace;
                        color: #2b6cb0;
                        font-weight: 500;
                        word-break: break-all;
                        font-size: 12px;
                    }}
                    .attachment-notice {{
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: #2b6cb0;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 25px 0;
                    }}
                    .attachment-notice strong {{
                        font-size: 18px;
                        display: block;
                        margin-bottom: 5px;
                    }}
                    .footer {{
                        background-color: #f8fafc;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    }}
                    .footer p {{
                        margin: 5px 0;
                        color: #718096;
                        font-size: 14px;
                    }}
                    .footer strong {{
                        color: #0a2541;
                    }}
                    .terms {{
                        background-color: #fef5e7;
                        border: 1px solid #f6d55c;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 20px 0;
                    }}
                    .terms h5 {{
                        color: #92400e;
                        margin-top: 0;
                        margin-bottom: 10px;
                    }}
                    .terms p {{
                        color: #92400e;
                        font-size: 12px;
                        margin: 0;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>License Certificate</h1>
                        <h2>Proof of Purchase & Official Right to Use</h2>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h3>Congratulations!</h3>
                            <p>Your license has been successfully generated and is ready to use.</p>
                        </div>
                        
                        <div class="attachment-notice">
                            <strong>📎 PDF Certificate Attached</strong>
                            <p>Your official license certificate is attached to this email as a PDF document.</p>
                        </div>
                        
                        <div class="info-section">
                            <h4>License Information</h4>
                            <table class="license-table">
                                <thead>
                                    <tr>
                                        <th>Client Name</th>
                                        <th>License Tier</th>
                                        <th>Development</th>
                                        <th>Production</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>{client.client_name}</strong></td>
                                        <td>{client.license_tier.capitalize()}</td>
                                        <td>{client.dev_count} Licenses</td>
                                        <td>{client.prod_count} Licenses</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <table class="license-table" style="margin-top: 15px;">
                                <thead>
                                    <tr>
                                        <th>License Key</th>
                                        <th>Valid From</th>
                                        <th>Valid Until</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="license-key">{client.license_key}</td>
                                        <td>{client.created_date.strftime('%d %b %Y') if client.created_date else 'N/A'}</td>
                                        <td>{client.end_date.strftime('%d %b %Y') if client.end_date else 'Perpetual'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="terms">
                            <h5>Important Notice</h5>
                            <p>Please save the attached PDF certificate for your records. This license is non-transferable and subject to our End-User License Agreement (EULA).</p>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px; color: #718096;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p><strong>Droidal</strong></p>
                        <p>4th Floor, Mohan Business Park, Coimbatore</p>
                        <p style="margin-top: 15px; font-size: 12px;">Thank you for choosing Droidal!</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            print(f"Sending email to: {email_to_send}")
            
            pdf_buffer = generate_license_pdf(client, request.user)
            
            if pdf_buffer:
                subject = f"Your License Certificate - {client.client_name}"
                send_graph_email(
                    to_email=email_to_send,
                    subject=subject,
                    html_content=html_content,
                    attachment=pdf_buffer
                )
                
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="license-{client.client_id}.pdf"'
                return response
            else:
                return Response({"error": "Failed to generate PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

 


class ClientUserCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ClientUserCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            result = serializer.save()
            client = result["client"]
            user = result["user"]
            
            # Beautiful welcome email for new users
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Droidal</title>
                <style>
                    body {{
                        font-family: "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.6;
                        color: #4a5568;
                        background-color: #f7fafc;
                        margin: 0;
                        padding: 20px;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #0a2541 0%, #1e40af 100%);
                        color: white;
                        padding: 30px 40px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .header h2 {{
                        margin: 10px 0 0 0;
                        font-size: 16px;
                        font-weight: 400;
                        opacity: 0.9;
                    }}
                    .content {{
                        padding: 40px;
                    }}
                    .welcome-message {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .welcome-message h3 {{
                        color: #0a2541;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }}
                    .welcome-message p {{
                        color: #718096;
                        font-size: 16px;
                    }}
                    .user-info {{
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 25px 0;
                    }}
                    .user-info strong {{
                        font-size: 18px;
                        display: block;
                        margin-bottom: 5px;
                    }}
                    .info-section {{
                        background-color: #f8fafc;
                        border-radius: 8px;
                        padding: 25px;
                        margin: 25px 0;
                        border-left: 4px solid #0a2541;
                    }}
                    .info-section h4 {{
                        color: #0a2541;
                        margin-top: 0;
                        margin-bottom: 15px;
                        font-size: 18px;
                    }}
                    .license-table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }}
                    .license-table th {{
                        background-color: #0a2541;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 14px;
                    }}
                    .license-table td {{
                        padding: 12px;
                        border-bottom: 1px solid #e2e8f0;
                        background-color: #ffffff;
                    }}
                    .license-table tr:last-child td {{
                        border-bottom: none;
                    }}
                    .license-key {{
                        font-family: "SF Mono", "Courier New", monospace;
                        color: #2b6cb0;
                        font-weight: 500;
                        word-break: break-all;
                        font-size: 12px;
                    }}
                    .footer {{
                        background-color: #f8fafc;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    }}
                    .footer p {{
                        margin: 5px 0;
                        color: #718096;
                        font-size: 14px;
                    }}
                    .footer strong {{
                        color: #0a2541;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>Welcome to Droidal!</h1>
                        <h2>Your Account & License Certificate</h2>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h3>Hello {user.first_name} {user.last_name}!</h3>
                            <p>Welcome to Droidal! Your account has been created successfully and your license certificate is ready.</p>
                        </div>
                        
                        <div class="user-info">
                            <strong>📎 PDF Certificate Attached</strong>
                            <p>Your official license certificate is attached to this email as a PDF document.</p>
                        </div>
                        
                        <div class="info-section">
                            <h4>Account Information</h4>
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Email:</strong> {user.mail}</p>
                        </div>
                        
                        <div class="info-section">
                            <h4>License Details</h4>
                            <table class="license-table">
                                <thead>
                                    <tr>
                                        <th>Client Name</th>
                                        <th>License Tier</th>
                                        <th>Development</th>
                                        <th>Production</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>{client.client_name}</strong></td>
                                        <td>{client.license_tier.capitalize()}</td>
                                        <td>{client.dev_count} Licenses</td>
                                        <td>{client.prod_count} Licenses</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <table class="license-table" style="margin-top: 15px;">
                                <thead>
                                    <tr>
                                        <th>License Key</th>
                                        <th>Valid From</th>
                                        <th>Valid Until</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="license-key">{client.license_key}</td>
                                        <td>{client.created_date.strftime('%d %b %Y') if client.created_date else 'N/A'}</td>
                                        <td>{client.end_date.strftime('%d %b %Y') if client.end_date else 'Perpetual'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px; color: #718096;">
                            You can now access our platform and start using your licensed software. If you have any questions, our support team is here to help!
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p><strong>Droidal</strong></p>
                        <p>4th Floor, Mohan Business Park, Coimbatore</p>
                        <p style="margin-top: 15px; font-size: 12px;">Thank you for choosing Droidal!</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            pdf_buffer = generate_license_pdf(client, user)
            
            if pdf_buffer:
                subject = f"Welcome to Droidal - Your License Certificate"
                send_graph_email(
                    to_email=user.mail,
                    subject=subject,
                    html_content=html_content,
                    attachment=pdf_buffer
                )
                
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="license-{client.client_id}.pdf"'
                return response
            else:
                return Response({"error": "Failed to generate PDF."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

class ClientListView(APIView):
    def get(self, request):
        # Get all clients
        clients = Client.objects.all()
        
        # --- Manual Filters ---
        
        # Client name filter (case-insensitive partial match)
        client_name = request.query_params.get('client_name', None)
        if client_name:
            clients = clients.filter(client_name__icontains=client_name)
        
        # Development licenses filters
        dev_count = request.query_params.get('dev_count', None)
        if dev_count:
            clients = clients.filter(dev_count=int(dev_count))
            
        dev_count_min = request.query_params.get('dev_count_min', None)
        if dev_count_min:
            clients = clients.filter(dev_count__gte=int(dev_count_min))
            
        dev_count_max = request.query_params.get('dev_count_max', None)
        if dev_count_max:
            clients = clients.filter(dev_count__lte=int(dev_count_max))
        
        # Production licenses filters
        prod_count = request.query_params.get('prod_count', None)
        if prod_count:
            clients = clients.filter(prod_count=int(prod_count))
            
        prod_count_min = request.query_params.get('prod_count_min', None)
        if prod_count_min:
            clients = clients.filter(prod_count__gte=int(prod_count_min))
            
        prod_count_max = request.query_params.get('prod_count_max', None)
        if prod_count_max:
            clients = clients.filter(prod_count__lte=int(prod_count_max))
        
        # ✅ ADDED: VM licenses filters
        vm_count = request.query_params.get('vm_count', None)
        if vm_count:
            clients = clients.filter(vm_count=int(vm_count))
            
        vm_count_min = request.query_params.get('vm_count_min', None)
        if vm_count_min:
            clients = clients.filter(vm_count__gte=int(vm_count_min))
            
        vm_count_max = request.query_params.get('vm_count_max', None)
        if vm_count_max:
            clients = clients.filter(vm_count__lte=int(vm_count_max))
        
        # License tier filter (case-insensitive)
        license_tier = request.query_params.get('license_tier', None)
        if license_tier:
            clients = clients.filter(license_tier__iexact=license_tier)
        
        # Activation date filters (created_date)
        created_date = request.query_params.get('created_date', None)
        if created_date:
            clients = clients.filter(created_date__date=created_date)
            
        created_date_after = request.query_params.get('created_date_after', None)
        if created_date_after:
            clients = clients.filter(created_date__date__gte=created_date_after)
            
        created_date_before = request.query_params.get('created_date_before', None)
        if created_date_before:
            clients = clients.filter(created_date__date__lte=created_date_before)
        
        # Expiration date filters (end_date)
        end_date = request.query_params.get('end_date', None)
        if end_date:
            clients = clients.filter(end_date__date=end_date)
            
        end_date_after = request.query_params.get('end_date_after', None)
        if end_date_after:
            clients = clients.filter(end_date__date__gte=end_date_after)
            
        end_date_before = request.query_params.get('end_date_before', None)
        if end_date_before:
            clients = clients.filter(end_date__date__lte=end_date_before)
            
        # ✅ ADDED: Effective date filters
        effective_date = request.query_params.get('effective_date', None)
        if effective_date:
            clients = clients.filter(effective_date__date=effective_date)
            
        effective_date_after = request.query_params.get('effective_date_after', None)
        if effective_date_after:
            clients = clients.filter(effective_date__date__gte=effective_date_after)
            
        effective_date_before = request.query_params.get('effective_date_before', None)
        if effective_date_before:
            clients = clients.filter(effective_date__date__lte=effective_date_before)
            
        # Filter for clients with unlimited licenses (end_date is null)
        end_date_is_null = request.query_params.get('end_date_is_null', None)
        if end_date_is_null:
            if end_date_is_null.lower() == 'true':
                clients = clients.filter(end_date__isnull=True)
            elif end_date_is_null.lower() == 'false':
                clients = clients.filter(end_date__isnull=False)
        
        # Status filter (case-insensitive)
        status_filter = request.query_params.get('status', None)
        if status_filter:
            clients = clients.filter(status__iexact=status_filter)
        
        # --- Ordering ---
        ordering = request.query_params.get('ordering', '-created_at')
        valid_orderings = [
            'created_at', '-created_at', 
            'client_name', '-client_name', 
            'license_tier', '-license_tier',
            'dev_count', '-dev_count',
            'prod_count', '-prod_count',
            'vm_count', '-vm_count',  # ✅ ADDED: VM count ordering
            'effective_date', '-effective_date',  # ✅ ADDED: Effective date ordering
            'end_date', '-end_date',
            'status', '-status'
        ]
        
        if ordering in valid_orderings:
            clients = clients.order_by(ordering)
        else:
            clients = clients.order_by('-created_at')
        
        # --- Pagination ---
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get("page_size", 50))
        result_page = paginator.paginate_queryset(clients, request)
        
        # --- Serialize Data ---
        serializer = ClientSerializer(result_page, many=True)
        
        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

class LoginView(APIView):
    def post(self, request):
        logger.debug(f"LoginView POST request data: {request.data}")

        username = request.data.get("username") or request.data.get("client_name")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(first_name=username, is_active=True)
        except User.DoesNotExist:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            client = Client.objects.get(client_name=user, status="Active")
        except Client.DoesNotExist:
            return Response({"error": "Client not found or inactive"}, status=status.HTTP_404_NOT_FOUND)

        # Store user_id in session
        request.session['user_id'] = user.id
        logger.debug(f"Session user_id set: {request.session['user_id']}")  # just to confirm

        return Response({
            "success": True,
            "message": "Login successful",
            "client_id": client.client_id,
            "license_key": client.license_key,
            "project": client.project,
            "session_user_id": request.session['user_id']  # also return it in response for testing
        }, status=status.HTTP_200_OK)


# class ValidateLicenseView(APIView):
#     def post(self, request):
#         logger.debug(f"ValidateLicenseView POST request headers: {request.headers}")
#         logger.debug(f"ValidateLicenseView POST request data: {request.data}")
#         username = request.data.get('username')
#         license_key = request.data.get('license_key')
#         machine_ip = request.data.get('machine_ip')
        
#         if not username or not license_key:
#             logger.error("Missing username or license_key")
#             return Response({"message": "Username and license key are required"}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             client = Client.objects.get(client_name__first_name=username)
#         except Client.DoesNotExist:
#             logger.error(f"Client not found for username: {username}")
#             return Response({"message": "Invalid username"}, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             logger.error(f"License status: {username} {client.status}")
#             if client.license_key != license_key:
#                 logger.error(f"Invalid license key for username: {username}")
#                 return Response({"message": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST)
#             if client.status != "Active":
#                 logger.error(f"License not active for username: {username}")
#                 return Response({"message": "License is not active"}, status=status.HTTP_400_BAD_REQUEST)
#             if client.end_date and client.end_date < timezone.now():
#                 logger.error(f"License expired for username: {username}")
#                 return Response({"message": "License has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
#             if machine_ip:
#                 client.machine_ip = machine_ip
#                 client.save()
            
#             response_data = {
#                 "valid": True,
#                 "client_id": client.client_id,
#                 "start_date": client.created_date.isoformat() if client.created_date else None,
#                 "end_date": client.end_date.isoformat() if client.end_date else None,
#                 "status": client.status
#             }
#             logger.debug(f"License validated successfully for username: {username}")
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Exception as e:
#             logger.error(f"Unexpected error in ValidateLicenseView: {str(e)}", exc_info=True)
#             return Response({"message": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def dashboard_data(request):
    total_users = User.objects.count()
    dev_count = Client.objects.aggregate(total_dev=Sum('dev_count'))['total_dev'] or 0
    prod_count = Client.objects.aggregate(total_prod=Sum('prod_count'))['total_prod'] or 0
    total_machines = Client.objects.exclude(machine_ip__isnull=True).exclude(machine_ip='').count()
    
    # Sample pulse rate data (replace with actual data source in production)
    current_time = datetime.now()
    pulse_data = [
        {
            "timestamp": (current_time - timedelta(minutes=60-i)).strftime("%H:%M"),
            "pulse": random.randint(60, 100)
        } for i in range(60)
    ]

    data = {
        "total_users": total_users,
        "dev_count": dev_count,
        "prod_count": prod_count,
        "total_machines": total_machines,
        "pulse_data": pulse_data
    }
    return JsonResponse(data)




def client_list(request):
    clients = Client.objects.all().select_related('client_name')
    data = []
    for client in clients:
        data.append({
            "id": client.id,
            "client_id": client.client_id,
            "client_name": client.client_name.first_name,
            "project": client.project,
            "dev_count": client.dev_count,
            "prod_count": client.prod_count,
            "license_key": client.license_key,
            "created_date": client.created_date,
            "end_date": client.end_date,
            "machine_ip": client.machine_ip,
            "status": client.status
        })
    return JsonResponse({"clients": data})

@csrf_exempt
@require_http_methods(["POST"])
def edit_client(request, client_id):
    try:
        client = Client.objects.get(id=client_id)
        body = json.loads(request.body)
        client.project = body.get("project", client.project)
        client.dev_count = body.get("dev_count", client.dev_count)
        client.prod_count = body.get("prod_count", client.prod_count)
        client.status = body.get("status", client.status)
        client.save()
        return JsonResponse({"message": "Client updated successfully"})
    except Client.DoesNotExist:
        return JsonResponse({"error": "Client not found"}, status=404)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_client(request, client_id):
    try:
        client = Client.objects.get(id=client_id)
        client.delete()
        return JsonResponse({"message": "Client deleted successfully"})
    except Client.DoesNotExist:
        return JsonResponse({"error": "Client not found"}, status=404)

def get_user_details(request):
    users = list(User.objects.values(
        'id', 'first_name', 'mobile', 'mail', 'tax_id', 'address', 'contact_name'
    ))
    return JsonResponse(users, safe=False)

@csrf_exempt
def register_client(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            client_id = data.get('client_id')
            user_id = data.get('first_name')  # actually user ID
            password = data.get('password')
            project = data.get('project')
            dev_count = data.get('dev_count')
            prod_count = data.get('prod_count')

            # Validate unique client_id
            if Client.objects.filter(client_id=client_id).exists():
                return JsonResponse({"error": "Client ID already exists."}, status=400)

            # Get User FK
            user_obj = get_object_or_404(User, pk=user_id)

            # Create Client
            client = Client(
                client_id=client_id,
                client_name=user_obj,
                password=make_password(password),
                project=project,
                dev_count=dev_count,
                prod_count=prod_count,
                status="Active"
            )
            client.save()

            # Generate PDF
            pdf_buffer = generate_client_pdf(client)
            filename = f"{uuid.uuid4()}.pdf"
            pdf_path = os.path.join(settings.MEDIA_ROOT, 'client_pdfs', filename)
            os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
            with open(pdf_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())

            return JsonResponse({
                "message": "Client registered successfully",
                "client_id": client.id,
                "pdf_filename": filename
            }, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)

def registration_success(request, client_id):
    client = get_object_or_404(Client, id=client_id)
    return JsonResponse({
        "client_id": client.client_id,
        "client_name": client.client_name.first_name,
        "project": client.project,
        "dev_count": client.dev_count,
        "prod_count": client.prod_count,
        "license_key": client.license_key,
        "status": client.status
    })

def download_pdf(request, filename):
    pdf_path = os.path.join(settings.MEDIA_ROOT, 'client_pdfs', filename)
    return FileResponse(open(pdf_path, 'rb'), as_attachment=True, filename='client_details.pdf')



try:
    pdfmetrics.registerFont(TTFont('Roboto', 'Roboto-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('RobotoBold', 'Roboto-Bold.ttf'))
except:
    # Fallback if custom fonts aren't available
    logger = logging.getLogger(__name__)
    logger.warning("Custom fonts not available, using default fonts")

class HeaderCanvas(canvas.Canvas):
    """Custom canvas to add logo to each page"""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []
        
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
        
    def save(self):
        page_count = len(self.pages)
        for page_num in range(page_count):
            self.__dict__.update(self.pages[page_num])
            self.draw_header()
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
        
    def draw_header(self):
        """Draw logo in top left corner of each page"""
        try:
            # Try to add logo - replace with your actual logo path
            self.drawImage("logo.png", 0.5*inch, letter[1] - 1.5*inch, 
                          width=2*inch, height=1*inch, mask='auto')
        except:
            # Fallback: draw a placeholder rectangle for logo
            self.setStrokeColor(colors.grey)
            self.setFillColor(colors.lightgrey)
            self.rect(0.5*inch, letter[1] - 1.5*inch, 2*inch, 1*inch, fill=1)
            self.setFillColor(colors.black)
            self.setFont("Helvetica", 10)
            self.drawCentredText(1.5*inch, letter[1] - 1*inch, "LOGO")


from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageTemplate, Frame
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line
from reportlab.graphics import renderPDF
from io import BytesIO
from datetime import datetime
import logging

class HeaderCanvas(canvas.Canvas):
    """Custom canvas class to add headers, footers, decorative elements, and logo"""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        
    def showPage(self):
        self._draw_header()
        self._draw_footer()
        self._draw_decorative_elements()
        canvas.Canvas.showPage(self)
        
    def save(self):
        self._draw_header()
        self._draw_footer()
        self._draw_decorative_elements()
        canvas.Canvas.save(self)
        
    def _draw_header(self):
        """Draw professional header with logo and company info"""
        # Header background rectangle
        self.setFillColor(colors.HexColor("#0085CA"))
        self.rect(0, letter[1] - 80, letter[0], 80, fill=1, stroke=0)
        
        # Draw logo in top left corner
        # Replace 'logo.png' with the path to your actual logo image file
        try:
            self.drawImage('logo.png', 30, letter[1] - 70, width=1*inch, height=1*inch, mask='auto')
        except:
            logging.warning("Logo image not found; skipping logo rendering. Please provide a valid logo.png file.")
        
        # Company name in header (shifted slightly to accommodate logo)
        self.setFillColor(colors.white)
        self.setFont("Helvetica-Bold", 18)
        self.drawCentredString(letter[0]/2, letter[1] - 35, "HEALTH PARTNERS MANAGEMENT GROUP")
        
        self.setFont("Helvetica", 12)
        self.drawCentredString(letter[0]/2, letter[1] - 55, "Professional Software Licensing Division")
        
    def _draw_footer(self):
        """Draw footer with contact information and security elements"""
        # Footer line
        self.setStrokeColor(colors.HexColor("#0085CA"))
        self.setLineWidth(2)
        self.line(50, 50, letter[0] - 50, 50)
        
        # Footer text
        self.setFillColor(colors.HexColor("#666666"))
        self.setFont("Helvetica", 8)
        footer_text = [
            "Health Partners Management Group, Incorporated",
            "Corporate Headquarters • Licensed Software Division",
            f"Certificate Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            "This certificate is digitally secured and tamper-evident"
        ]
        
        y_pos = 35
        for line in footer_text:
            self.drawCentredString(letter[0]/2, y_pos, line)
            y_pos -= 10
            
    def _draw_decorative_elements(self):
        """Add decorative border elements and security patterns"""
        # Corner decorative elements
        self.setStrokeColor(colors.HexColor("#0085CA"))
        self.setLineWidth(3)
        
        # Top left corner
        self.line(30, letter[1] - 100, 80, letter[1] - 100)  # Horizontal
        self.line(30, letter[1] - 100, 30, letter[1] - 150)  # Vertical
        
        # Top right corner
        self.line(letter[0] - 80, letter[1] - 100, letter[0] - 30, letter[1] - 100)  # Horizontal
        self.line(letter[0] - 30, letter[1] - 100, letter[0] - 30, letter[1] - 150)  # Vertical
        
        # Bottom left corner
        self.line(30, 70, 80, 70)  # Horizontal
        self.line(30, 70, 30, 120)  # Vertical
        
        # Bottom right corner
        self.line(letter[0] - 80, 70, letter[0] - 30, 70)  # Horizontal
        self.line(letter[0] - 30, 70, letter[0] - 30, 120)  # Vertical
        
        # Security watermark pattern (subtle)
        self.setStrokeColor(colors.HexColor("#F0F8FF"))
        self.setLineWidth(0.5)
        for i in range(10, int(letter[0]), 20):
            for j in range(100, int(letter[1] - 100), 20):
                self.circle(i, j, 2, fill=0, stroke=1)

def create_decorative_drawing():
    """Create a decorative element for the certificate"""
    d = Drawing(400, 100)
    
    # Add decorative lines and shapes
    d.add(Line(50, 50, 350, 50, strokeColor=colors.HexColor("#0085CA"), strokeWidth=2))
    d.add(Circle(75, 50, 15, fillColor=colors.HexColor("#E8F4FD"), strokeColor=colors.HexColor("#0085CA"), strokeWidth=2))
    d.add(Circle(325, 50, 15, fillColor=colors.HexColor("#E8F4FD"), strokeColor=colors.HexColor("#0085CA"), strokeWidth=2))
    
    return d

def generate_client_pdf(client):
    """
    Generate a professional license certificate PDF for a client
    
    Args:
        client: Object with attributes (client_id, client_name,  license_key)
    """
    buffer = BytesIO()
    
    # Create document with custom canvas
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    
    # Define frame for content (leaving space for header and footer)
    frame = Frame(0.75*inch, 1*inch, letter[0] - 1.5*inch, letter[1] - 2*inch,
                  leftPadding=20, bottomPadding=20, rightPadding=20, topPadding=20)
    
    # Create page template
    template = PageTemplate(id='normal', frames=frame)
    doc.addPageTemplates([template])
    
    # Create comprehensive styles
    styles = getSampleStyleSheet()
    
    # Main certificate title style
    certificate_title_style = ParagraphStyle(
        'CertificateTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=38,
        textColor=colors.HexColor("#0085CA"),
        alignment=TA_CENTER,
        spaceAfter=15,
        spaceBefore=30,
        leading=45
    )
    
    # Subtitle style
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=16,
        textColor=colors.HexColor("#4A5568"),
        alignment=TA_CENTER,
        spaceAfter=30,
        leading=20
    )
    
    # Certification statement style
    cert_statement_style = ParagraphStyle(
        'CertStatementStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        textColor=colors.HexColor("#2D3748"),
        alignment=TA_CENTER,
        spaceAfter=40,
        spaceBefore=25,
        leading=18,
        leftIndent=30,
        rightIndent=30
    )
    
    # Section header style
    section_header_style = ParagraphStyle(
        'SectionHeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor("#0085CA"),
        alignment=TA_CENTER,
        spaceAfter=25,
        spaceBefore=30,
        borderWidth=1,
        borderColor=colors.HexColor("#0085CA"),
        borderPadding=8,
        backColor=colors.HexColor("#F7FAFC")
    )
    
    # Table styles
    table_label_style = ParagraphStyle(
        'TableLabelStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor("#2D3748"),
        alignment=TA_LEFT,
        leading=16
    )
    
    table_value_style = ParagraphStyle(
        'TableValueStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.HexColor("#1A202C"),
        alignment=TA_LEFT,
        leading=16
    )
    
    # Special value styles
    license_key_style = ParagraphStyle(
        'LicenseKeyStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=10,
        textColor=colors.HexColor("#E53E3E"),
        alignment=TA_CENTER,
        backColor=colors.HexColor("#FED7D7"),
        borderWidth=1,
        borderColor=colors.HexColor("#E53E3E"),
        borderPadding=8,
        leading=14,
        spaceBefore=10,
        spaceAfter=10
    )
    
    # Authority statement style
    authority_style = ParagraphStyle(
        'AuthorityStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor("#4A5568"),
        alignment=TA_JUSTIFY,
        spaceBefore=30,
        spaceAfter=25,
        leading=15,
        leftIndent=15,
        rightIndent=15
    )
    
    # Signature area style
    signature_style = ParagraphStyle(
        'SignatureStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#2D3748"),
        alignment=TA_CENTER,
        spaceBefore=40,
        leading=13
    )
    
    # Create elements list
    elements = []
    
    # FIRST PAGE - Certificate Cover
    elements.append(Spacer(1, 0.3*inch))
    
    # Add decorative element
    decorative_drawing = create_decorative_drawing()
    elements.append(decorative_drawing)
    elements.append(Spacer(1, 0.2*inch))
    
    # Main certificate title
    title = Paragraph("SOFTWARE LICENSE", certificate_title_style)
    elements.append(title)
    
    title2 = Paragraph("CERTIFICATE", certificate_title_style)
    elements.append(title2)
    
    # Subtitle
    subtitle = Paragraph("Official Authorization Document", subtitle_style)
    elements.append(subtitle)
    
    # Certification statement
    cert_statement = Paragraph(
        """This certificate hereby confirms that the named licensee has been granted 
        official authorization to use the specified software product in accordance 
        with the terms and conditions of the licensing agreement.""",
        cert_statement_style
    )
    elements.append(cert_statement)
    
    # Add some decorative spacing
    elements.append(Spacer(1, 0.8*inch))
    
    # SECOND SECTION - License Details (no explicit PageBreak to avoid extra page)
    elements.append(Spacer(1, 0.2*inch))
    
    # Section header
    details_header = Paragraph("LICENSE INFORMATION", section_header_style)
    elements.append(details_header)
    
    # Client details table with enhanced styling
    current_date = datetime.now().strftime("%B %d, %Y")
    expiry_date = datetime.now().replace(year=datetime.now().year + 1).strftime("%B %d, %Y")
    
    table_data = [
        [Paragraph("License Holder:", table_label_style), 
         Paragraph(f"<b>{client.client_name}</b>", table_value_style)],
        [Paragraph("Client Identification:", table_label_style), 
         Paragraph(f"#{client.client_id}", table_value_style)],
        # [Paragraph("Contact Email:", table_label_style), 
        #  Paragraph(client.email, table_value_style)],
        [Paragraph("Issue Date:", table_label_style), 
         Paragraph(current_date, table_value_style)],
        [Paragraph("Valid Until:", table_label_style), 
         Paragraph(expiry_date, table_value_style)],
        [Paragraph("License Status:", table_label_style), 
         Paragraph("<font color='#38A169'><b>● ACTIVE & VALID</b></font>", table_value_style)],
        [Paragraph("License Classification:", table_label_style), 
         Paragraph("Professional Enterprise License", table_value_style)],
    ]
    
    # Enhanced table styling
    client_table = Table(table_data, colWidths=[2.3*inch, 4*inch], rowHeights=[0.4*inch]*len(table_data))
    client_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#EDF2F7")),
        ('BACKGROUND', (1, 1), (1, 1), colors.HexColor("#F7FAFC")),
        ('BACKGROUND', (1, 3), (1, 3), colors.HexColor("#F7FAFC")),
        ('BACKGROUND', (1, 5), (1, 5), colors.HexColor("#F7FAFC")),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E0")),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor("#0085CA")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#0085CA")),
        ('BACKGROUND', (1, 5), (1, 5), colors.HexColor("#F0FFF4")),
    ]))
    
    elements.append(client_table)
    elements.append(Spacer(1, 0.25*inch))
    
    # License Key Section
    license_section = Paragraph("SECURE LICENSE KEY", section_header_style)
    elements.append(license_section)
    
    # License key in special formatting
    license_key_para = Paragraph(f"<b>{client.license_key}</b>", license_key_style)
    elements.append(license_key_para)
    elements.append(Spacer(1, 0.2*inch))
    
    # Authority statement
    authority_text = """
    This license certificate is issued under the authority of Health Partners Management Group, 
    Incorporated, and serves as official documentation of software usage rights. The license key 
    provided above must be used for software activation and is unique to this certificate holder. 
    Unauthorized distribution, modification, or misuse of this license information is strictly 
    prohibited and may result in immediate license revocation and legal action.
    """
    authority_para = Paragraph(authority_text, authority_style)
    elements.append(authority_para)
    
    # Terms and compliance section
    terms_header = Paragraph("TERMS & COMPLIANCE", section_header_style)
    elements.append(terms_header)
    
    terms_text = """
    • This certificate must be retained for audit and compliance purposes<br/>
    • Software usage is subject to the terms outlined in the End User License Agreement<br/>
    • License is non-transferable and tied to the specified user account<br/>
    • Regular compliance audits may be conducted to verify proper usage<br/>
    • Support services are available during the license validity period<br/>
    • Renewal notice will be provided 30 days prior to expiration
    """
    terms_para = Paragraph(terms_text, authority_style)
    elements.append(terms_para)
    
    # Digital signature area
    elements.append(Spacer(1, 0.3*inch))
    signature_text = """
    <b>AUTHORIZED BY:</b><br/>
    Digital Certificate Authority<br/>
    Health Partners Management Group<br/>
    <i>This document is digitally signed and secured</i>
    """
    signature_para = Paragraph(signature_text, signature_style)
    elements.append(signature_para)
    
    # Build the document
    try:
        doc.build(elements, canvasmaker=HeaderCanvas)
        buffer.seek(0)
        return buffer
    except Exception as e:
        logging.error(f"Error generating PDF: {str(e)}")
        raise

class ClientInfo:
    """Example client class - replace with your actual client model"""
    def __init__(self, client_id, client_name,  license_key):
        self.client_id = client_id
        self.client_name = client_name
        # self.email = email
        self.license_key = license_key

logger = logging.getLogger(__name__)

@csrf_exempt
def validate_license(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # email = data.get('email')
            password = data.get('password')
            license_key = data.get('license_key')
            machine_ip = data.get('machine_ip')

            logger.debug(f"Received request with license_key: {license_key}, machine_ip: {machine_ip}")

            if not all([ password, license_key, machine_ip]):
                return JsonResponse({'valid': False, 'message': 'Missing required fields'}, status=400)

            # Get client by email and license_key
            client = Client.objects.filter( license_key=license_key).first()
            
            # Check password
            if not check_password(password, client.password):
                return JsonResponse({'valid': False, 'message': 'Invalid password'})

            # Check if already active on another machine
            if client.status == 'active' and client.machine_ip and client.machine_ip != machine_ip:
                return JsonResponse({'valid': False, 'message': 'License is active on another machine. Deactivate first.'}, status=403)

            # Update license usage details
            current_date = timezone.now()
            client.machine_ip = machine_ip
            if client.created_date is None:
                client.created_date = current_date
            if client.end_date is None:
                client.end_date = current_date + timedelta(days=30)
            client.status = 'active'
            client.save()

            return JsonResponse({
                'valid': True,
                'message': 'License validated successfully',
                'client_name': client.client_name,
                'client_id': client.client_id,
                'start_date': client.created_date.isoformat(),
                'end_date': client.end_date.isoformat(),
                'status': client.status
            })

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return JsonResponse({'valid': False, 'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Server error in validate_license: {str(e)}")
            return JsonResponse({'valid': False, 'message': f'Server error: {str(e)}'}, status=500)

    return JsonResponse({'valid': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def deactivate_license(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # email = data.get('email')
            license_key = data.get('license_key')

            if not all([license_key]):
                return JsonResponse({'success': False, 'message': 'Missing required fields'}, status=400)

            client = Client.objects.filter( license_key=license_key).first()
            if not client:
                return JsonResponse({'success': False, 'message': 'Invalid email or license key'}, status=404)

            client.machine_ip = None
            client.status = 'none'
            client.save()

            return JsonResponse({'success': True, 'message': 'License deactivated successfully'})
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return JsonResponse({'success': False, 'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Server error in deactivate_license: {str(e)}")
            return JsonResponse({'success': False, 'message': f'Server error: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

@api_view(['GET'])
def increase_version(request, app_name):
    app_version, created = AppVersion.objects.get_or_create(app_name=app_name)
    if not created:  # If it already existed → increment version
        new_version = app_version.increment_version()
    else:  # If new app → keep default 0.0.1
        new_version = app_version.version

    return Response(
        {"app_name": app_version.app_name, "version": new_version},
        status=status.HTTP_200_OK
    )

# GET API → Just show current version
@api_view(['GET'])
def get_version(request, app_name):
    try:
        app_version = AppVersion.objects.get(app_name=app_name)
        serializer = AppVersionSerializer(app_version)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except AppVersion.DoesNotExist:
        return Response({"error": "App not found"}, status=status.HTTP_404_NOT_FOUND)
    

class ClientCreateView(generics.ListCreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientgetSerializer
    permission_classes = [IsAuthenticated]  # ensures only logged-in users can create

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UsergetSerializer


class LicenseUsersDetails(APIView):
 
    permission_classes = [AllowAny]
 
    def get(self, request):
        user_name = request.query_params.get('user_name')
        if not user_name:
            return Response({"error": "User not logged in"}, status=status.HTTP_401_UNAUTHORIZED)
       
        try:
            print(user_name)
            user = User.objects.get(username=user_name)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
       
        serializer = LicenseUsersDetailsSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LicenseValidationAPIView(APIView):
    def post(self, request):
        serializer = LicenseValidationSerializer(data=request.data)
        if serializer.is_valid():
            client = serializer.save()
            return Response(
                {
                    "message": "License validated successfully",
                    "client_id": client.client_id,
                    "client_name": client.client_name,
                    "machine_ip": client.machine_ip,
                    'valid':True
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
def generate_verification_token(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_token_generator.make_token(user)
    return uid, token
 
def send_verification_email(user, request):
    uid, token = generate_verification_token(user)
    current_site = get_current_site(request)
    verify_link = f"https://{current_site.domain}/app/account/verify-email/{uid}/{token}/"
     
    subject = "Verify Your Email Address"
    
    # Replace this with your hosted logo URL or base64-encoded image
    logo_url = f"https://{current_site.domain}/media/images/icon_3.ico/"

    content = f"""
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
                text-align: center;
            }}
            h2 {{
                color: #0078d4;
            }}
            p {{
                line-height: 1.6;
            }}
            .btn {{
                display: inline-block;
                padding: 12px 25px;
                margin-top: 20px;
                font-size: 16px;
                color: #fff;
                background-color: #0078d4;
                text-decoration: none;
                border-radius: 5px;
            }}
            .footer {{
                margin-top: 30px;
                font-size: 12px;
                color: #888;
            }}
            .logo {{
                max-width: 120px;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <img class="logo" src="{logo_url}" alt="Droidal Logo" />
            <h2>Hello {user.first_name} {user.last_name},</h2>
            <p>Thank you for registering on <b>Droidal Cloud</b>. Please verify your email address to get started.</p>
            <a class="btn" href="{verify_link}">Verify Email</a>
            <p class="footer">If you did not sign up, please ignore this email.</p>
        </div>
    </body>
    </html>
    """

    send_graph_email(user.mail, subject, content)


import requests
def send_graph_email(to_email, subject, html_content, attachment=None, name=None):
    def format_recipients(to_email):
        # If single email → convert to list
        if isinstance(to_email, str):
            to_email = [to_email]

        # Now to_email is always a list
        return [{"emailAddress": {"address": email}} for email in to_email]
    
    if name == None:
        name = "license.pdf"

    TENANT_ID = '35800adc-eb69-4c43-b94c-66398463ce04'
    CLIENT_ID = '5aa2a216-4c93-4f35-a308-07fb498a463d'
    CLIENT_SECRET = os.getenv('AZURE_CLIENT_SECRET', '')
    SCOPE = 'https://graph.microsoft.com/.default'

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
        print("Failed to get token:", token_json)
        exit(1)

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
    print("Status code:", response.status_code)
    print("Response:", response.text)
    return response
 
from django.shortcuts import redirect

@api_view(['GET'])    
def verify_email(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({'error': 'Invalid UID'}, status=400)

    if email_token_generator.check_token(user, token):
        user.user_verify = True
        user.save()
        # Redirect to login page after successful verification
        current_site = get_current_site(request)
        return redirect(f"https://{current_site.domain}/login/?verified-status=true")
    else:
        return Response({'error': 'Invalid or expired token'}, status=400)

# def generate_license_pdf(client_object, user_object):
#     """
#     Generates a PDF license certificate for a client and saves it in MEDIA_ROOT.
#     File name is derived from client email (portion before '@'), sanitized safely.
#     """
#     print("DEBUG: Starting PDF generation...")

#     start_date = client_object.created_date or datetime.now()

#     # Handle end date (can be None for perpetual licenses)
#     if client_object.end_date:
#         end_date_str = client_object.end_date.strftime('%d %b %Y')
#     else:
#         one_year_later = start_date + timedelta(days=365)
#         end_date_str = one_year_later.strftime('%d %b %Y')

#     # Prepare template context
#     context = {
#         'certificate_id': f"CERT-{client_object.client_id}-{datetime.now().strftime('%Y%m%d')}",
#         'issue_date': start_date.strftime('%d %b %Y'),
#         'licensee_name': f"{user_object.first_name} {user_object.last_name}",
#         'client_name': client_object.client_name,
#         'licensee_email': user_object.mail,
#         'licensee_tax_id': getattr(user_object, 'tax_id', 'N/A'),
#         'items': [
#             {
#                 'quantity': f"{client_object.dev_count} Dev, {client_object.prod_count} Prod",
#                 'product_name': f"Droidal License - {client_object.license_tier.capitalize()} Tier",
#                 'start_date': start_date.strftime('%d %b %Y'),
#                 'end_date': end_date_str,
#                 'license_key': client_object.license_key
#             }
#         ]
#     }

#     # Render HTML
#     html = render_to_string('license.html', context)

#     # ✅ Generate safe filename from email (before '@')
#     email = user_object.mail or "unknown_email"
#     base_name = email.split('@')[0]  # take part before '@'
#     safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', base_name)  # replace special chars with '_'
#     file_name = f"{safe_name}_license.pdf"

#     # ✅ Define save path (MEDIA_ROOT/license_pdfs/)
#     save_dir = os.path.join(settings.MEDIA_ROOT, "license_pdfs")
#     os.makedirs(save_dir, exist_ok=True)

#     save_path = os.path.join(save_dir, file_name)

#     # ✅ Generate and save PDF
#     with open(save_path, "wb") as output_file:
#         pdf_status = pisa.CreatePDF(BytesIO(html.encode("UTF-8")), dest=output_file)

#     if not pdf_status.err:
#         print(f"✅ PDF generated successfully: {save_path}")
#         return save_path  # return file path
#     else:
#         print(f"❌ PDF generation failed with error: {pdf_status.err}")
#         return None

def generate_license_pdf(client_object, user_object):
    """
    Renders the professional HTML license certificate, converts it to a PDF,
    and prepends frontpage.pdf from MEDIA_ROOT if available.
    """

    print("DEBUG: Starting PDF generation...")

    start_date = client_object.created_date or datetime.now()

    # Handle end date
    if client_object.end_date:
        end_date_str = client_object.end_date.strftime('%d %b %Y')
    else:
        one_year_later = start_date + timedelta(days=365)
        end_date_str = one_year_later.strftime('%d %b %Y')

    # Template context
    context = {
        'certificate_id': f"CERT-{client_object.client_id}-{datetime.now().strftime('%Y%m%d')}",
        'issue_date': start_date.strftime('%d %b %Y'),

        'licensee_name': f"{user_object.first_name} {user_object.last_name}",
        'client_name': client_object.client_name,
        'licensee_email': user_object.mail,
        'licensee_tax_id': user_object.tax_id or "N/A",

        'items': [
            {
                'quantity': f"{client_object.dev_count} Dev, {client_object.prod_count} Prod",
                'product_name': f"Droidal License - {client_object.license_tier.capitalize()} Tier",
                'start_date': start_date.strftime('%d %b %Y'),
                'end_date': end_date_str,
                'license_key': client_object.license_key
            }
        ]
    }

    print("DEBUG: Rendering HTML template...")
    html = render_to_string('license.html', context)

    # Generate certificate PDF
    print("DEBUG: Generating certificate PDF...")
    certificate_buffer = BytesIO()
    pdf = pisa.CreatePDF(BytesIO(html.encode("UTF-8")), dest=certificate_buffer)

    if pdf.err:
        print(f"ERROR: PDF generation failed: {pdf.err}")
        return None

    certificate_buffer.seek(0)
    print("DEBUG: Certificate PDF generated successfully.")

    # Frontpage path
    frontpage_path = os.path.join(settings.MEDIA_ROOT, "frontpage.pdf")
    print(f"DEBUG: Looking for frontpage at: {frontpage_path}")

    writer = PdfWriter()

    # Add front page if exists
    if os.path.exists(frontpage_path):
        try:
            print("DEBUG: frontpage.pdf found. Loading...")
            with open(frontpage_path, "rb") as f:
                front_reader = PdfReader(f)
                print(f"DEBUG: frontpage.pdf has {len(front_reader.pages)} page(s)")

                for page in front_reader.pages:
                    writer.add_page(page)

            print("DEBUG: Frontpage added successfully.")

        except Exception as e:
            print(f"ERROR: Failed to load frontpage.pdf: {str(e)}")

    else:
        print("WARNING: frontpage.pdf not found in MEDIA_ROOT. Skipping front page.")

    certificate_reader = PdfReader(certificate_buffer)
    print(f"DEBUG: Certificate PDF has {len(certificate_reader.pages)} page(s)")

    # 1. Check the exact physical width of the front page
    target_width = None
    if len(writer.pages) > 0:
        front_page = writer.pages[0]
        target_width = float(front_page.mediabox.width)

    for page in certificate_reader.pages:
        # 2. If a front page exists, scale this page to match its width perfectly
        if target_width:
            current_width = float(page.mediabox.width)
            
            if current_width > 0:
                scale_factor = target_width / current_width
                
                # Scale the page and all its text proportionally 
                # (We check for both method names to support newer and older PyPDF2 versions)
                if hasattr(page, 'scale_by'):
                    page.scale_by(scale_factor)
                elif hasattr(page, 'scaleBy'):
                    page.scaleBy(scale_factor)

        writer.add_page(page)

    print("DEBUG: Certificate pages added.")

    # Final merged PDF
    final_buffer = BytesIO()
    writer.write(final_buffer)
    final_buffer.seek(0)

    print(f"DEBUG: Final merged PDF created with {len(writer.pages)} page(s)")
    print("DEBUG: PDF generation complete.")

    return final_buffer

class UserAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user  # use the logged-in user

        serializer = UserFormSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # handle logo separately if uploaded
            if "logo" in request.FILES:
                ext = request.FILES["logo"].name.split(".")[-1]
                user.logo.save(f"Droidal_{user.id}.{ext}", request.FILES["logo"], save=True)

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
class ClientLicenseOverviewView(generics.RetrieveAPIView):
    serializer_class = ClientLicenseOverviewSerializer
    permission_classes = [IsAuthenticated]
 
    def get_object(self):
        user = self.request.user
        print(user.username)
        # Return None if user has no client
        return getattr(user, "client", None)
 
    def retrieve(self, request, *args, **kwargs):
        client = self.get_object()
        if not client:
            return Response({}, status=200)
        serializer = self.get_serializer(client)
        return Response(serializer.data)
 

@api_view(['POST'])
def mail_verification(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"success": False, "message": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Authenticate user
    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"success": False, "message": "Invalid credentials or user does not exist"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)

    # Send verification email and capture status
    try:
        send_verification_email(user, request)
        email_status = f"Verification email sent to {user.mail}"
        email_sent = True
    except Exception as e:
        email_status = f"Failed to send verification email: {str(e)}"
        email_sent = False

    # Response with email info
    return Response(
        {
            "refresh": str(refresh),
            "access": access,
            "user_role": user.roles,
            "user_name": user.first_name,
            "user_id": str(user.id),
            "success": True,
            "email_sent": email_sent,         # ✅ New field
            "email_status": email_status      # ✅ New field
        },
        status=status.HTTP_200_OK
    )

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user  # user from token

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not current_password or not new_password:
            return Response(
                {"error": "Both current_password and new_password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check current password
        if not check_password(current_password, user.password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # set new password
        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password updated successfully"},
            status=status.HTTP_200_OK,
        )
    
    
@permission_classes([AllowAny]) 
@authentication_classes([])
class MfaVerifyAPIView(APIView):

    def post(self, request):
        print("=== MFA Verification Started ===")
        print(f"Request data: {request.POST.get('user_id')}, {request.POST.get('token')}")
        
        user_id = request.data.get("user_id")
        token = request.data.get("token")  # MFA TOTP code from frontend
        username = request.data.get("username")  # Check if we're getting username
        password = request.data.get("password")  # Check if we're getting password
        
        print(f"Extracted - user_id: {user_id}, token: {token}")
        print(f"Additional - username: {username}, password: {password}")

        if not user_id or not token:
            print("❌ Missing user_id or token")
            return Response(
                {"detail": "User ID and MFA token are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            print(f"🔍 Looking for user with ID: {user_id}")
            user = User.objects.get(id=user_id)
            print(f"✅ User found: {user.username} (ID: {user.id})")
            print(f"🔐 User MFA enabled: {user.mfa_enabled}")
            print(f"🔑 User MFA secret exists: {bool(user.mfa_secret)}")

            # Get user's MFA secret key
            mfa_secret = user.mfa_secret
            print(f"📋 MFA secret (first 10 chars): {mfa_secret[:10] if mfa_secret else 'None'}")
            
            if not mfa_secret:
                print("❌ MFA secret not found for user")
                return Response(
                    {"detail": "MFA not setup for this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify the MFA code using pyotp
            print(f"🔢 Verifying MFA token: {token}")
            totp = pyotp.TOTP(mfa_secret)
            
            # Check current valid codes for debugging
            current_code = totp.now()
            print(f"🕒 Current valid code: {current_code}")
            print(f"📱 Provided code: {token}")
            
            is_valid = totp.verify(token)
            print(f"✅ MFA token verification result: {is_valid}")
            
            # Try verifying with some time window for debugging
            is_valid_with_window = totp.verify(token, valid_window=1)
            print(f"⏰ MFA token verification with window (1): {is_valid_with_window}")

            if is_valid or is_valid_with_window:
                # Valid MFA code, issue JWT tokens
                print("🎉 MFA verification successful, generating tokens...")
                refresh = RefreshToken.for_user(user)
                response_data = {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user_role": str(user.roles),
                    "user_name": str(user.username),
                    "user_id": str(user.id),
                    "success": True,
                }
                print(f"✅ Tokens generated successfully for user: {user.username}")
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                # Invalid MFA token
                print("❌ Invalid MFA token provided")
                print(f"💡 Current time: {timezone.now()}")
                return Response(
                    {"detail": "Invalid MFA code."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        except User.DoesNotExist:
            print(f"❌ User with ID {user_id} does not exist")
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"💥 Unexpected error: {str(e)}")
            print(f"💥 Error type: {type(e).__name__}")
            import traceback
            print(f"💥 Traceback: {traceback.format_exc()}")
            return Response(
                {"detail": "Internal server error during MFA verification."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            print("=== MFA Verification Completed ===\n")
    
class MFAView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return MFA info"""
        user = request.user
        qr_url = request.build_absolute_uri(user.qr_code.url) if user.qr_code else None

        return Response({
            "mfa_enabled": user.mfa_enabled,
            "mfa_secret": user.mfa_secret if user.mfa_enabled else None,
            "qr_code": qr_url if user.mfa_enabled else None,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Enable MFA and generate QR"""
        user = request.user

        # Generate new secret
        user.mfa_secret = pyotp.random_base32()

        # Create TOTP and provisioning URI
        totp = pyotp.TOTP(user.mfa_secret)
        otp_uri = totp.provisioning_uri(name=user.username, issuer_name="Droidal")

        # Generate QR and save it locally
        qr = qrcode.make(otp_uri)
        qr_folder = os.path.join(settings.MEDIA_ROOT, "mfa_qr")
        os.makedirs(qr_folder, exist_ok=True)

        qr_filename = f"{uuid.uuid4()}_{user.username}_mfa.png"
        qr_path = os.path.join(qr_folder, qr_filename)
        qr.save(qr_path)

        user.qr_code.name = f"mfa_qr/{qr_filename}"
        user.mfa_enabled = True
        user.save()
        

        return Response({
            "message": "MFA enabled successfully.",
            "mfa_secret": user.mfa_secret,
            "qr_code": request.build_absolute_uri(user.qr_code.url),
        }, status=status.HTTP_200_OK)

    def put(self, request):
        """Regenerate secret and QR"""
        user = request.user

        if not user.mfa_enabled:
            return Response({"error": "MFA not enabled yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate new secret
        user.mfa_secret = pyotp.random_base32()

        # Create new QR
        totp = pyotp.TOTP(user.mfa_secret)
        otp_uri = totp.provisioning_uri(name=user.username, issuer_name="Droidal")

        qr = qrcode.make(otp_uri)
        qr_folder = os.path.join(settings.MEDIA_ROOT, "mfa_qr")
        os.makedirs(qr_folder, exist_ok=True)

        qr_filename = f"{uuid.uuid4()}_{user.username}_mfa.png"
        qr_path = os.path.join(qr_folder, qr_filename)
        qr.save(qr_path)

        user.qr_code.name = f"mfa_qr/{qr_filename}"
        user.save()

        return Response({
            "message": "MFA secret regenerated successfully.",
            "mfa_secret": user.mfa_secret,
            "qr_code": request.build_absolute_uri(user.qr_code.url),
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Disable MFA"""
        user = request.user
        user.mfa_enabled = False
        user.save()
        return Response({"message": "MFA disabled."}, status=status.HTTP_200_OK)
    


ROLE_MAPPING = {
    'owner': 'owner',
    'admin': 'admin',
    'developer': 'developer',
    'projectManager': 'project_manager',
    'analyst': 'analyst',
    'botOperator': 'bot_operator',
    'viewer': 'viewer',
}

# Predefined list of features in the exact order/format from your query
FEATURES_LIST = [
    'Monitoring Dashboard',
    'Create Custom DEPT/Agents',
    'Edit Department',
    'Agents - Remove/Edit',
    'Requests Table - View & Export',
    'Requests Table - Edit/Process/Delete',
    'Analytics',
    'DroidStudio - Dashboard (View)',
    'Create/Edit Pods',
    'Create/Edit Machines',
    'Create/Edit Triggers',
    'Create/Edit Assets',
    'Start/Stop Agents',
    'View Performance Metrics',
    'ROI – Estimated',
    'ROI – Actual Savings',
    'ROI – Modify Calculation Settings',
    'Roles & Users',
    'Module Permissions',
    'Column Settings',
    'Licensing & Subscription',
    'Audit Logs (View)',
    'Audit Logs (Export/Delete)',
    'Agent Secret Keys',
    'AI API Keys',
    'Notifications',
    'Data Settings',
    'Developer Settings',
    'Billing View',
    'Payment Overview'
]

def slugify_feature(feature_name):
    """
    Convert feature name to module_code (e.g., 'Create Custom DEPT/Agents' -> 'create_custom_dept_agents').
    """
    slug = re.sub(r'\W+', '_', feature_name.lower()).strip('_')
    return slug

class AccessControlView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve current permissions for all roles under the user's client.
        Returns a list of dicts in the format: [{'feature': 'Name', 'owner': bool, 'admin': bool, ...}, ...]
        """
        client = request.user.client
        if not client:
            return Response(
                {'error': 'No client associated with user.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch all active roles for this client (or create placeholders if missing)
        roles_dict = {}
        roles = Role.objects.filter(client=client, is_active=True)
       
        if not roles.exists():
            return Response({
                'permissions': [],
                'client': client.client_name,
                'total_features': 0,
                'message': 'No roles found for this client'
            }, status=status.HTTP_200_OK)
        
        for role_key, role_code in ROLE_MAPPING.items():
            role = Role.objects.filter(
                client=client, 
                code=role_code, 
                is_active=True
            ).first()
            if not role:
                # For missing roles, assume all False (or fetch system template if needed)
                roles_dict[role_key] = {}  # Empty permissions
            else:
                roles_dict[role_key] = role.permissions or {}

        # Build the permissions list
        permissions_list = []
        for feature_name in FEATURES_LIST:
            row = {'feature': feature_name}
            module_code = slugify_feature(feature_name)
            
            for role_key in ROLE_MAPPING.keys():
                role_perms = roles_dict.get(role_key, {})
                module_perms = role_perms.get(module_code, {})
                # Use 'view' as the indicator (matches your uniform save logic)
                row[role_key] = module_perms.get('view', False)
            
            permissions_list.append(row)

        return Response({
            'permissions': permissions_list,
            'client': client.client_name,
            'total_features': len(FEATURES_LIST)
        }, status=status.HTTP_200_OK)

    def post(self, request):
        # Existing logic for user/group updates
        if 'user_id' in request.data or 'group_role' in request.data:
            pass  # Keep existing code

        # New: Handle bulk permissions save if 'permissions' key present
        if 'permissions' in request.data:
            return self.save_permissions(request)

        return Response(
            {'error': 'Invalid request structure.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    def save_permissions(self, request):
        serializer = PermissionsUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        client = request.user.client
        if not client:
            return Response(
                {'error': 'No client associated with user.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        permissions_data = serializer.validated_data['permissions']
        print(f"Received permissions_data: {permissions_data}")  # Debug: Verify input
        updated_roles = []

        with transaction.atomic():
            for role_key, role_code in ROLE_MAPPING.items():
                # Find or create Role for this code under client
                role = Role.objects.filter(
                    client=client, 
                    code=role_code, 
                    is_active=True
                ).first()
                
                if not role:
                    system_role = Role.objects.filter(
                        client__isnull=True, 
                        code=role_code, 
                        is_system_role=True
                    ).first()
                    
                    role = Role.objects.create(
                        name=f"{role_code.replace('_', ' ').title()} Role",
                        code=role_code,
                        description=f"Permissions for {role_code} users",
                        client=client,
                        permissions=system_role.permissions if system_role else {},
                        is_active=True
                    )
                    print(f"Created new role: {role_code} for client {client.client_id}")  # Debug: Track creation
                    role_id = role.id  # Get ID for later update
                else:
                    role_id = role.id
                    print(f"Updating existing role: {role_code} for client {client.client_id}")  # Debug: Track update

                # Create a NEW permissions dict
                new_permissions = dict(role.permissions) if role else {}  # Safe for new roles

                # Update permissions for this role from data
                for row in permissions_data:
                    feature = row['feature']
                    checked = row[role_key]
                    module_code = slugify_feature(feature)
                    
                    # Debug: Log specific updates
                    print(f"  Role {role_key}: Setting {module_code} to {checked} (all perms)")
                    
                    # Set permissions in the NEW dict
                    new_permissions[module_code] = {
                        'view': checked,
                        'create': checked,
                        'edit': checked,
                        'delete': checked,
                        'export': checked
                    }

                # FIXED: Force DB update with update() instead of save() for existing roles
                updated_count = Role.objects.filter(
                    id=role_id, 
                    client=client, 
                    code=role_code
                ).update(permissions=new_permissions)
                
                if updated_count == 0:
                    print(f"WARNING: No update occurred for role {role_code} (possible concurrency issue)")
                else:
                    print(f"Updated role {role_code} with {len(new_permissions)} modules (rows affected: {updated_count})")
                
                # Debug: Refresh and verify for existing roles
                if role:  # Only for existing
                    role.refresh_from_db()
                    test_module = slugify_feature('Create Custom DEPT/Agents')
                    print(f"Post-update verification for {role_code}: {test_module} = {role.permissions.get(test_module, 'NOT SET')}")
                
                # Re-fetch role for response
                role = Role.objects.get(id=role_id)
                updated_roles.append(role)

        # Response with updated roles and count
        return Response({
            'message': f'Permissions saved for {len(updated_roles)} roles under client "{client.client_name}".',
            'updated_roles': [
                {
                    'code': r.code, 
                    'name': r.name,
                    'permissions_count': len(r.permissions)
                } 
                for r in updated_roles
            ],
            'total_features_updated': len(permissions_data)
        }, status=status.HTTP_200_OK)

class SummaryAlertViewSet(viewsets.ModelViewSet):
    queryset = SummaryReportAlert.objects.all()
    serializer_class = SummaryReportAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        client = getattr(user, 'client', None)
        if client:
            return SummaryReportAlert.objects.filter(client=client)
        return SummaryReportAlert.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        client = getattr(user, 'client', None)
        serializer.save(client=client)

class InvoiceAlertViewSet(viewsets.ModelViewSet):
    queryset = InvoiceAlert.objects.all()
    serializer_class = InvoiceAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        client = getattr(user, 'client', None)
        if client:
            return InvoiceAlert.objects.filter(client=client)
        return InvoiceAlert.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        client = getattr(user, 'client', None)
        serializer.save(client=client)


class SummarySendNow(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        type = data.get("report_type")
        if type == "high-level":
            try:
                factory = APIRequestFactory()
                user = request.user
                

                recepients = data.get("emails")
                

                # 1) Call ModuleListAPIView correctly
                module_request = factory.get(
                    "/modulesapi/",
                    {},  # query params if needed
                    HTTP_AUTHORIZATION=request.META.get("HTTP_AUTHORIZATION")
                )
                module_response = ModuleListAPIView.as_view()(module_request)

                new_data = module_response.data

                # 2) Loop and call AppListAPIView correctly each time
                all_task_status = {}
                for item in new_data:
                    module_id = item.get("id")

                    app_request = factory.get(
                        "/appsapi/",
                        {"module_id": module_id},
                        HTTP_AUTHORIZATION=request.META.get("HTTP_AUTHORIZATION")
                    )

                    app_response = AppListAPIView.as_view()(app_request)
                    final_app_response = app_response.data
                    all_app_status = {}
                    if not final_app_response:
                        new_app_response = None
                    else:
                        for each_app in final_app_response:
                            new_app_response = each_app.get("task_status",None)
                            all_app_status[each_app["app_name"]] = new_app_response
                    all_task_status[item["module_name"]] = all_app_status

                data = all_task_status
                styles = getSampleStyleSheet()
                style = styles["Normal"]                  # keep default Helvetica
                heading = styles["Heading4"]              # bold section titles

                elements = []

                for section, items in data.items():
                    elements.append(Paragraph(f"<b>{section}</b>", heading))
                    elements.append(Spacer(1, 0.1 * inch))

                    if isinstance(items, dict):
                        for key, val in items.items():
                            total = val.get("total", 0)
                            new = val.get("counts", {}).get("NEW", 0)
                            pending = val.get("counts", {}).get("PENDING", 0)
                            success = val.get("counts", {}).get("SUCCESS", 0)
                            failed = val.get("counts", {}).get("FAILED", 0)

                            text = f"{key}: Total={total}, New={new}, Pending={pending}, Success={success}, Failed={failed}"
                            elements.append(Paragraph(text, style))
                            elements.append(Spacer(1, 0.05 * inch))

                    elements.append(Spacer(1, 0.2 * inch))

                file_name = f"summary_{str(user.first_name)}_{str(user.last_name)}.pdf"
                summary_folder = os.path.join(settings.MEDIA_ROOT, "summary")
                os.makedirs(summary_folder, exist_ok=True)
                summary_file = os.path.join(summary_folder,file_name)
                doc = SimpleDocTemplate(summary_file, pagesize=letter)
                doc.build(elements)

                file_path = summary_file
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                filename = os.path.basename(file_path)
                attachment_content = BytesIO(file_bytes)

                subject = "Summary Report for all departments"
                html_content = f"""
                    <html>
                    <body style="font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">

                        <p>Hi {user.first_name} {user.last_name},</p>

                        <p>
                            Please find attached the summary report for all departments.<br>
                            This is an auto-generated email. Please do not reply to this message.
                        </p>

                        <br/>

                        <p>Regards,<br>
                        <span style="font-weight: 600;">Team Operations</span></p>

                    </body>
                    </html>
                    """

                result = send_graph_email(recepients, subject, html_content, attachment_content, filename)
                if result.status_code == 202:
                    return HttpResponse("Email sent successfully.", status=200)
                else:
                    print("Failed:", result.status_code, result.text)
                    return HttpResponse(result.text, status=result.status_code)
            except Exception as e:
                print(e)

        else:
            return HttpResponse("yet to complete")

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from datetime import datetime
from .models import Client

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from .models import Client 

class LicenseTierChartAPIView(APIView):
    def get(self, request):
        # 1. Get dates from query parameters
        req_start_date_str = request.GET.get("start_date")
        req_end_date_str = request.GET.get("end_date")

        # Parse string to datetime.date objects safely
        req_start_date = parse_date(req_start_date_str) if req_start_date_str else None
        req_end_date = parse_date(req_end_date_str) if req_end_date_str else None

        # 2. Base Queryset (Optional but recommended: only look at active status clients)
        queryset = Client.objects.filter(status="active")

        # 3. Apply the Active License Overlap Filter
        if req_start_date and req_end_date:
            # A license is active during the requested range if:
            # - License start date (effective_date) is <= the requested end_date
            # - AND License end date (end_date) is >= the requested start_date (or ongoing/null)
            queryset = queryset.filter(
                effective_date__date__lte=req_end_date
            ).filter(
                Q(end_date__date__gte=req_start_date) | Q(end_date__isnull=True)
            )
        else:
            # Fallback: If no dates are passed, count licenses that are active TODAY
            today = timezone.now().date()
            queryset = queryset.filter(
                effective_date__date__lte=today
            ).filter(
                Q(end_date__date__gte=today) | Q(end_date__isnull=True)
            )

        # 4. Aggregate tier counts
        counts = (
            queryset
            .values("license_tier")
            .annotate(count=Count("id"))
        )

        # 5. Format results to ensure all tiers appear (even if count is 0)
        tier_choices = dict(Client.LICENSE_CHOICES)
        count_map = {item["license_tier"]: item["count"] for item in counts}

        result = [
            {
                "tier": tier,
                "count": count_map.get(tier, 0)
            }
            for tier in tier_choices.keys()
        ]

        return Response({"data": result})

from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Client


class UpdateVoiceAILicenseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, client_id):
        try:
            user = request.user
            if not user.is_authenticated:
                return Response(
                    {"error": "User is not authenticated"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if user.roles != "admin":
                return Response(
                    {"error": f"User is not authorized"},
                    status=status.HTTP_403_FORBIDDEN
                )
            client = Client.objects.get(id=client_id)

            voice_ai_license = request.data.get("voice_ai_license")

            if voice_ai_license is None:
                return Response(
                    {"error": "voice_ai_license field is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            client.voice_ai_license = voice_ai_license
            client.save(update_fields=["voice_ai_license"])

            return Response(
                {
                    "message": "Voice AI license updated successfully",
                    "client_id": client.client_id,
                    "voice_ai_license": client.voice_ai_license
                },
                status=status.HTTP_200_OK
            )

        except Client.DoesNotExist:
            return Response(
                {"error": "Client not found"},
                status=status.HTTP_404_NOT_FOUND
            )

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Client

class ViewLicensePDFAPIView(APIView):
    """
    API endpoint to VIEW the license PDF in the browser.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, client_id):
        # Fetch the client using the primary key (id)
        client = get_object_or_404(Client, id=client_id)
        
        # Security check: Ensure the user is an admin or belongs to this client
        user = request.user
        if user.roles != 'admin' and getattr(user, 'client', None) != client:
            return Response(
                {"error": "Unauthorized access to this license."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # In your setup, client.client_name is the ForeignKey mapping to the User object
        user_obj = User.objects.filter(client=client, roles = "client").first()
        
        # Generate the PDF using your existing function
        pdf_buffer = generate_license_pdf(client, user_obj)
        
        if not pdf_buffer:
            return Response(
                {"error": "Failed to generate PDF."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Return the PDF with 'inline' disposition to view in browser
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="license-{client.client_id}.pdf"'
        return response


class DownloadLicensePDFAPIView(APIView):
    """
    API endpoint to DOWNLOAD the license PDF.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, client_id):
        # Fetch the client using the primary key (id)
        client = get_object_or_404(Client, id=client_id)
        
        # Security check: Ensure the user is an admin or belongs to this client
        user = request.user
        if user.roles != 'admin' and getattr(user, 'client', None) != client:
            return Response(
                {"error": "Unauthorized access to this license."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_obj = User.objects.filter(client=client, roles = "client").first() 
        
        # Generate the PDF using your existing function
        pdf_buffer = generate_license_pdf(client, user_obj)
        
        if not pdf_buffer:
            return Response(
                {"error": "Failed to generate PDF."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Return the PDF with 'attachment' disposition to force download
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="license-{client.client_id}.pdf"'
        return response