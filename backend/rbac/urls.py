"""API routes for roles & access."""
from django.urls import path

from .views import (
    MyPermissionsView,
    RbacCatalogView,
    RolePermissionsView,
)

urlpatterns = [
    path("rbac/catalog/", RbacCatalogView.as_view(), name="rbac-catalog"),
    path("rbac/permissions/", RolePermissionsView.as_view(), name="rbac-permissions"),
    path("rbac/my-permissions/", MyPermissionsView.as_view(), name="rbac-my-permissions"),
]
