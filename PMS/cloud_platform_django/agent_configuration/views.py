from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Client
from modules.models import GeneratedAPI
import json
from .models import AgentConfiguration
from .gemini_integration import run_gemini_process
import traceback
from .prompt import prompt
# Create your views here.



class GeminiIntegrationSave(APIView):
    def post(self, request):
        try:
            # ✅ If files are present → data comes through request.POST
            print(request)
            if request.FILES:
                data = request.POST.dict()
                files = request.FILES.getlist("files")
            else:
                # ✅ Normal JSON request (no files)
                data = request.POST.dict()
                files = []

            is_save = str(data.get("save", "")).lower()
            print(files)
            print(data)

            # ✅ Run model when not saving
            if is_save != "true":
                if files:
                    response_text, final_prompt = run_gemini_process(data, files)
                else:
                    response_text, final_prompt = run_gemini_process(data)

                return Response({
                    "status": "success",
                    "response": response_text
                }, status=200)

            # ✅ Save to DB
            final_prompt = prompt(data)
            response = data_save_db(data, final_prompt)

            if response.get("status") == "success":
                return Response({"status": "success", "id": response.get("id")}, status=200)
            else:
                return Response({"status": "error"}, status=200)

        except Exception:
            return Response({
                "status": "error",
                "error": traceback.format_exc()
            }, status=500)




def data_save_db(data, final_prompt):

    agent = AgentConfiguration.objects.create(
        app_id=data.get("app_id"),         # ✅ accepts integer
        client_id=data.get("client_id"),   # ✅ accepts integer
        agent_name=data.get("agent_name", ""),
        agent_description=data.get("agent_description", ""),
        role=data.get("role", ""),
        few_shot=data.get("few_shot", ""),
        task=data.get("task", ""),
        rules=data.get("rules", ""),
        context=data.get("context", ""),
        config_data={"prompt": final_prompt}
    )

    return {
        "status": "success",
        "message": "Agent configuration saved successfully.",
        "id": agent.id,
        "config_data": agent.config_data
    }


class GeminiIntegrationList(APIView):
    def post(self, request):
        try:
            data = request.data
            app_id=data.get("app_id")        # ✅ accepts integer
            client_id=data.get("client_id")

                    # Filter tasks by agent and date range
            queryset = AgentConfiguration.objects.filter(
                app=app_id,
                client=client_id
            ).values()


            return Response({
                "status": "success",
                "response": queryset
            }, status=200)
        except Exception:
            error = traceback.format_exc() 
            return Response({
                "status": "error",
                "error": error
            }, status=500)
        


class GeminiIntegrationUpdate(APIView):
    def put(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))

            agent_update_id = data.get("id")

            response_text, final_prompt = run_gemini_process(data)

            AgentConfiguration.objects.filter(id=agent_update_id).update(
                app_id=data.get("app_id"),
                client_id=data.get("client_id"),
                agent_name=data.get("agent_name", ""),
                agent_description=data.get("agent_description", ""),
                role=data.get("role", ""),
                few_shot=data.get("few_shot", ""),
                task=data.get("task", ""),
                rules=data.get("rules", ""),
                context=data.get("context", ""),
                config_data=final_prompt
            )

            return Response({
                "status": "success",
                "message": response_text
            }, status=200)

        except Exception:
            error = traceback.format_exc()
            return Response({
                "status": "error",
                "error": error
            }, status=500)


class AgentConfigurationGetUsingAPIKEY(APIView):
    def get(self, request, apikey=None, *args, **kwargs):
        try:
            if not apikey:
                return Response({
                    "status": "error",
                    "message": "apikey is required"
                }, status=400)

            agent_name = request.query_params.get("agent_name")
            if not agent_name:
                return Response({
                    "status": "error",
                    "message": "agent_name is required"
                }, status=400)

            generated_api_data = GeneratedAPI.objects.filter(api_key=apikey).first()

            if not generated_api_data:
                return Response({
                    "status": "error",
                    "message": "Invalid API key"
                }, status=401)

            # related objects
            user = generated_api_data.user
            client = user.client
            app_instance = generated_api_data.apps  # ✔️ correct field name

            agent = AgentConfiguration.objects.filter(
                agent_name=agent_name,
                client=client,
                app=app_instance      # depends on your AgentConfiguration model
            ).values()

            print(f"agent1212:{app_instance,client,agent_name}")

            return Response({
                "status": "success",
                "data": agent
            }, status=200)

        except Exception:
            error = traceback.format_exc()
            return Response({
                "status": "error",
                "error": error
            }, status=500)
