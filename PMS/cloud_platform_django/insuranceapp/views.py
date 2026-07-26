from rest_framework import viewsets
from .models import Insurance
from .serializers import InsuranceSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from modules.models import App  # your App model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY") or request.query_params.get("api_key")

        if not api_key:
            return None  # no authentication header → let other authenticators (like JWT) handle

        try:
            app = App.objects.get(api_key=api_key)
        except App.DoesNotExist:
            raise AuthenticationFailed("Invalid API Key")

        # ✅ Return the user, not the app
        request.app = app  # attach app if you need it later
        return (app.user, None)


class JWTAndAPIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        api_key = request.headers.get("X-API-KEY")

        if not auth_header or not api_key:
            return None

        # Decode JWT
        try:
            user = JWTAuthentication().authenticate(request)
        except Exception:
            raise exceptions.AuthenticationFailed("Invalid JWT token")

        # Validate API key
        try:
            app = App.objects.get(api_key=api_key)
        except App.DoesNotExist:
            raise exceptions.AuthenticationFailed("Invalid API key")

        # ✅ FIX: return App object instead of string
        return (user[0], app)



class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY") or request.query_params.get("api_key")

        if not api_key:
            return None  # let JWT or other auth handle it

        try:
            app = App.objects.get(api_key=api_key)
        except App.DoesNotExist:
            raise AuthenticationFailed("Invalid API Key")

        # ✅ attach the app to request for later use
        request.app = app

        # ✅ return the real user instead of app
        return (app.user, None)
  

class InsuranceViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceSerializer
    authentication_classes = [JWTAndAPIKeyAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Insurance.objects.filter(tenant=self.request.user)

    def perform_create(self, serializer):
        # set tenant and apikey automatically
        serializer.save(
            tenant=self.request.user,
            apikey=self.request.auth  # request.auth will be API key from JWTAndAPIKeyAuthentication
        )

    def perform_update(self, serializer):
        serializer.save(
            tenant=self.request.user,
            apikey=self.request.auth
        )


class PendingInsuranceAPIView(APIView):
    authentication_classes = [JWTAndAPIKeyAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        first_pending = (
            Insurance.objects.filter(tenant=request.user, status="PENDING")
            .order_by("created_at")  # make sure you have created_at field
            .first()
        )

        if first_pending:
            serializer = InsuranceSerializer(first_pending)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "No pending insurance found"},
                status=status.HTTP_404_NOT_FOUND,
            )
    
    
class InsuranceStatusUpdateAPIView(APIView):
    authentication_classes = [JWTAndAPIKeyAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        new_status = request.data.get("status")

        # validate against choices
        if new_status not in dict(Insurance.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status. Allowed values: PENDING, SUCCESS, FAILURE"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            insurance = Insurance.objects.get(pk=pk, tenant=request.user)
        except Insurance.DoesNotExist:
            return Response(
                {"error": "Insurance not found or you do not have permission"},
                status=status.HTTP_404_NOT_FOUND
            )

        insurance.status = new_status
        insurance.save()

        return Response(
            {"message": f"Status updated to {new_status}"},
            status=status.HTTP_200_OK
        )
