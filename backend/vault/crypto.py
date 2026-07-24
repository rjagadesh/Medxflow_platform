"""
Symmetric encryption for vault secrets.

Secrets are encrypted at rest with Fernet (AES-128-CBC + HMAC). The key is
derived from Django's ``SECRET_KEY`` so no separate key management is needed for
this deployment — in production you would supply a dedicated ``VAULT_KEY``.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet():
    raw = (getattr(settings, "VAULT_KEY", "") or settings.SECRET_KEY).encode()
    key = base64.urlsafe_b64encode(hashlib.sha256(raw).digest())
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt((plaintext or "").encode()).decode()


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return ""
