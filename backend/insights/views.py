"""
Decision Engine chat API.

  GET    /api/decision-engine/connections/       -> list connections (built-in + stored)
  POST   /api/decision-engine/connections/       -> register an external DB {name, engine, connection_string}
  DELETE /api/decision-engine/connections/<id>/  -> remove a stored connection
  POST   /api/decision-engine/ask/               -> {connection_id, question} -> answer
"""
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import dbchat, llm, service
from .models import DataConnection

MAX_ROWS_OUT = 500


class ConnectionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(service.list_connections(request.user))

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        engine = request.data.get("engine") or "postgres"
        dsn = (request.data.get("connection_string") or "").strip()
        if not name or not dsn:
            raise ValidationError("Both a name and a connection string are required.")
        if engine not in dict(DataConnection.Engine.choices):
            raise ValidationError({"engine": "Unsupported engine."})
        try:
            conn = service.test_and_register(request.user, name, engine, dsn)
        except Exception as e:
            raise ValidationError({"connection_string": f"Could not connect / read schema: {e}"})
        return Response({
            "id": conn.id, "name": conn.name, "engine": conn.engine,
            "builtin": False, "status": conn.status, "table_count": conn.table_count,
        }, status=201)


class ConnectionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        service._stored_qs(request.user).filter(id=pk).delete()
        service.invalidate(f"conn:{pk}")
        return Response(status=204)


def _clean_chart(chart, columns):
    if not isinstance(chart, dict):
        return None
    ctype = chart.get("type", "none")
    if ctype == "none":
        return None
    x = chart.get("x")
    ys = [y for y in (chart.get("y") or []) if y in columns]
    if x not in columns or not ys:
        return None
    return {"type": ctype, "x": x, "y": ys, "title": chart.get("title") or ""}


class AskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        connection_id = request.data.get("connection_id") or "builtin"
        if not question:
            raise ValidationError("Ask a question.")

        try:
            engine, kind, is_pg, tid, _, cache_key = service.resolve(request.user, connection_id)
        except DataConnection.DoesNotExist:
            raise ValidationError("Unknown connection.")
        except Exception as e:
            return Response({"kind": "error", "summary": f"Couldn't open that connection: {e}"})

        try:
            schema = service.get_schema(engine, cache_key, tid)
            doc = dbchat.schema_doc(schema, scoped=tid is not None)

            plan = llm.plan(doc, question, kind)
            if plan.get("kind") == "schema":
                answer = plan.get("answer") or dbchat.schema_doc(schema, scoped=tid is not None)
                return Response({"kind": "schema", "summary": answer})
            if plan.get("kind") == "general":
                return Response({"kind": "general", "summary": llm.general(question)})

            sql = plan.get("sql")
            if not sql:
                return Response({"kind": "error", "summary": "I couldn't form a query for that."})

            tenant_tables = schema["tenant_tables"] if tid is not None else None
            try:
                columns, rows = dbchat.run_select(engine, sql, is_pg, tid, tenant_tables)
            except Exception as first_err:
                # One repair attempt: hand the error back to the model.
                plan = llm.plan(doc, question, kind, prior_error=str(first_err))
                sql = plan.get("sql") or sql
                columns, rows = dbchat.run_select(engine, sql, is_pg, tid, tenant_tables)

            presented = llm.present(question, columns, rows)
            return Response({
                "kind": "sql",
                "summary": presented.get("summary", ""),
                "sql": sql,
                "columns": columns,
                "rows": rows[:MAX_ROWS_OUT],
                "row_count": len(rows),
                "chart": _clean_chart(presented.get("chart"), columns),
            })
        except llm.LLMUnavailable:
            return Response({"kind": "error",
                             "summary": "The AI analyst is offline — set ANTHROPIC_API_KEY to enable the Decision Engine chat."})
        except dbchat.QueryError as e:
            return Response({"kind": "error", "summary": f"That query wasn't allowed: {e}"})
        except Exception as e:
            return Response({"kind": "error", "summary": f"Something went wrong: {e}"})
        finally:
            try:
                engine.dispose()
            except Exception:
                pass
