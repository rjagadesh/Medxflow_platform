"""
The canonical catalogue of features that can be permissioned, plus the roles a
tenant admin can configure. Kept in one place so the permission matrix, the
defaults and the UI all agree.
"""
from accounts.models import Role

# Each feature maps 1:1 to a menu tab / screen in the app.
FEATURES = [
    {"slug": "decision-engine", "name": "Decision Engine", "group": "Overview"},
    {"slug": "review-queue", "name": "Review Queue", "group": "Overview"},
    {"slug": "eligibility-verification", "name": "Eligibility Verification", "group": "Workflows"},
    {"slug": "prior-authorization", "name": "Prior Authorization", "group": "Workflows"},
    {"slug": "referrals", "name": "Referrals", "group": "Workflows"},
    {"slug": "claim-submission", "name": "Claim Submission", "group": "Workflows"},
    {"slug": "telehealth", "name": "Telehealth", "group": "Workflows"},
    {"slug": "denial-management", "name": "Denial Management", "group": "Workflows"},
    {"slug": "claim-status-inquiry", "name": "Claim Status Inquiry", "group": "Workflows"},
    {"slug": "payment-posting", "name": "Payment Posting / ERA", "group": "Workflows"},
    {"slug": "voice-ai", "name": "Voice AI", "group": "Platform"},
    {"slug": "connectors", "name": "Connectors", "group": "Platform"},
    {"slug": "file-manager", "name": "File Manager", "group": "Platform"},
    {"slug": "secret-vault", "name": "Secret Vault", "group": "Platform"},
    {"slug": "scheduled-runs", "name": "Scheduled Runs", "group": "Platform"},
    {"slug": "automations", "name": "Automations", "group": "Platform"},
    {"slug": "audit-log", "name": "Audit Log", "group": "Platform"},
    {"slug": "licenses", "name": "Licenses", "group": "Platform"},
]

FEATURE_SLUGS = {f["slug"] for f in FEATURES}

# Roles that a tenant admin can configure. SUPER_ADMIN is always full-access and
# is intentionally not configurable here.
CONFIGURABLE_ROLES = [
    {"value": Role.TENANT_ADMIN, "label": "Tenant Admin"},
    {"value": Role.MEMBER, "label": "Member"},
]


def default_permissions(role):
    """Sensible starting permissions for a role on any feature."""
    if role == Role.TENANT_ADMIN:
        return {"can_view": True, "can_edit": True, "can_delete": True}
    # MEMBER: can see and use, but not delete records by default.
    return {"can_view": True, "can_edit": True, "can_delete": False}
