"""
Database access layer for the Decision Engine chat.

Everything here is READ-ONLY and defensive:
  * connection strings are normalised to SQLAlchemy URLs per engine;
  * schema is introspected (tables + columns) and turned into a compact doc for
    the LLM;
  * a model-generated query is guarded (single SELECT only, no DDL/DML) and run
    inside a rolled-back, read-only transaction with a row cap and a statement
    timeout. On Postgres the transaction is additionally `SET TRANSACTION READ
    ONLY`, so any write fails at the database level.

Tenant scoping (built-in MedXFlow DB, non-super-admin): before running the query
we create session-local TEMP VIEWs that shadow every tenant-scoped table with
`SELECT * FROM public.<table> WHERE tenant_id = :tid`. Because pg_temp is first
on the search_path, the model's unqualified `FROM <table>` transparently reads
only the caller's rows — joins included — without rewriting its SQL.
"""
import datetime
import decimal
import re

from sqlalchemy import create_engine, inspect, text

_WRITE = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|"
    r"replace|merge|call|do|copy|vacuum|attach|pragma|reindex|comment)\b",
    re.I,
)


class QueryError(ValueError):
    pass


# --------------------------------------------------------------------------- #
def normalize_dsn(engine_kind, raw):
    """Turn a user-supplied connection string into a SQLAlchemy URL."""
    raw = (raw or "").strip()
    if engine_kind == "sqlite":
        return raw if raw.startswith("sqlite:") else f"sqlite:///{raw}"
    if engine_kind == "mysql":
        if raw.startswith(("mysql+pymysql://",)):
            return raw
        return re.sub(r"^mysql(\+\w+)?://", "mysql+pymysql://", raw) if raw.startswith("mysql") else raw
    # postgres
    if raw.startswith("postgresql+psycopg2://"):
        return raw
    return re.sub(r"^postgres(ql)?(\+\w+)?://", "postgresql+psycopg2://", raw)


def make_engine(url):
    return create_engine(url, pool_pre_ping=True, future=True,
                         connect_args={"connect_timeout": 6} if url.startswith("postgresql") else {})


# --------------------------------------------------------------------------- #
def _sample_json_keys(engine, table, col, limit=40):
    """Sample a JSON column and return its top-level keys (values never leave the DB)."""
    keys = set()
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(f'SELECT "{col}" FROM "{table}" WHERE "{col}" IS NOT NULL LIMIT {limit}'))
            for (val,) in rows:
                if isinstance(val, str):
                    import json
                    try:
                        val = json.loads(val)
                    except ValueError:
                        continue
                if isinstance(val, dict):
                    keys.update(val.keys())
    except Exception:
        pass
    return sorted(keys)[:25]


def introspect(engine, max_tables=80):
    """Return {tables: {table: [{name,type,json_keys?}]}, tenant_tables: [...]}."""
    insp = inspect(engine)
    tables = {}
    tenant_tables = []
    names = [n for n in insp.get_table_names() if not n.startswith(("django_", "auth_", "sql"))]
    for tname in names[:max_tables]:
        cols = []
        for c in insp.get_columns(tname):
            ctype = str(c["type"])
            entry = {"name": c["name"], "type": ctype}
            if "json" in ctype.lower():
                jk = _sample_json_keys(engine, tname, c["name"])
                if jk:
                    entry["json_keys"] = jk
            cols.append(entry)
        tables[tname] = cols
        if any(c["name"] == "tenant_id" for c in cols):
            tenant_tables.append(tname)
    return {"tables": tables, "tenant_tables": tenant_tables}


def schema_doc(schema, scoped=False):
    lines = []
    for tname, cols in schema["tables"].items():
        parts = []
        for c in cols:
            if c.get("json_keys"):
                parts.append(f"{c['name']} {c['type']} [keys: {', '.join(c['json_keys'])}]")
            else:
                parts.append(f"{c['name']} {c['type']}")
        lines.append(f"- {tname}({', '.join(parts)})")
    note = ("\nNOTE: all tables are automatically filtered to the current organisation; "
            "do NOT add a tenant filter yourself.\n") if scoped else ""
    return note + "\n".join(lines)


# --------------------------------------------------------------------------- #
def _jsonable(v):
    if isinstance(v, decimal.Decimal):
        return float(v)
    if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
        return v.isoformat()
    if isinstance(v, (bytes, bytearray, memoryview)):
        return "<binary>"
    return v


def assert_read_only(sql):
    s = (sql or "").strip().rstrip(";").strip()
    if not s:
        raise QueryError("Empty query.")
    if ";" in s:
        raise QueryError("Only a single statement is allowed.")
    low = s.lower()
    if not (low.startswith("select") or low.startswith("with")):
        raise QueryError("Only SELECT queries are allowed.")
    if _WRITE.search(s):
        raise QueryError("Only read-only SELECT queries are allowed.")
    return s


def run_select(engine, sql, is_postgres, tenant_id=None, tenant_tables=None,
               row_cap=1000, timeout_ms=8000):
    """Run a guarded read-only SELECT. Returns (columns, rows). Always rolled back."""
    sql = assert_read_only(sql)
    # When tenant scoping is active, temp views shadow the real tables — but only
    # for *bare* table names. Reject schema-qualified access so a query can't
    # reach past the per-tenant views into another org's rows or system catalogs.
    if tenant_id is not None and re.search(r"\b(public|pg_catalog|pg_temp\w*|information_schema)\s*\.", sql, re.I):
        raise QueryError("Schema-qualified table access is not allowed here.")
    columns, rows = [], []
    with engine.connect() as conn:
        # Phase 1 (writable): create session-scoped temp views that shadow every
        # tenant table. Temp views persist for the connection past this commit,
        # and creating them touches no base-table data.
        if is_postgres and tenant_id is not None and tenant_tables:
            setup = conn.begin()
            for t in tenant_tables:
                conn.execute(text(
                    f'CREATE OR REPLACE TEMP VIEW "{t}" AS '
                    f'SELECT * FROM public."{t}" WHERE tenant_id = :tid'
                ), {"tid": tenant_id})
            setup.commit()

        # Phase 2 (read-only): run the model's query, then always roll back.
        run = conn.begin()
        try:
            if is_postgres:
                conn.execute(text("SET TRANSACTION READ ONLY"))
                conn.execute(text(f"SET LOCAL statement_timeout = {int(timeout_ms)}"))
            result = conn.execute(text(sql))
            columns = list(result.keys())
            for i, r in enumerate(result):
                if i >= row_cap:
                    break
                rows.append({k: _jsonable(v) for k, v in zip(columns, r)})
        finally:
            run.rollback()
    return columns, rows
