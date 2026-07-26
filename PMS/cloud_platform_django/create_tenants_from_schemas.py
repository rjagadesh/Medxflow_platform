import os
import django

# ─────────────────────────────────────────────
# 1️⃣ DJANGO SETUP
# ─────────────────────────────────────────────
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "cloudproject.settings"
)

django.setup()

# ─────────────────────────────────────────────
# 2️⃣ IMPORTS
# ─────────────────────────────────────────────
from django.db import connection
from accounts.models import Client


def schema_exists(schema_name):
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM information_schema.schemata WHERE schema_name = %s",
            [schema_name]
        )
        return cursor.fetchone() is not None


def create_schema(schema_name):
    with connection.cursor() as cursor:
        cursor.execute(f'CREATE SCHEMA "{schema_name}" AUTHORIZATION CURRENT_USER')


def run():
    print("\n🚀 Creating missing tenant schemas...\n")

    for client in Client.objects.all().order_by("id"):

        if not client.schema_name or client.schema_name == "public":
            continue

        if schema_exists(client.schema_name):
            print(f"✔ EXISTS → {client.schema_name}")
            continue

        try:
            create_schema(client.schema_name)
            print(f"🆕 CREATED → {client.schema_name}")
        except Exception as e:
            print(f"❌ FAILED → {client.schema_name}")
            print(f"   ERROR: {e}")

    print("\n✅ Schema creation completed\n")


if __name__ == "__main__":
    run()
