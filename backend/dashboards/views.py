"""
Dashboard API.

  GET    /api/dashboard/            -> { tiles (with live values), available }
  POST   /api/dashboard/tiles/      -> add a tile {metric, title?, size?}
  DELETE /api/dashboard/tiles/<id>/ -> remove a tile
  PUT    /api/dashboard/            -> replace the tile order {tiles:[{id,metric,size,title}]}
"""
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .metrics import BY_KEY, catalog_public, resolve_value
from .service import add_tile, get_config, remove_tile, serialize


def _ephemeral(tenant):
    """Super admins (no tenant) get a read-only default dashboard."""
    tiles = [
        {"id": "sa1", "metric": "skill_runs", "size": "sm"},
        {"id": "sa2", "metric": "success_rate", "size": "sm"},
        {"id": "sa3", "metric": "connectors", "size": "sm"},
        {"id": "sa4", "metric": "licenses", "size": "sm"},
    ]
    resolved = [{
        "id": t["id"], "metric": t["metric"], "title": BY_KEY[t["metric"]]["label"],
        "size": t["size"], "unit": BY_KEY[t["metric"]]["unit"],
        "color": BY_KEY[t["metric"]]["color"], "value": resolve_value(t["metric"], tenant),
    } for t in tiles]
    return {"tiles": resolved, "available": catalog_public(), "read_only": True}


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        if tenant is None:
            return Response(_ephemeral(None))
        return Response(serialize(get_config(tenant), tenant))

    def put(self, request):
        tenant = request.user.tenant
        if tenant is None:
            raise ValidationError("Super admin dashboard is read-only.")
        config = get_config(tenant)
        # Reorder/prune by id, preserving each tile's stored definition (query or
        # legacy metric) — never reconstruct from the client payload, so
        # LLM-composed tiles survive a reorder.
        by_id = {t.get("id"): t for t in config.tiles}
        ordered = [by_id[t.get("id")] for t in request.data.get("tiles", []) if t.get("id") in by_id]
        config.tiles = ordered or config.tiles
        config.save()
        return Response(serialize(config, tenant))


class DashboardTilesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = request.user.tenant
        if tenant is None:
            raise ValidationError("Super admin dashboard is read-only.")
        metric = request.data.get("metric")
        if metric not in BY_KEY:
            raise ValidationError({"metric": "Unknown metric."})
        config = get_config(tenant)
        ttype = request.data.get("type", "stat")
        add_tile(config, metric, request.data.get("title"),
                 "lg" if ttype == "chart" else request.data.get("size", "sm"),
                 ttype, request.data.get("color"))
        return Response(serialize(config, tenant), status=201)


class DashboardTileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, tile_id):
        tenant = request.user.tenant
        if tenant is None:
            raise ValidationError("Super admin dashboard is read-only.")
        config = get_config(tenant)
        remove_tile(config, tile_id)
        return Response(serialize(config, tenant))
