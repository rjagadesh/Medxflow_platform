"""
Connection resolution + schema caching for the Decision Engine chat.

The tenant's own MedXFlow operational database is exposed as a virtual "builtin"
connection (id="builtin"). For a non-super-admin, queries against it are scoped
to their tenant via shadow temp views (see dbchat.run_select). Super admins get
the full platform database. Stored DataConnection rows are external databases
the user registered by connection string.
"""
from django.conf import settings

from . import dbchat
from .models import DataConnection

_SCHEMA_CACHE = {}  # cache_key -> introspected schema


def builtin_url():
    d = settings.DATABASES["default"]
    user = d.get("USER") or ""
    pwd = d.get("PASSWORD") or ""
    auth = user + (f":{pwd}" if pwd else "")
    host = d.get("HOST") or "localhost"
    port = d.get("PORT") or "5432"
    return f"postgresql+psycopg2://{auth}@{host}:{port}/{d['NAME']}"


def _stored_qs(user):
    if user.tenant_id is None:
        return DataConnection.objects.filter(tenant__isnull=True)
    return DataConnection.objects.filter(tenant=user.tenant)


def list_connections(user):
    conns = [{
        "id": "builtin",
        "name": "MedXFlow operational database",
        "engine": "postgres",
        "builtin": True,
        "status": "connected",
        "scoped": user.tenant_id is not None,
    }]
    for c in _stored_qs(user):
        conns.append({
            "id": c.id, "name": c.name, "engine": c.engine, "builtin": False,
            "status": c.status, "error": c.error, "table_count": c.table_count,
        })
    return conns


def resolve(user, connection_id):
    """Return (engine, engine_kind, is_postgres, tenant_id_or_None, tenant_tables, cache_key)."""
    if str(connection_id) == "builtin":
        engine = dbchat.make_engine(builtin_url())
        tid = None if user.tenant_id is None else user.tenant_id
        # schema is the same regardless of scope; scoping happens at execution.
        return engine, "postgres", True, tid, None, "builtin"
    conn = _stored_qs(user).get(id=connection_id)
    engine = dbchat.make_engine(dbchat.normalize_dsn(conn.engine, conn.dsn))
    return engine, conn.engine, conn.engine == "postgres", None, None, f"conn:{conn.id}"


def get_schema(engine, cache_key, tenant_id):
    key = (cache_key, tenant_id)
    if key not in _SCHEMA_CACHE:
        _SCHEMA_CACHE[key] = dbchat.introspect(engine)
    return _SCHEMA_CACHE[key]


def invalidate(cache_key):
    for k in list(_SCHEMA_CACHE):
        if k[0] == cache_key:
            del _SCHEMA_CACHE[k]


def test_and_register(user, name, engine_kind, raw_dsn):
    """Validate a new external connection by introspecting it, then store it."""
    url = dbchat.normalize_dsn(engine_kind, raw_dsn)
    eng = dbchat.make_engine(url)
    schema = dbchat.introspect(eng)  # raises on bad connection
    conn = DataConnection.objects.create(
        tenant=user.tenant, name=name, engine=engine_kind, dsn=raw_dsn,
        status="connected", table_count=len(schema["tables"]),
        created_by=user if user.pk else None,
    )
    return conn
