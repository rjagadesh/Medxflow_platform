# claims/constants.py
CLAIM_STATUS_TRANSITIONS = {
    "draft": ["ready"],
    "ready": ["submitted"],
    "submitted": ["accepted", "rejected"],
    "accepted": ["paid"],
    "rejected": [],
    "paid": [],
}
