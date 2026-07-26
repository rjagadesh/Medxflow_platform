from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Allow anyone to GET (read).
    Only the owner can update (write).
    """

    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.created_by == request.user