"""
TOTP multi-factor authentication endpoints.

Flow
----
1. POST /api/mfa/setup/   -> generates a secret (not yet enabled) and returns a
   QR code (data URI) + the secret for manual entry in an authenticator app.
2. POST /api/mfa/verify/  -> body {otp}; confirms the first code and enables MFA.
3. POST /api/mfa/disable/ -> body {otp}; verifies a code, then turns MFA off.

Once enabled, the login endpoint requires a valid code (see the login
serializer).
"""
import base64
import io

import pyotp
import qrcode
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

ISSUER = "MedXFlow"


def _qr_data_uri(uri):
    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


class MFASetupView(APIView):
    """Begin MFA enrolment: create a secret and return the QR + provisioning URI."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        user.mfa_enabled = False  # not active until a code is verified
        user.save(update_fields=["mfa_secret", "mfa_enabled"])

        uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=ISSUER)
        return Response(
            {"secret": secret, "otpauth_uri": uri, "qr_code": _qr_data_uri(uri)}
        )


class MFAVerifyView(APIView):
    """Confirm the first TOTP code and switch MFA on."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        otp = str(request.data.get("otp", "")).strip()
        if not user.mfa_secret:
            return Response(
                {"detail": "Start MFA setup first."}, status=status.HTTP_400_BAD_REQUEST
            )
        if not pyotp.TOTP(user.mfa_secret).verify(otp, valid_window=1):
            return Response(
                {"detail": "Invalid code. Try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.mfa_enabled = True
        user.save(update_fields=["mfa_enabled"])
        from audit.models import record
        record(user, "AUTH", "Enabled two-factor authentication")
        return Response({"detail": "MFA enabled.", "mfa_enabled": True})


class MFADisableView(APIView):
    """Disable MFA after verifying a current code."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        otp = str(request.data.get("otp", "")).strip()
        if not user.mfa_enabled:
            return Response({"detail": "MFA is not enabled.", "mfa_enabled": False})
        if not pyotp.TOTP(user.mfa_secret).verify(otp, valid_window=1):
            return Response(
                {"detail": "Invalid code. Try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.mfa_enabled = False
        user.mfa_secret = ""
        user.save(update_fields=["mfa_enabled", "mfa_secret"])
        return Response({"detail": "MFA disabled.", "mfa_enabled": False})
