"""
Authentication middleware and utilities for handling both:
1. Regular authenticated users (providers with login)
2. Guest token users (patients/providers with token)
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from accounts.models import TeleHealthGuestAccessToken
import logging

logger = logging.getLogger(__name__)


class GuestTokenAuthentication(BaseAuthentication):
    """
    Custom authentication class that supports guest access tokens
    This is ONLY for guest tokens, not for JWT or DRF tokens
    """
    
    def authenticate(self, request):
        # Check for guest token in header or query params
        guest_token = request.META.get('HTTP_X_GUEST_TOKEN') or request.GET.get('token')
        
        if guest_token:
            return self.authenticate_guest_token(guest_token, request)
        
        # If no guest token, let other authentication methods handle it
        return None
    
    def authenticate_guest_token(self, token, request):
        """Authenticate using guest access token"""
        try:
            from accounts.models import TeleHealthGuestAccessToken
            
            guest_token_obj, error = TeleHealthGuestAccessToken.verify_token(token)
            
            if error:
                raise AuthenticationFailed(error)
            
            # Create a pseudo-user object with token info
            user = GuestUser(guest_token_obj)
            
            # Track usage
            ip_address = self.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            guest_token_obj.mark_used(ip_address, user_agent)
            
            return (user, guest_token_obj)
            
        except Exception as e:
            logger.error(f"Guest token authentication failed: {str(e)}")
            raise AuthenticationFailed('Invalid guest token')
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GuestUser:
    """
    Pseudo-user object for guest token authentication
    """
    
    def __init__(self, guest_token):
        self.guest_token = guest_token
        self.is_authenticated = True
        self.is_active = True
        self.is_guest = True
        self.is_staff = False
        self.is_superuser = False
        self.pk = None
        self.id = None
        
        # User info from token
        self.username = guest_token.user_name
        self.email = guest_token.user_email
        self.first_name = guest_token.user_name.split()[0] if guest_token.user_name else ''
        self.last_name = ' '.join(guest_token.user_name.split()[1:]) if len(guest_token.user_name.split()) > 1 else ''
        
        # Token-specific info
        self.user_type = guest_token.user_type
        self.meeting_db_id = guest_token.meeting_db_id
        self.tenant_schema = guest_token.tenant_schema
        self.permissions = guest_token.get_permissions_dict()
        
        # Link to actual user if exists
        self.linked_user = guest_token.linked_user
        self.linked_patient = getattr(guest_token, 'linked_patient', None)
    
    def has_perm(self, perm):
        """Check if user has specific permission"""
        return self.permissions.get(perm, False)
    
    def has_perms(self, perm_list):
        """Check if user has all permissions in list"""
        return all(self.has_perm(perm) for perm in perm_list)
    
    def get_full_name(self):
        return self.username
    
    def get_short_name(self):
        return self.first_name
    
    def __str__(self):
        return f"GuestUser: {self.username} ({self.user_type})"


def get_user_and_permissions(request):
    """
    Helper function to get user info and permissions
    Works for both authenticated users and guest token users
    """
    user = request.user
    
    if isinstance(user, GuestUser):
        # Guest user with token
        return {
            'user': user,
            'is_guest': True,
            'user_type': user.user_type,
            'user_name': user.username,
            'meeting_db_id': user.meeting_db_id,
            'tenant_schema': user.tenant_schema,
            'permissions': user.permissions,
            'linked_user': user.linked_user,
            'linked_patient': user.linked_patient
        }
    elif user.is_authenticated:
        # Regular authenticated user (provider with login)
        return {
            'user': user,
            'is_guest': False,
            'user_type': 'provider',
            'user_name': user.username,
            'meeting_db_id': None,
            'tenant_schema': None,
            'permissions': {
                'can_share_screen': True,
                'can_record': True,
                'can_chat': True,
                'can_use_video': True,
                'can_use_audio': True,
                'can_mute_others': True,
                'can_remove_participants': True,
                'can_end_meeting': True,
            },
            'linked_user': user,
            'linked_patient': None
        }
    else:
        # Anonymous user
        return {
            'user': user,
            'is_guest': False,
            'user_type': None,
            'user_name': None,
            'meeting_db_id': None,
            'tenant_schema': None,
            'permissions': {},
            'linked_user': None,
            'linked_patient': None
        }


class AllowGuestOrAuthenticated:
    """
    Permission class that allows both authenticated users and guest token users
    """
    
    def has_permission(self, request, view):
        # Allow if user is authenticated OR is a guest user
        return request.user and (
            request.user.is_authenticated or 
            isinstance(request.user, GuestUser)
        )


class RequirePermission:
    """
    Permission class that checks specific permissions
    Usage: permission_classes = [RequirePermission('can_record')]
    """
    
    def __init__(self, permission):
        self.required_permission = permission
    
    def __call__(self):
        return self
    
    def has_permission(self, request, view):
        user_info = get_user_and_permissions(request)
        
        if not user_info['user'].is_authenticated:
            return False
        
        # Check if user has the required permission
        return user_info['permissions'].get(self.required_permission, False)