# cleanup_meetings.py
# Run this script to check and clean up duplicate meeting IDs
# For multi-tenant architecture

import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cloudproject.settings')
django.setup()

from tenant_telehealth.models import TelehealthMeeting
from django.db.models import Count
from django_tenants.utils import schema_context, get_tenant_model

# Get tenant from command line argument
if len(sys.argv) < 2:
    print("Usage: python cleanup_meetings.py <tenant_schema_name>")
    print("\nExample: python cleanup_meetings.py tenant_abc123")
    print("\nAvailable tenants:")
    
    Tenant = get_tenant_model()
    for tenant in Tenant.objects.all():
        print(f"  - {tenant.schema_name} ({tenant.name if hasattr(tenant, 'name') else 'N/A'})")
    
    sys.exit(1)

tenant_schema = sys.argv[1]

# Verify tenant exists
Tenant = get_tenant_model()
try:
    tenant = Tenant.objects.get(schema_name=tenant_schema)
    print(f"Using tenant: {tenant.schema_name}")
except Tenant.DoesNotExist:
    print(f"❌ Tenant '{tenant_schema}' not found!")
    sys.exit(1)

# Run cleanup within tenant schema context
with schema_context(tenant_schema):
    print("=" * 80)
    print(f"TELEHEALTH MEETING DATABASE CLEANUP - Tenant: {tenant_schema}")
    print("=" * 80)

# Check for duplicate meeting_ids
print("\n1. Checking for duplicate meeting_ids...")
duplicates = TelehealthMeeting.objects.values('meeting_id').annotate(
    count=Count('id')
).filter(count__gt=1, meeting_id__isnull=False)

if duplicates.exists():
    print(f"   ❌ Found {duplicates.count()} duplicate meeting_ids:")
    for dup in duplicates:
        meetings = TelehealthMeeting.objects.filter(meeting_id=dup['meeting_id'])
        print(f"\n   Meeting ID: {dup['meeting_id']}")
        for m in meetings:
            print(f"      - DB ID: {m.id}, Status: {m.status}, Created: {m.created_at}")
        
        # Keep the first one, mark others as inactive
        first_meeting = meetings.first()
        other_meetings = meetings.exclude(id=first_meeting.id)
        
        print(f"   → Keeping DB ID: {first_meeting.id}")
        print(f"   → Marking {other_meetings.count()} duplicates as inactive")
        
        for m in other_meetings:
            m.is_active = False
            m.meeting_id = None  # Clear meeting_id to avoid constraint
            m.save()
else:
    print("   ✅ No duplicate meeting_ids found")

# Check meetings without Chime meeting_id but status = 'started'
print("\n2. Checking for started meetings without Chime meeting_id...")
invalid_started = TelehealthMeeting.objects.filter(
    status='started',
    meeting_id__isnull=True,
    is_active=True
)

if invalid_started.exists():
    print(f"   ❌ Found {invalid_started.count()} invalid meetings:")
    for m in invalid_started:
        print(f"      - DB ID: {m.id}, Title: {m.meeting_title}")
        # Reset to scheduled status
        m.status = 'scheduled'
        m.save()
        print(f"      → Reset to 'scheduled' status")
else:
    print("   ✅ No invalid started meetings found")

# Check for scheduled meetings that are past their time
print("\n3. Checking for past scheduled meetings...")
from django.utils import timezone
now = timezone.now()

past_meetings = TelehealthMeeting.objects.filter(
    status='scheduled',
    scheduled_start_time__lt=now,
    is_active=True
)

if past_meetings.exists():
    print(f"   ⚠️  Found {past_meetings.count()} past scheduled meetings:")
    for m in past_meetings:
        print(f"      - DB ID: {m.id}, Title: {m.meeting_title}, Scheduled: {m.scheduled_start_time}")
else:
    print("   ✅ No past scheduled meetings found")

# Summary of all meetings
print("\n4. Current meeting status summary:")
status_counts = TelehealthMeeting.objects.filter(is_active=True).values('status').annotate(
    count=Count('id')
)

for status in status_counts:
    print(f"   {status['status']}: {status['count']} meetings")

# List all active meetings
print("\n5. All active meetings:")
all_meetings = TelehealthMeeting.objects.filter(is_active=True).order_by('-created_at')[:20]

for m in all_meetings:
    chime_id = m.meeting_id[:20] + "..." if m.meeting_id else "Not started"
    appt = f"Appt #{m.appoinment.id}" if m.appoinment else "Standalone"
    print(f"   ID: {m.id:3d} | {m.status:10s} | {appt:15s} | {chime_id} | {m.meeting_title}")

print("\n" + "=" * 80)
print("Cleanup completed!")
print("=" * 80)