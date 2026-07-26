from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, action
from django.db import transaction
import requests
from .service import call_gemini
from django.conf import settings
from twilio.rest import Client as tw_client
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from modules.models import *
import json
from datetime import datetime, timedelta, time
from rest_framework.viewsets import ModelViewSet
from .models import *
from .serializers import *
from agentsapp.models import AgentTask
from django.utils import timezone
from django.utils.dateparse import parse_date
import os
import random
from math import ceil
from livekit import api
from livekit.api import room_service  # Correct import
import asyncio
# Create your views here.
from django.db.models import Q, Count, Sum, Avg, Min
from rest_framework import viewsets, status
from datetime import timedelta

import json
import random
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from livekit import api
import traceback
import google.generativeai as genai
import tempfile
import mimetypes
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from agentsapp.models import AgentTask
from agentsapp.serializers import AgentTaskSerializer
# @api_view(["POST"])
# def get_livekit_connection_details(request):
#     """
#     Generate a LiveKit participant token.
#     Replicates the logic from voice-next-2/app/api/connection-details/route.ts
#     """
#     LIVEKIT_URL = os.getenv("LIVEKIT_URL")
#     LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
#     LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

#     if not LIVEKIT_URL or not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
#         return Response(
#             {"error": "LiveKit configuration missing"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

#     try:
#         # Generate participant details
#         participant_identity = f"voice_assistant_user_{random.randint(0, 10000)}"
#         participant_name = request.data.get("participant_name", "user")
        
#         # Allow room name to be specified in request, or generate one
#         room_name = request.data.get("room_name", f"voice_assistant_room_{random.randint(0, 10000)}")
        
#         # Get voice from request
#         selected_voice = request.data.get("voice", "leda")
        
#         # Get agent name from request
#         room_config = request.data.get("room_config", {})
#         agents = room_config.get("agents", [])
#         agent_name = agents[0].get("agent_name") if agents else None

#         # Prepare room metadata
#         room_metadata = json.dumps({
#             "voice": selected_voice,
#             "created_at": datetime.now().isoformat(),
#         })
        
#         # Create access token with participant metadata
#         token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
#             .with_identity(participant_identity) \
#             .with_name(participant_name) \
#             .with_metadata(json.dumps({
#                 "voice": selected_voice,
#                 "role": "user"
#             })) \
#             .with_grants(api.VideoGrants(
#                 room_join=True,
#                 room=room_name,
#                 can_publish=True,
#                 can_publish_data=True,
#                 can_subscribe=True,
#             ))

#         # Prepare list of agents
#         agents_list = []
#         if agent_name:
#             print(f"Adding agent dispatch: {agent_name}")
#             agents_list.append(
#                 api.RoomAgentDispatch(
#                     agent_name=agent_name,
#                     metadata=json.dumps({"voice": selected_voice})
#                 )
#             )

#         # Create RoomConfiguration with metadata AND agents
#         room_config_obj = api.RoomConfiguration(
#             name=room_name,
#             metadata=room_metadata,
#             agents=agents_list,
#         )

#         # Apply configuration to token
#         token = token.with_room_config(room_config_obj)
            
#         jwt_token = token.to_jwt()

#         response_data = {
#             "serverUrl": LIVEKIT_URL,
#             "roomName": room_name,
#             "participantToken": jwt_token,
#             "participantName": participant_name,
#         }
        
#         print(f"Token generated successfully for room: {room_name}")
#         return Response(response_data, status=status.HTTP_200_OK)

#     except Exception as e:
#         print(f"Error generating LiveKit token: {e}")
#         import traceback
#         traceback.print_exc()
#         return Response(
#             {"error": str(e)},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


@api_view(["POST"])
def get_livekit_connection_details(request):
    
    LIVEKIT_URL = os.getenv("LIVEKIT_URL")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

    try:
        participant_identity = f"voice_assistant_user_{random.randint(0, 10000)}"
        participant_name = "user"
        room_name = f"voice_assistant_room_{random.randint(0, 10000)}"
        selected_voice = request.data.get("voice", "Puck")
        isTesting = request.data.get("testing", False)

        metadata_dict = {}
        should_dispatch = False  # ✅ separate flag

        if isTesting:
            metadata_dict["user_id"]      = request.data.get("userId")
            metadata_dict["agent_id"]     = request.data.get("agentId")
            metadata_dict["version_name"] = request.data.get("versionId")
            should_dispatch = True  # ✅ always dispatch for test
        else:
            metadata_dict["voice"] = selected_voice
            agent_name = request.data.get("room_config", {}).get("agents", [{}])[0].get("agent_name")
            should_dispatch = bool(agent_name)

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(participant_identity) \
            .with_name(participant_name) \
            .with_metadata(json.dumps(metadata_dict)) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
            ))

        if should_dispatch:
            token.with_room_config(
                api.RoomConfiguration(
                    agents=[api.RoomAgentDispatch(
                        agent_name="",  # ✅ empty = any available worker
                        metadata=json.dumps(metadata_dict)
                    )],
                )
            )
            print(f"✅ Agent dispatch set")
        else:
            print("⚠️ No agent dispatch")

        jwt_token = token.to_jwt()

        return Response({
            "serverUrl": LIVEKIT_URL,
            "roomName": room_name,
            "participantToken": jwt_token,
            "participantName": participant_name,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(["POST"])
def update_room_metadata(request):
    """
    Update room metadata via backend API
    """
    async def _update():
        livekit_api = api.LiveKitAPI(
            url=os.getenv("LIVEKIT_URL"),
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET")
        )
        try:
            room_name = request.data.get("roomName")
            metadata = request.data.get("metadata")  # Should be a dict
            
            if not room_name or metadata is None:
                return {"error": "roomName and metadata are required", "status": status.HTTP_400_BAD_REQUEST}
            
            # Convert metadata dict to JSON string if it isn't already
            if isinstance(metadata, dict):
                metadata = json.dumps(metadata)
            
            # Update room metadata using LiveKit API
            room = await livekit_api.room.update_room_metadata(
                api.UpdateRoomMetadataRequest(
                    room=room_name,
                    metadata=metadata
                )
            )
            
            return {
                "success": True,
                "roomName": room_name,
                "metadata": metadata,
                "room": {
                    "name": room.name,
                    "metadata": room.metadata
                },
                "status": status.HTTP_200_OK
            }
        finally:
            await livekit_api.aclose()

    try:
        result = asyncio.run(_update())
        if "error" in result:
            return Response({"error": result["error"]}, status=result["status"])
        
        return Response(result, status=result["status"])
        
    except Exception as e:
        print(f"Error updating room metadata: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def home(request):
    return Response({"status":"success"},status=status.HTTP_200_OK)


class AgentLifeCycleViewSet(ModelViewSet):
    queryset = AgentLifeCycle.objects.all().order_by("-created_at")
    serializer_class = AgentLifeCycleSerializer


# class TelephonySettingsViewSet(ModelViewSet):
#     serializer_class = TelephonySettingsSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         # 🔒 Only return agents for logged-in user's client
#         return TelephonySettings.objects.filter(
#             client=self.request.user.client
#         ).order_by("-created_at")

#     def perform_create(self, serializer):
#         # 🔥 Force client assignment at DB level
#         serializer.save(client=self.request.user.client)

class TelephonySettingsViewSet(ModelViewSet):
    serializer_class = TelephonySettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        client = getattr(user, 'client', None)
        
        if not client:
            return TelephonySettings.objects.none()
            
        return TelephonySettings.objects.filter(
            client=client
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(client=self.request.user.client)
    
    # 🔒 Add this to give a cleaner error instead of 404
    def get_object(self):
        try:
            return super().get_object()
        except Exception:
            raise serializers.ValidationError(
                {"detail": "Record not found or does not belong to your account."}
            )


class AgentVersionViewSet(ModelViewSet):
    queryset = AgentVersion.objects.all().order_by("-created_at")
    serializer_class = AgentVersionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        app_id = self.request.query_params.get('app')
        
        if app_id:
            queryset = queryset.filter(app_id=app_id)
        
        if self.request.user.is_authenticated and hasattr(self.request.user, 'client') and self.request.user.client:
             queryset = queryset.filter(client_id=self.request.user.client)
            
        return queryset

    def perform_create(self, serializer):
        save_kwargs = {}
        if self.request.user.is_authenticated:
            save_kwargs['created_by'] = self.request.user
            if hasattr(self.request.user, 'client') and self.request.user.client:
                save_kwargs['client_id'] = self.request.user.client
        
        instance = serializer.save(**save_kwargs)
        
        # if instance.status == "Active":
        #     AgentVersion.objects.filter(app=instance.app, status="Active").exclude(id=instance.id).update(status="Paused")

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # if instance.status == "Active":
        #     AgentVersion.objects.filter(app=instance.app, status="Active").exclude(id=instance.id).update(status="Paused")

    @staticmethod
    def _normalize_function_list(fn_list):
        """
        Ensure every function item in a list has a 'headers' field (list of {key, value}).
        Preserves existing headers; adds an empty list if missing.
        """
        if not isinstance(fn_list, list):
            return fn_list
        normalized = []
        for fn in fn_list:
            if isinstance(fn, dict):
                fn = dict(fn)
                if not isinstance(fn.get('headers'), list):
                    fn['headers'] = []
                else:
                    # Ensure each header has key/value fields
                    fn['headers'] = [
                        {
                            'key': h.get('key', '') if isinstance(h, dict) else '',
                            'value': h.get('value', '') if isinstance(h, dict) else '',
                        }
                        for h in fn['headers']
                    ]
            normalized.append(fn)
        return normalized

    @action(detail=False, methods=['post'])
    def clone_version(self, request):
        app_id = request.data.get('app')
        new_version_number = request.data.get('version_number')
        source_version_id = request.data.get('source_version_id')
        
        telephony_updates = request.data.get('telephony_updates', {})
        prompt_updates = request.data.get('prompt_updates', {})
        lifecycle_updates = request.data.get('lifecycle_updates', {})

        # Normalize headers in function lists within lifecycle_updates
        if 'uni_directional_calls' in lifecycle_updates:
            lifecycle_updates['uni_directional_calls'] = self._normalize_function_list(
                lifecycle_updates['uni_directional_calls']
            )
        if 'bi_directional_calls' in lifecycle_updates:
            lifecycle_updates['bi_directional_calls'] = self._normalize_function_list(
                lifecycle_updates['bi_directional_calls']
            )
        
        # 1. Find Source
        source_version = None
        if source_version_id:
            source_version = AgentVersion.objects.filter(id=source_version_id).first()
        elif app_id:
            # Find latest for the app
            source_version = AgentVersion.objects.filter(app_id=app_id).order_by('-created_at').first()

        with transaction.atomic():
            # Clone Lifecycle
            new_lifecycle = None
            if source_version and source_version.life_cycle_id:
                new_lifecycle = source_version.life_cycle_id
                new_lifecycle.pk = None

                # Normalize headers in source lifecycle function lists before cloning
                if isinstance(new_lifecycle.uni_directional_calls, list):
                    new_lifecycle.uni_directional_calls = self._normalize_function_list(
                        new_lifecycle.uni_directional_calls
                    )
                if isinstance(new_lifecycle.bi_directional_calls, list):
                    new_lifecycle.bi_directional_calls = self._normalize_function_list(
                        new_lifecycle.bi_directional_calls
                    )
                
                # Apply updates
                for k, v in lifecycle_updates.items():
                     if hasattr(new_lifecycle, k):
                        setattr(new_lifecycle, k, v)
                new_lifecycle.save()
            else:
                new_lifecycle = AgentLifeCycle.objects.create(**lifecycle_updates)

            # Clone Telephony
            new_telephony = None
            if source_version and source_version.Telephony_Settings_id:
                new_telephony = source_version.Telephony_Settings_id
                new_telephony.pk = None
                new_telephony.client = request.user.client  # ✅ ADD THIS
                # Apply updates
                for k, v in telephony_updates.items():
                     if hasattr(new_telephony, k):
                        setattr(new_telephony, k, v)
                new_telephony.save()
            else:
                 new_telephony = TelephonySettings.objects.create(
                    client=request.user.client,  # ✅ ADD THIS
                    **telephony_updates
                )

            # Clone Version Data
            # Start with source version data
            version_data = {}
            if source_version:
                version_data['voice'] = source_version.voice
                version_data['language'] = source_version.language
                version_data['agent_type'] = source_version.agent_type
                version_data['voice_type'] = source_version.voice_type

                version_data['gemini_model'] = source_version.gemini_model
                version_data['weekend_support'] = source_version.weekend_support
                version_data['active_days'] = source_version.active_days
                version_data['background_audio'] = source_version.background_audio
            # Update with request data
            for field in ['voice', 'language', 'agent_type', 'gemini_model', 'status', 'agent_name', 'weekend_support']:
                if field in request.data:
                    version_data[field] = request.data[field]
            
            # Create new version
            new_version = AgentVersion(
                app_id=app_id,
                version_number=new_version_number,
                life_cycle_id=new_lifecycle,
                Telephony_Settings_id=new_telephony,
                client_id=request.user.client if request.user.is_authenticated else None,
                **version_data
            )
            
            if request.user.is_authenticated:
                new_version.created_by = request.user
            
            new_version.save()
            
            # Clone Prompt
            if source_version and hasattr(source_version, 'prompt') and source_version.prompt:
                new_prompt = source_version.prompt
                new_prompt.pk = None
                new_prompt.agent = new_version
                
                for k, v in prompt_updates.items():
                    if hasattr(new_prompt, k):
                        setattr(new_prompt, k, v)
                new_prompt.save()
            elif prompt_updates:
                AgentScript.objects.create(agent=new_version, **prompt_updates)

            return Response(self.get_serializer(new_version).data, status=status.HTTP_201_CREATED)

class AgentScriptViewSet(ModelViewSet):
    queryset = AgentScript.objects.all().order_by("-created_at")
    serializer_class = AgentScriptSerializer

    @action(detail=False, methods=['get'])
    def get_by_version(self, request):
        version_id = request.query_params.get('version_id')
        if not version_id:
            return Response({"error": "version_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        script = AgentScript.objects.filter(agent_id=version_id).first()
        if not script:
            return Response({"script": ""}, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(script)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OptimizeScriptAPI(APIView):
    def post(self, request):
        try:
            current_script = request.data.get("current_script", "")
            user_instruction = request.data.get("user_instruction", "")
            version_id = request.data.get("version_id")
            if version_id:
                try:
                    agent_version = AgentVersion.objects.get(id=version_id)
                except AgentVersion.DoesNotExist:
                    return Response(
                        {"error": "Invalid version_id"},
                        status=status.HTTP_404_NOT_FOUND
                    )

            agent_name = agent_version.agent_name if version_id else ""
            if not user_instruction:
                return Response({"error": "User instruction is required"}, status=status.HTTP_400_BAD_REQUEST)

            prompt = f"""
            
            You are an expert AI agent script optimizer.
            
            Your task is to update or optimize the current script based on the user's instruction.
            Return ONLY the updated script text. Do not include any explanations, markdown formatting, or preamble.
            
            
            You are an expert AI prompt engineer specializing in designing voice AI agent scripts.

            I will give you a document that contains all the details, steps, and instructions for a voice AI agent to follow during a call. Your job is to convert this into a complete, structured voice AI agent script.

            The script must be written as direct instructions to the agent — not in first person ("I will..."), not as a narrative. Write it as if you are telling the agent exactly what to do and say, like a rule book the agent reads and follows.

            Never state it is an AI / voice agent anywhere in the script. Generate it to speak exactly like a human.

            Use this format and style:

            ---
            **ROLE:**
            Who the agent is, what their purpose is, how they should present themselves. Agent name is {agent_name}. Generate it like this : You are {agent_name}, [add your role (eg : Appointment coordinator, insurance verification representative etc..)]

            *CALL FLOW:*
            List every question or action from the document in order. Write each as a direct instruction or as the exact question the agent should ask. Include any conditional steps, follow-ups, codes, or notes exactly as the document describes.

            **RULES**
            List every rule, restriction, and behavioral instruction from the document as firm directives. Write them as strict rules the agent must never break.
            - Speak like an Human. Never mention AI anywhere.
            [continue call rules]

            **CALL CLOSING**
            - End the call naturally after obtaining all informations

            Now generate the complete voice AI agent script using only the information from the document below.
            Do not add anything not present in the document. Do not remove or summarize anything. Do not write in first person. Write every instruction as a direct directive to the agent.

            CURRENT SCRIPT:
            {current_script}
            
            USER INSTRUCTION:
            {user_instruction}
            """

            model = genai.GenerativeModel(model_name="gemini-2.0-flash")
            response = model.generate_content(prompt)
            updated_script = response.text.strip()

            return Response({"updated_script": updated_script}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 

 
class AgentPromptViewSet(ModelViewSet):
    queryset = AgentScript.objects.all().order_by("-created_at")
    serializer_class = AgentScriptSerializer


class ConfigJSONViewSet(ModelViewSet):
    serializer_class = ConfigJSONSerializer

    def get_queryset(self):
        agent_version_id = self.request.query_params.get('agent_version_id')

        if agent_version_id:
            try:
                agent_version = AgentVersion.objects.get(id=agent_version_id)

                # Try with app + client first
                queryset = ConfigJSON.objects.filter(
                    app=agent_version.app,
                    client=agent_version.client_id
                ).order_by("-created_at")

                # If no results, fallback to app only (client is None in config)
                if not queryset.exists():
                    queryset = ConfigJSON.objects.filter(
                        app=agent_version.app,
                        client__isnull=True
                    ).order_by("-created_at")

                return queryset

            except AgentVersion.DoesNotExist:
                return ConfigJSON.objects.none()

        return ConfigJSON.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        agent_version_id = self.request.data.get('agent_version_id')

        if agent_version_id:
            try:
                agent_version = AgentVersion.objects.get(id=agent_version_id)
                serializer.save(
                    app=agent_version.app,
                    client=agent_version.client_id  # will save as None if not present, that's fine
                )
                return
            except AgentVersion.DoesNotExist:
                raise serializers.ValidationError("Invalid agent_version_id")

        serializer.save()


class ConversationAnalysisAPI(APIView):
    def get(self, request, pk=None):
        try:
            # 1. Hit the transcription API
            transcription_url = "https://vira.droidal.com/tts/transcription"
            params = {"app_id": pk}
            response = requests.get(transcription_url, params=params)
            
            if response.status_code != 200:
                return Response(
                    {"error": f"Failed to fetch transcription. Status code: {response.status_code}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # The API returns raw text as shown in the feedback
            conversation_data = response.text
            
            # 2. Get gemini response
            # Fetch input JSON from ConfigJSON table using pk as app_id
            input_json = {}
            config = ConfigJSON.objects.filter(app_id=pk).first()
            if config:
                input_json = config.config_data

            gemini_response = call_gemini(
                conversation_data=conversation_data,
                input_json=input_json
            )
            
            # 3. Return only entities from gemini response without saving to DB
            entities = {}
            if isinstance(gemini_response, dict):
                entities = gemini_response.get('entities', gemini_response)
            
            return Response(entities, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, pk=None):
        try:
            # 1. Get conversation history from request data
            # The frontend sends: { id: agentId, messages: messages }
            conversation_data = request.data.get('messages')
            
            if not conversation_data:
                return Response(
                    {"error": "No conversation history provided in 'messages' field."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 2. Get gemini response
            # Fetch input JSON from ConfigJSON table using pk as app_id
            input_json = {}
            config = ConfigJSON.objects.filter(app_id=pk).first()
            if config:
                input_json = config.config_data

            gemini_response = call_gemini(
                conversation_data=conversation_data,
                input_json=input_json
            )
            
            # 3. Return only entities from gemini response without saving to DB
            entities = {}
            if isinstance(gemini_response, dict):
                entities = gemini_response.get('entities', gemini_response)
            
            return Response(entities, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



import asyncio
from livekit import api as lk_api_module
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from twilio.rest import Client as tw_client
from django.conf import settings
from .models import MobileNumber


class TwiMLVoiceHandler(APIView):
    """
    Public endpoint Twilio calls on inbound voice.
    Uses the 'To' param (the dialed number) to route into LiveKit.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        to_number = request.data.get("To", "")

        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip username="twilio_user" password="StrongPass123!">
      sip:{number}@{domain}
    </Sip>
  </Dial>
</Response>""".format(
            number=to_number,
            username=settings.TWILIO_SIP_USERNAME,
            password=settings.TWILIO_SIP_PASSWORD,
            domain=settings.LIVEKIT_SIP_DOMAIN,
        )
        print(f"TwiML generated for {to_number}: {twiml}", flush=True)  # debug log
        return HttpResponse(twiml, content_type="application/xml")



class ListofAvailableNumber(APIView):
    permission_classes = [IsAuthenticated]

    def _get_twilio_client(self):
        return tw_client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    def _get_twiml_url(self) -> str:
        return f"{settings.BASE_URL}/app/voice-ai/twiml-bin/"

    def _assign_number_to_elastic_trunk(self, client, number_sid: str) -> None:
        trunk_sid = settings.TWILIO_ELASTIC_TRUNK_SID
        try:
            client.trunking.v1.trunks(trunk_sid).phone_numbers.create(
                phone_number_sid=number_sid
            )
            print(f"✅ Number assigned to Elastic trunk: {trunk_sid}")
        except Exception as e:
            raise Exception(f"Failed to assign number to Elastic trunk: {e}")

    def _add_number_to_livekit_inbound_trunk(self, new_number: str) -> None:
        async def _run():
            lk = lk_api_module.LiveKitAPI(
                url=settings.LIVEKIT_API_URL,
                api_key=settings.LIVEKIT_API_KEY,
                api_secret=settings.LIVEKIT_API_SECRET,
            )
            try:
                response = await lk.sip.list_sip_inbound_trunk(
                    lk_api_module.ListSIPInboundTrunkRequest(
                        trunk_ids=[settings.LIVEKIT_SIP_INBOUND_TRUNK_ID]
                    )
                )
                trunk = next(
                    (t for t in response.items if t.sip_trunk_id == settings.LIVEKIT_SIP_INBOUND_TRUNK_ID),
                    None
                )
                if not trunk:
                    raise Exception(f"Inbound trunk {settings.LIVEKIT_SIP_INBOUND_TRUNK_ID} not found")

                existing = list(trunk.numbers)
                if new_number in existing:
                    print(f" {new_number} already in LiveKit inbound trunk")
                    return

                await lk.sip.update_sip_inbound_trunk(
                    trunk_id=settings.LIVEKIT_SIP_INBOUND_TRUNK_ID,
                    trunk=lk_api_module.SIPInboundTrunkInfo(
                        name=trunk.name,
                        numbers=existing + [new_number],
                        auth_username=trunk.auth_username,
                        auth_password=trunk.auth_password,
                    )
                )
                print(f"✅ Added {new_number} to LiveKit inbound trunk")
            finally:
                await lk.aclose()

        asyncio.run(_run())

    def _remove_number_from_livekit_inbound_trunk(self, number: str) -> None:
        async def _run():
            lk = lk_api_module.LiveKitAPI(
                url=settings.LIVEKIT_API_URL,
                api_key=settings.LIVEKIT_API_KEY,
                api_secret=settings.LIVEKIT_API_SECRET,
            )
            try:
                response = await lk.sip.list_sip_inbound_trunk(
                    lk_api_module.ListSIPInboundTrunkRequest(
                        trunk_ids=[settings.LIVEKIT_SIP_INBOUND_TRUNK_ID]
                    )
                )
                trunk = next(
                    (t for t in response.items if t.sip_trunk_id == settings.LIVEKIT_SIP_INBOUND_TRUNK_ID),
                    None
                )
                if not trunk:
                    raise Exception(f"Inbound trunk {settings.LIVEKIT_SIP_INBOUND_TRUNK_ID} not found")

                updated_numbers = [n for n in trunk.numbers if n != number]

                await lk.sip.update_sip_inbound_trunk(
                    trunk_id=settings.LIVEKIT_SIP_INBOUND_TRUNK_ID,
                    trunk=lk_api_module.SIPInboundTrunkInfo(
                        name=trunk.name,
                        numbers=updated_numbers,
                        auth_username=trunk.auth_username,
                        auth_password=trunk.auth_password,
                    )
                )
                print(f"✅ Removed {number} from LiveKit inbound trunk")
            finally:
                await lk.aclose()

        asyncio.run(_run())

    # ─── GET ────────────────────────────────────────────────────────────────

    def get(self, request):
        country = request.query_params.get("country", "US")
        client = self._get_twilio_client()
        user = request.user

        # Fetch client's number limit and current usage
        client_obj = user.client
        if not client_obj:
            return Response({"error": "Client not found."}, status=404)

        allowed_limit = client_obj.number_limit
        current_count = MobileNumber.objects.filter(client_id=user.client_id).count()

        try:
            numbers = client.available_phone_numbers(country).local.list(
                sms_enabled=True,
                voice_enabled=True,
                limit=10
            )

            if not numbers:
                return Response({"error": "No available numbers"}, status=404)

            result = [
                {
                    "friendly_name": n.friendly_name,
                    "phone_number": n.phone_number,
                    "region": n.region,
                    "locality": n.locality,
                    "iso_country": n.iso_country,
                    "capabilities": {
                        "sms": n.capabilities.get("SMS"),
                        "voice": n.capabilities.get("Voice"),
                    },
                }
                for n in numbers
            ]
            return Response({
                "result": result,
                "number_limit": allowed_limit,
                "numbers_used": current_count,
                "numbers_remaining": max(0, allowed_limit - current_count),
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)


    def post(self, request):
        client = self._get_twilio_client()
        user = request.user
        client_id = user.client_id

        # Fetch limit from Client model instead of hardcoding
        client_obj = user.client
        if not client_obj:
            return Response({"error": "Client not found."}, status=404)

        allowed_limit = client_obj.number_limit  # <-- dynamic limit

        if MobileNumber.objects.filter(client_id=client_id).count() >= allowed_limit:
            return Response({"error": f"Number limit reached ({allowed_limit})."}, status=400)


        phone_number = request.data.get("phone_number")
        if not phone_number:
            return Response({"error": "Please provide a valid phone number."}, status=400)

        purchased = None
        livekit_added = False

        try:
            # ── Step 1: Add to LiveKit inbound trunk FIRST ─────────────────
            self._add_number_to_livekit_inbound_trunk(phone_number)
            livekit_added = True

            # ── Step 2: Purchase number, wire to Django TwiML endpoint ─────
            purchased = client.incoming_phone_numbers.create(
                phone_number=phone_number,
                voice_url=self._get_twiml_url(),
                voice_method="POST",
            )
            print(f"✅ Number purchased: {purchased.phone_number}")

            # ── Step 3: Assign to Elastic SIP Trunk ───────────────────────
            # self._assign_number_to_elastic_trunk(client, purchased.sid)

            # ── Step 4: Save to DB ─────────────────────────────────────────
            MobileNumber.objects.create(
                mobile_number=purchased.phone_number,
                client_id=client_id,
                twilio_sid=purchased.sid,
            )

            return Response({
                "success": True,
                "phone_number": purchased.phone_number,
                "twilio_sid": purchased.sid,
            }, status=201)

        except Exception as e:
            # ── Rollback in reverse order ──────────────────────────────────
            if purchased:
                try:
                    client.incoming_phone_numbers(purchased.sid).delete()
                    print(f"🔄 Rolled back number: {purchased.phone_number}")
                except Exception:
                    pass

            if livekit_added:
                try:
                    self._remove_number_from_livekit_inbound_trunk(phone_number)
                    print(f"🔄 Rolled back LiveKit trunk number: {phone_number}")
                except Exception:
                    pass

            return Response({"error": str(e)}, status=400)

    # ─── DELETE ─────────────────────────────────────────────────────────────

    def delete(self, request, pk=None):
        user = request.user
        phone_number = request.data.get("phone_number")

        if not user.client:
            return Response({"error": "User not linked to client"}, status=400)

        try:
            number_obj = MobileNumber.objects.get(
                mobile_number=phone_number, client_id=user.client_id
            )
        except MobileNumber.DoesNotExist:
            return Response({"error": "Number not found for this client"}, status=404)

        client = self._get_twilio_client()

        # ── 1. Remove from LiveKit inbound trunk ───────────────────────────
        try:
            self._remove_number_from_livekit_inbound_trunk(phone_number)
        except Exception as e:
            print(f"LiveKit trunk removal skipped: {e}")

        # ── 2. Remove from Elastic trunk ───────────────────────────────────
        try:
            trunk_numbers = client.trunking.v1.trunks(
                settings.TWILIO_ELASTIC_TRUNK_SID
            ).phone_numbers.list()
            for tn in trunk_numbers:
                if tn.phone_number_sid == number_obj.twilio_sid:
                    tn.delete()
                    print(f"🗑️  Removed from Elastic trunk")
                    break
        except Exception as e:
            print(f"Elastic trunk removal skipped: {e}")

        # ── 3. Release Twilio number ───────────────────────────────────────
        try:
            client.incoming_phone_numbers(number_obj.twilio_sid).delete()
            print(f"🗑️  Released number: {phone_number}")
        except Exception as e:
            print(f"Number release skipped: {e}")

        # ── 4. Delete DB record ────────────────────────────────────────────
        number_obj.delete()

        return Response({"success": True, "message": "Number deleted successfully"})



class RetriveContantNumber(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Make sure user is linked to client
        if not user.client:
            return Response(
                {"error": "User not linked to client"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get numbers only for that client
        numbers = MobileNumber.objects.filter(
            client_id=user.client
        ).order_by("-created_at")

        serializer = MobileNumberSerializer(numbers, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    

class RetriveAgentData(APIView):
    permission_classes = []

    def post(self,request):
        agent_secret_key = request.data.get("agent_secret_key")
        generated_api = get_object_or_404(
            GeneratedAPI,
            api_key=agent_secret_key
        )
        serializer = RetriveAgentDataSerializer(generated_api)

        return Response(serializer.data,status=status.HTTP_200_OK)
                

class AgentInfoByPhoneNumberView(APIView):
    """
    API endpoint to retrieve all agent-related information by phone number.
    """
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response(
                {"error": "phone_number is required in the request body"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Step 1: Check if phone number exists in MobileNumber
            mobile_number_record = None
            try:
                mobile_number_record = MobileNumber.objects.get(
                    mobile_number=phone_number
                )
            except MobileNumber.DoesNotExist:
                pass
            
            # Step 2: Find TelephonySettings
            telephony_settings = TelephonySettings.objects.filter(
                mobile_numbers__mobile_number=phone_number
            ).first()
            
            if not telephony_settings:
                return Response(
                    {
                        "error": "No TelephonySettings found for this phone number",
                        "phone_number": phone_number,
                        "mobile_number_exists": mobile_number_record is not None
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Step 3: Find AgentVersion
            agent_version = AgentVersion.objects.filter(
                Telephony_Settings_id=telephony_settings
            ).first()
            
            if not agent_version:
                return Response(
                    {
                        "error": "No AgentVersion found for this phone number",
                        "phone_number": phone_number,
                        "telephony_settings_id": telephony_settings.id
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Step 4: Get related AgentLifeCycle - ✅ FORCE FRESH QUERY
            agent_lifecycle = None
            if agent_version.life_cycle_id:
                agent_lifecycle = AgentLifeCycle.objects.get(
                    id=agent_version.life_cycle_id.id
                )
            
            # Step 5: Get related AgentPrompt
            agent_prompt = None
            try:
                agent_prompt = AgentScript.objects.get(agent=agent_version)
            except AgentScript.DoesNotExist:
                pass
            
            # Step 6: Get ConfigJSON
            config_json = None
            if agent_version.app:
                filters = {"app": agent_version.app}
                
                if agent_version.client_id:
                    filters["client"] = agent_version.client_id
                
                config_json = ConfigJSON.objects.filter(**filters).first()
                
                # Fallback: if no result, try with client=None
                if not config_json:
                    config_json = ConfigJSON.objects.filter(
                        app=agent_version.app,
                        client__isnull=True
                    ).first()
            
            # Step 7: Build response
            response_data = {
                "phone_number": phone_number,
            }
            
            # Serialize objects
            try:
                if telephony_settings:
                    response_data["telephony_settings"] = PhoneNumberTelephonySettingsSerializer(telephony_settings).data
                else:
                    response_data["telephony_settings"] = None
            except Exception as e:
                response_data["telephony_settings"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_version:
                    response_data["agent_version"] = PhoneNumberAgentVersionSerializer(agent_version).data
                else:
                    response_data["agent_version"] = None
            except Exception as e:
                response_data["agent_version"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_lifecycle:
                    # ✅ Serializer will use the fresh object from database
                    response_data["agent_lifecycle"] = PhoneNumberAgentLifeCycleSerializer(agent_lifecycle).data
                else:
                    response_data["agent_lifecycle"] = None
            except Exception as e:
                response_data["agent_lifecycle"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_prompt:
                    response_data["agent_prompt"] = PhoneNumberAgentPromptSerializer(agent_prompt).data
                else:
                    response_data["agent_prompt"] = None
            except Exception as e:
                response_data["agent_prompt"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if config_json:
                    response_data["config_json"] = PhoneNumberConfigJSONSerializer(config_json).data
                else:
                    response_data["config_json"] = None
            except Exception as e:
                response_data["config_json"] = {"error": f"Serialization failed: {str(e)}"}
            
            # Add mobile_number_info
            if mobile_number_record:
                response_data["mobile_number_info"] = {
                    "id": mobile_number_record.id,
                    "mobile_number": mobile_number_record.mobile_number,
                    "twilio_sid": mobile_number_record.twilio_sid,
                    "client_id": mobile_number_record.client.id if mobile_number_record.client else None,
                    "created_at": mobile_number_record.created_at.isoformat() if mobile_number_record.created_at else None,
                    "updated_at": mobile_number_record.updated_at.isoformat() if mobile_number_record.updated_at else None,
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    "error": f"An unexpected error occurred: {str(e)}",
                    "error_type": type(e).__name__
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AgentInfoByAppUserView(APIView):
    """
    Retrieve agent info by app_id + user_id
    """

    def post(self, request):

        app_id = request.data.get("app_id")
        user_id = request.data.get("user_id")

        if not app_id or not user_id:
            return Response(
                {"error": "app_id and user_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            agent_version = AgentVersion.objects.filter(
                app_id=app_id,
                created_by_id=user_id
            ).order_by("-created_at").first()

            if not agent_version:
                return Response(
                    {"error": "No AgentVersion found for this app_id and user_id"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get related objects
            telephony_settings = agent_version.Telephony_Settings_id
            agent_lifecycle = AgentLifeCycle.objects.get(id=agent_version.life_cycle_id.id)
            
            # Get related AgentPrompt
            agent_prompt = None
            try:
                agent_prompt = AgentScript.objects.get(agent=agent_version)
            except AgentScript.DoesNotExist:
                pass

            # Get ConfigJSON for the app
            config_json = None
            if agent_version.app:
                filters = {"app": agent_version.app}
                
                if agent_version.client_id:
                    filters["client"] = agent_version.client_id
                
                config_json = ConfigJSON.objects.filter(**filters).first()
                
                # Fallback: if no result, try with client=None
                if not config_json:
                    config_json = ConfigJSON.objects.filter(
                        app=agent_version.app,
                        client__isnull=True
                    ).first()

            # Build the response with safe serialization
            response_data = {
                "app_id": app_id,
                "user_id": user_id,
            }
            
            # ✅ Fixed: Get phone numbers from related MobileNumber objects
            if telephony_settings:
                phone_numbers = list(
                    telephony_settings.mobile_numbers.values_list('mobile_number', flat=True)
                )
                response_data["phone_numbers"] = phone_numbers
                # Add primary phone number (first one)
                response_data["primary_phone_number"] = phone_numbers[0] if phone_numbers else None
            
            # Safely serialize each object
            try:
                if telephony_settings:
                    response_data["telephony_settings"] = PhoneNumberTelephonySettingsSerializer(telephony_settings).data
                else:
                    response_data["telephony_settings"] = None
            except Exception as e:
                response_data["telephony_settings"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_version:
                    response_data["agent_version"] = PhoneNumberAgentVersionSerializer(agent_version).data
                else:
                    response_data["agent_version"] = None
            except Exception as e:
                response_data["agent_version"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_lifecycle:
                    response_data["agent_lifecycle"] = PhoneNumberAgentLifeCycleSerializer(agent_lifecycle).data
                else:
                    response_data["agent_lifecycle"] = None
            except Exception as e:
                response_data["agent_lifecycle"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if agent_prompt:
                    response_data["agent_prompt"] = PhoneNumberAgentPromptSerializer(agent_prompt).data
                else:
                    response_data["agent_prompt"] = None
            except Exception as e:
                response_data["agent_prompt"] = {"error": f"Serialization failed: {str(e)}"}
            
            try:
                if config_json:
                    response_data["config_json"] = PhoneNumberConfigJSONSerializer(config_json).data
                else:
                    response_data["config_json"] = None
            except Exception as e:
                response_data["config_json"] = {"error": f"Serialization failed: {str(e)}"}

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    "error": f"An unexpected error occurred: {str(e)}",
                    "error_type": type(e).__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CallLogPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'  # Allow client to override: ?page_size=50
    max_page_size = 200
    page_query_param = 'page'           # ?page=2

    def get_paginated_response(self, data):
        return Response({
            'pagination': {
                'count': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'page': self.page.number,
                'page_size': self.get_page_size(self.request),
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
            },
            'results': data
        })

SORTABLE_FIELDS = {
    'start_time', '-start_time',
    'end_time', '-end_time',
    'duration_seconds', '-duration_seconds',
    'status', '-status',
    'from_number', '-from_number',
    'to_number', '-to_number',
    'created_at', '-created_at',
}
        
class CallLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing call logs - Public access (no authentication required)
    
    Endpoints:
    - GET /api/call-logs/ - List all call logs
    - POST /api/call-logs/ - Create new call log
    - GET /api/call-logs/{id}/ - Get specific call log
    - PUT /api/call-logs/{id}/ - Update call log
    - DELETE /api/call-logs/{id}/ - Delete call log
    - GET /api/call-logs/by-phone/ - Get logs by phone number
    - GET /api/call-logs/stats/ - Get call statistics

    Sorting:
    - ?ordering=start_time          → ascending
    - ?ordering=-start_time         → descending
    - ?ordering=-duration_seconds   → longest calls first
    - Sortable fields: start_time, end_time, duration_seconds, status, from_number, to_number, created_at

    Pagination:
    - ?page=2&page_size=50
    - Default page size: 20, max: 200

    Field-wise search:
    - ?search=<term>                     → searches call_id, from_number, to_number, status
    - ?call_id=<value>                   → exact match
    - ?from_number=<value>               → exact match
    - ?to_number=<value>                 → exact match
    - ?status=<value>                    → exact match
    - ?call_id__contains=<value>         → partial match
    - ?from_number__contains=<value>     → partial match
    - ?to_number__contains=<value>       → partial match
    - ?duration_seconds__gte=30          → duration >= 30s
    - ?duration_seconds__lte=120         → duration <= 120s
    """
    queryset = CallLog.objects.all()
    serializer_class = CallLogSerializer
    permission_classes = [AllowAny]
    pagination_class = CallLogPagination

    # Field-wise search/filter config
    # Maps query_param -> (orm_lookup, field_type)
    FIELD_FILTERS = {
        # Exact matches
        'call_id':          ('call_id__iexact',         'str'),
        'from_number':      ('from_number__iexact',     'str'),
        'to_number':        ('to_number__iexact',       'str'),
        'status':           ('status__iexact',          'str'),
        'voice':            ('voice__iexact',           'str'),
        'model':            ('model__iexact',           'str'),
        # Partial / contains
        'call_id__contains':       ('call_id__icontains',        'str'),
        'from_number__contains':   ('from_number__icontains',    'str'),
        'to_number__contains':     ('to_number__icontains',      'str'),
        'status__contains':        ('status__icontains',         'str'),
        # Numeric ranges
        'duration_seconds__gte':   ('duration_seconds__gte',     'float'),
        'duration_seconds__lte':   ('duration_seconds__lte',     'float'),
    }

    def get_queryset(self):
        queryset = CallLog.objects.all()
        params = self.request.query_params

        # ── 1. Existing coarse filters ────────────────────────────────────────
        app_id        = params.get('app_id')
        user_id       = params.get('user_id')
        agent_id      = params.get('agent_id')
        status_filter = params.get('status')
        from_date     = params.get('from_date')
        to_date       = params.get('to_date')
        phone_number  = params.get('phone_number')
        agent_task_id = params.get('agent_task_id')

        if agent_task_id:
            queryset = queryset.filter(agent_task_id=agent_task_id)
        if app_id:
            queryset = queryset.filter(app_id=app_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if agent_id:
            queryset = queryset.filter(agent_version_id=agent_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if phone_number:
            queryset = queryset.filter(
                Q(from_number=phone_number) | Q(to_number=phone_number)
            )
        if from_date:
            queryset = queryset.filter(start_time__gte=from_date)
        if to_date:
            queryset = queryset.filter(start_time__lte=to_date)

        # ── 2. Field-wise filters ─────────────────────────────────────────────
        for param, (orm_lookup, field_type) in self.FIELD_FILTERS.items():
            value = params.get(param)
            if value is not None:
                try:
                    if field_type == 'float':
                        value = float(value)
                    elif field_type == 'int':
                        value = int(value)
                    queryset = queryset.filter(**{orm_lookup: value})
                except (ValueError, TypeError):
                    pass  # Silently skip invalid values; or raise ValidationError

        # ── 3. Global search across key text fields ───────────────────────────
        search_term = params.get('search')
        if search_term:
            queryset = queryset.filter(
                Q(call_id__icontains=search_term)      |
                Q(from_number__icontains=search_term)  |
                Q(to_number__icontains=search_term)    |
                Q(status__icontains=search_term)       |
                Q(voice__icontains=search_term)        |
                Q(model__icontains=search_term)
            )

        # ── 4. Sorting ────────────────────────────────────────────────────────
        ordering = params.get('ordering', '-start_time')  # default: newest first
        if ordering in SORTABLE_FIELDS:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-start_time')   # fallback to safe default
        return queryset.select_related('agent_version', 'app', 'user', 'agent_task')

    # ── rest of methods unchanged ─────────────────────────────────────────────

    def get_serializer_class(self):
        if self.action == 'create':
            return CallLogCreateSerializer
        return CallLogSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        call_log = serializer.save()
        return Response(CallLogSerializer(call_log).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-phone')
    def by_phone(self, request):
        phone_number = request.query_params.get('phone_number')
        if not phone_number:
            return Response({"error": "phone_number parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        logs = self.get_queryset().filter(Q(from_number=phone_number) | Q(to_number=phone_number))
        page = self.paginate_queryset(logs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(logs, many=True).data)

    @action(detail=False, methods=['get'], url_path='by-call-id')
    def by_call_id(self, request):
        call_id = request.query_params.get('call_id')
        if not call_id:
            return Response({"error": "call_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            log = self.get_queryset().get(call_id=call_id)
            return Response(self.get_serializer(log).data)
        except CallLog.DoesNotExist:
            return Response({"error": "Call log not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        queryset = self.get_queryset().filter(start_time__gte=start_date)

        stats = queryset.aggregate(
            total_calls=Count('id'),
            completed_calls=Count('id', filter=Q(status='completed')),
            failed_calls=Count('id', filter=Q(status='failed')),
            total_duration=Sum('duration_seconds'),
            avg_duration=Avg('duration_seconds'),
        )

        total    = stats['total_calls'] or 0
        completed = stats['completed_calls'] or 0
        stats['success_rate'] = (completed / total * 100) if total > 0 else 0

        stats['total_duration_formatted'] = (
            f"{int(stats['total_duration'] // 3600)}h {int((stats['total_duration'] % 3600) // 60)}m"
            if stats['total_duration'] else "0h 0m"
        )
        stats['avg_duration_formatted'] = (
            f"{int(stats['avg_duration'] // 60)}m {int(stats['avg_duration'] % 60)}s"
            if stats['avg_duration'] else "0m 0s"
        )
        stats['status_breakdown'] = list(queryset.values('status').annotate(count=Count('id')).order_by('-count'))

        return Response(stats)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        call_log = self.get_object()
        call_log.end_time          = request.data.get('end_time', call_log.end_time)
        call_log.duration_seconds  = request.data.get('duration_seconds', call_log.duration_seconds)
        call_log.recording_s3_url  = request.data.get('recording_s3_url', call_log.recording_s3_url)
        call_log.transcript_s3_url = request.data.get('transcript_s3_url', call_log.transcript_s3_url)
        call_log.call_log_s3_url   = request.data.get('call_log_s3_url', call_log.call_log_s3_url)
        call_log.extracted_s3_url  = request.data.get('extracted_s3_url', call_log.extracted_s3_url)
        call_log.status = 'completed'
        call_log.save()
        return Response(self.get_serializer(call_log).data)

def file_analysis_prompt(agent_name = None):
    return f"""You are an expert AI prompt engineer specializing in designing voice AI agent scripts.

I will give you a document that contains all the details, steps, and instructions for a voice AI agent to follow during a call. Your job is to convert this into a complete, structured voice AI agent script.

The script must be written as direct instructions to the agent — not in first person ("I will..."), not as a narrative. Write it as if you are telling the agent exactly what to do and say, like a rule book the agent reads and follows.

Never state it is an AI / voice agent anywhere in the script. Generate it to speak exactly like a human.

Use this format and style:

---
**ROLE:**
Who the agent is, what their purpose is, how they should present themselves. Agent name is {agent_name}. Generate it like this : You are {agent_name}, [add your role (eg : Appointment coordinator, insurance verification representative etc..)]

*CALL FLOW:*
List every question or action from the document in order. Write each as a direct instruction or as the exact question the agent should ask. Include any conditional steps, follow-ups, codes, or notes exactly as the document describes.

**RULES**
List every rule, restriction, and behavioral instruction from the document as firm directives. Write them as strict rules the agent must never break.
- Speak like an Human. Never mention AI anywhere.
[continue call rules]

**CALL CLOSING**
- End the call naturally after obtaining all informations

Now generate the complete voice AI agent script using only the information from the document below.
Do not add anything not present in the document. Do not remove or summarize anything. Do not write in first person. Write every instruction as a direct directive to the agent.
"""


def _upload_django_files_to_gemini(files):
    """
    Accepts a list of Django UploadedFile objects.
    Returns a list of genai File refs (attachments) and cleans up temp files.
    """
    uploaded_refs = []
    temp_paths = []

    try:
        for f in files:
            # Try to use Django-provided content type; fall back to guess by filename; then octet-stream
            mime = getattr(f, "content_type", None) or mimetypes.guess_type(getattr(f, "name", ""))[0] or "application/octet-stream"

            # Keep original extension so mime/clients can infer if needed
            suffix = Path(getattr(f, "name", "")).suffix or ""

            # Some uploads may be TemporaryUploadedFile (already on disk)
            # Prefer the existing disk path if available
            tmp_path = None
            if hasattr(f, "temporary_file_path"):
                try:
                    tmp_path = f.temporary_file_path()
                except Exception:
                    tmp_path = None

            # Otherwise write chunks to a NamedTemporaryFile
            if not tmp_path:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    for chunk in f.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                    temp_paths.append(tmp_path)  # only our own files need cleanup

            # Upload with explicit MIME and a nice display_name
            uploaded = genai.upload_file(
                path=tmp_path,
                mime_type=mime,
                display_name=getattr(f, "name", Path(tmp_path).name),
            )
            uploaded_refs.append(uploaded)

        return uploaded_refs
    finally:
        # Clean up only temp files we created
        for p in temp_paths:
            try:
                os.unlink(p)
            except OSError:
                pass


def analyze_files_with_gemini(files, agent_name):
    """
    Analyzes uploaded files and returns a JSON object with agent configuration fields.
    """
    attachments = _upload_django_files_to_gemini(files) if files else []
    
    if not attachments:
        return {}

    final_prompt = file_analysis_prompt(agent_name)
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")

    # Generate content using the files and analysis prompt
    resp = model.generate_content(
        [
            final_prompt,
            *attachments
        ]
    )

    try:
        response_text = resp.text
    except AttributeError:
        response_text = resp.candidates[0].content.parts[0].text

    import json
    try:
        # Clean up possible markdown code blocks ```json ... ```
        # cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        # result_json = json.loads(cleaned_text)
        return response_text
    except json.JSONDecodeError:
        print(f"Failed to parse JSON from Gemini response: {response_text}")
        return {}


class GeminiFileAnalysis(APIView):
    def post(self, request):
        try:
            files = []
            if request.FILES:
                files = request.FILES.getlist("files")
            version_id = request.data.get("version_id")
            if version_id:
                try:
                    agent_version = AgentVersion.objects.get(id=version_id)
                except AgentVersion.DoesNotExist:
                    return Response(
                        {"error": "Invalid version_id"},
                        status=status.HTTP_404_NOT_FOUND
                    )

            agent_name = agent_version.agent_name if version_id else ""
            if not files:
                 return Response({
                    "status": "error",
                    "message": "No files provided"
                }, status=400)
            
            result_json = analyze_files_with_gemini(files, agent_name)
            
            if not result_json:
                 return Response({
                    "status": "error",
                    "message": "Failed to analyze files or empty response from Gemini"
                }, status=500)

            return Response({
                "status": "success",
                "data": result_json
            }, status=200)

        except Exception:
            return Response({
                "status": "error",
                "error": traceback.format_exc()
            }, status=500)


import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
class VoiceAICreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        amount = request.data.get("amount")
        if amount is None:
            return Response(
                {"error": "Amount is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                raise ValueError("Amount must be greater than zero")
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid amount. Provide a numeric amount greater than 0."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        stripe_theme = request.data.get("stripe_theme", {}) or {}
        theme_colors = stripe_theme.get("colors", {}) or {}
        business_name = (
            request.data.get("business_name")
            or stripe_theme.get("business_name")
            or "Droidal"
        )
 
        default_success_url = f"{settings.FRONTEND_URL}/admin/payment-overview?status=success"
        default_cancel_url = f"{settings.FRONTEND_URL}/admin/payment-overview?status=cancel"
        success_url = request.data.get("success_url") or default_success_url
        cancel_url = request.data.get("cancel_url") or default_cancel_url
 
        checkout_payload = {
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"{business_name} Voice AI Wallet Top-up",
                        },
                        "unit_amount": int(round(amount_float * 100)),
                    },
                    "quantity": 1,
                }
            ],
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "branding_settings": {
                "display_name": business_name,
                "background_color": theme_colors.get("background", "#201f1f"),
                "button_color": theme_colors.get("accent", "#0cb4ec"),
                "border_style": "rounded",
            },
        }
 
        customer_email = request.data.get("customer_email")
        if customer_email:
            checkout_payload["customer_email"] = customer_email
 
        customer_name = request.data.get("customer_name")
        source = request.data.get("source", "voice_ai")
        checkout_payload["payment_intent_data"] = {
            "metadata": {
                "source": source,
                "customer_name": customer_name or "",
                "customer_email": customer_email or "",
                "business_name": business_name,
            }
        }
 
        try:
            checkout_session = stripe.checkout.Session.create(**checkout_payload)
            return Response(
                {"checkout_url": checkout_session.url},
                status=status.HTTP_200_OK,
            )
        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        

class OutboundEnabledAgentsView(APIView):
    def get(self, request):
        # Step 1: Fetch all agents with outbound enabled and at least one number
        all_agents = AgentVersion.objects.filter(
            Telephony_Settings_id__outbound_enabled=True,
            Telephony_Settings_id__mobile_numbers__isnull=False,
        ).distinct()

        print(f"[DEBUG] Without status filter: {all_agents.count()}", flush=True)
        for a in all_agents:
            print(
                f"  → ID: {a.id} | status: {a.status} | timezone: {a.timezone} "
                f"| start: {a.start_time} | end: {a.end_time} | active_days: {a.active_days}",
                flush=True,
            )

        # Step 2: Only Active agents
        active_agents = all_agents.filter(status="Active")
        print(f"[DEBUG] With status=Active: {active_agents.count()}", flush=True)

        # Step 3: Serialize
        serializer = OutboundAgentSerializer(active_agents, many=True)

        # Step 4: Filter out agents with no API key (None) or outside availability window
        filtered = [
            agent for agent in serializer.data
            if agent is not None and agent.get("is_available_now")
        ]

        # Step 5: Debug log skipped agents
        for agent in serializer.data:
            if agent is None:
                print(f"[DEBUG] Skipped — no api_key", flush=True)
            elif not agent.get("is_available_now"):
                print(
                    f"[DEBUG] Skipped agent {agent.get('id')} — outside window "
                    f"| timezone={agent.get('timezone')} "
                    f"| start={agent.get('start_time')} "
                    f"| end={agent.get('end_time')} "
                    f"| active_days={agent.get('active_days')}",
                    flush=True,
                )

        print(f"[DEBUG] Final count: {len(filtered)}", flush=True)

        return Response(filtered, status=status.HTTP_200_OK)
    

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # ✅ must be a decorator, not inside the function
def get_recording_presigned_url(request):
    """
    GET /api/recordings/url/?key=voice-calls/2026/02/18/outbound-1771437864_20260218_180424/recording.wav
    """
    s3_key = request.query_params.get('key')

    if not s3_key:
        return Response(
            {'error': 'key query parameter is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': s3_key,
            },
            ExpiresIn=3600
        )
        return Response({'url': url}, status=status.HTTP_200_OK)

    except ClientError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_mobile_numbers(request):
    user = request.user
    client_id = user.client_id  # ✅ get from token

    if not client_id:
        return Response({'error': 'User is not linked to any client.'}, status=status.HTTP_400_BAD_REQUEST)

    numbers = MobileNumber.objects.filter(client_id=client_id).select_related('telephony_settings__client')

    if not numbers.exists():
        return Response({'message': 'No numbers purchased by this client.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = MobileNumberSerializer(numbers, many=True)
    return Response({
        'total': numbers.count(),
        'available': numbers.filter(telephony_settings__isnull=True).count(),
        'in_use': numbers.filter(telephony_settings__isnull=False).count(),
        'numbers': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_number_to_agent(request):
    """
    POST /api/mobile-numbers/assign/
    Body: { "mobile_number_id": 1, "telephony_settings_id": 3 }
    """
    mobile_number_id = request.data.get('mobile_number_id')
    telephony_settings_id = request.data.get('telephony_settings_id')

    try:
        number = MobileNumber.objects.get(id=mobile_number_id)
    except MobileNumber.DoesNotExist:
        return Response({'error': 'Mobile number not found.'}, status=status.HTTP_404_NOT_FOUND)

    # ✅ Block if already assigned
    if number.telephony_settings is not None:
        return Response({
            'error': f'This number is already in use by TelephonySettings ID: {number.telephony_settings.id} (Client: {number.telephony_settings.client}). Please release it first.'
        }, status=status.HTTP_409_CONFLICT)

    try:
        telephony = TelephonySettings.objects.get(id=telephony_settings_id)
    except TelephonySettings.DoesNotExist:
        return Response({'error': 'Telephony settings not found.'}, status=status.HTTP_404_NOT_FOUND)

    number.telephony_settings = telephony
    number.save()

    return Response({
        'message': f'Number {number.mobile_number} successfully assigned.',
        'number': MobileNumberSerializerclient(number).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_number(request):
    """
    POST /api/mobile-numbers/release/
    Body: { "mobile_number_id": 1 }
    """
    mobile_number_id = request.data.get('mobile_number_id')

    try:
        number = MobileNumber.objects.get(id=mobile_number_id)
    except MobileNumber.DoesNotExist:
        return Response({'error': 'Mobile number not found.'}, status=status.HTTP_404_NOT_FOUND)

    if number.telephony_settings is None:
        return Response({'message': 'This number is already available.'}, status=status.HTTP_200_OK)

    released_from = f"TelephonySettings ID: {number.telephony_settings.id}"
    number.telephony_settings = None
    number.save()

    return Response({
        'message': f'Number {number.mobile_number} released from {released_from} and is now available.'
    })


class AgentScriptViewSet(ModelViewSet):
    queryset = AgentScript.objects.all().order_by("-created_at")
    serializer_class = AgentScriptSerializer

    @action(detail=False, methods=['get'])
    def get_by_version(self, request):
        version_id = request.query_params.get('version_id')
        if not version_id:
            return Response({"error": "version_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        script = AgentScript.objects.filter(agent_id=version_id).first()
        if not script:
            return Response({"script": ""}, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(script)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class AgentAnalyticsView(APIView):
    def get(self, request, department_id):
        try:
            client = getattr(request.user, "client", None)
            if not client:
                return Response(
                    {"error": "User not linked to client"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from django.db.models import Avg, Count, Sum
            from django.db.models.functions import TruncDay
            from datetime import time

            period = (request.query_params.get("period") or "all").strip().lower()
            start_date_param = (
                request.query_params.get("start_date")
                or request.query_params.get("startDate")
            )
            end_date_param = (
                request.query_params.get("end_date")
                or request.query_params.get("endDate")
            )

            start_dt = None
            end_dt = None
            now = timezone.now()

            if period == "24h":
                start_dt = now - timedelta(hours=24)
                end_dt = now
            elif period == "1w":
                start_dt = now - timedelta(days=7)
                end_dt = now
            elif period == "1m":
                start_dt = now - timedelta(days=30)
                end_dt = now
            elif period == "all":
                pass
            elif period == "custom":
                if not start_date_param or not end_date_param:
                    return Response(
                        {"error": "start_date and end_date are required for custom period"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                parsed_start = parse_date(start_date_param)
                parsed_end = parse_date(end_date_param)

                if not parsed_start or not parsed_end:
                    return Response(
                        {"error": "Invalid start_date or end_date format. Use YYYY-MM-DD."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if parsed_start > parsed_end:
                    return Response(
                        {"error": "start_date cannot be after end_date"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                start_dt = datetime.combine(parsed_start, time.min)
                end_dt = datetime.combine(parsed_end, time.max)

                current_tz = timezone.get_current_timezone()
                start_dt = timezone.make_aware(start_dt, current_tz)
                end_dt = timezone.make_aware(end_dt, current_tz)
            else:
                return Response(
                    {"error": "Invalid period. Use one of: 24h, 1w, 1m, all, custom"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            call_logs = CallLog.objects.filter(
                app__module_id=department_id,
                user__client=client
            )
            agent_tasks = AgentTask.objects.filter(
                apikey__module_id=department_id,
                user__client=client
            )

            if start_dt and end_dt:
                call_logs = call_logs.filter(created_at__range=[start_dt, end_dt])
                agent_tasks = agent_tasks.filter(created_at__range=[start_dt, end_dt])

            # ── Deduplicate: multiple CallLog rows sharing the same agent_task
            # are treated as a single call. Pick the earliest row per
            # agent_task_id; keep all rows that have no agent_task individually.
            agent_task_rep_ids = (
                call_logs.filter(agent_task__isnull=False)
                .values("agent_task_id")
                .annotate(rep_id=Min("id"))
                .values_list("rep_id", flat=True)
            )
            no_task_ids = call_logs.filter(
                agent_task__isnull=True
            ).values_list("id", flat=True)

            deduped_call_logs = call_logs.filter(
                id__in=list(agent_task_rep_ids) + list(no_task_ids)
            )

            # 1. Total Calls — deduplicated by agent_task
            total_calls = deduped_call_logs.count()
            total_duration_seconds = float(deduped_call_logs.aggregate(total=Sum("duration_seconds"))["total"] or 0)
            total_duration_minutes = sum(
                ceil(float(duration_seconds) / 60)
                for duration_seconds in deduped_call_logs.values_list("duration_seconds", flat=True)
                if duration_seconds and float(duration_seconds) > 0
            )

            # 2. AgentTask Metrics filtered by department (module) + client
            records_created = agent_tasks.count()
            completed_tasks = deduped_call_logs.filter(status='completed').count()
            failed_tasks = deduped_call_logs.filter(status='failed').count()
            in_progress_tasks = deduped_call_logs.filter(status='in_progress').count()

            # 3. Call Status Distribution (deduplicated)
            status_distribution = [
                {"name": "Completed", "value": deduped_call_logs.filter(status='completed').count(), "color": "#00bbf2"},
                {"name": "Failed", "value": deduped_call_logs.filter(status='failed').count(), "color": "#ef4444"},
                {"name": "In Progress", "value": deduped_call_logs.filter(status='in_progress').count(), "color": "#a855f7"},
            ]

            # 4. Call Duration & Volume (grouped by day)
            duration_volume_data = []
            
            # Use Python-side aggregation to match totalDurationMinutes logic (ceil per call)
            logs_data = deduped_call_logs.annotate(day=TruncDay('created_at')).values('day', 'duration_seconds', 'id').order_by('day')
            
            daily_stats = {}
            for entry in logs_data:
                day_date = entry['day']
                if not day_date:
                    continue
                day_str = day_date.strftime("%b %d") # Key for grouping/display
                
                duration_sec = float(entry['duration_seconds'] or 0)
                duration_min = ceil(duration_sec / 60) if duration_sec > 0 else 0
                
                if day_str not in daily_stats:
                    daily_stats[day_str] = {
                        "name": day_str,
                        "duration": 0,
                        "calls": 0,
                        "sort_date": day_date 
                    }
                
                daily_stats[day_str]["duration"] += duration_min
                daily_stats[day_str]["calls"] += 1
            
            # Convert to list and sort by date
            sorted_stats = sorted(daily_stats.values(), key=lambda x: x['sort_date'])
            
            for stat in sorted_stats:
                duration_volume_data.append({
                    "name": stat["name"],
                    "duration": stat["duration"],
                    "calls": stat["calls"]
                })

            return Response({
                "metrics": {
                    "totalCalls": f"{total_calls:,}",
                    "totalDurationMinutes": total_duration_minutes,
                    "totalDurationSeconds": round(total_duration_seconds, 2),
                    "recordsCreated": f"{records_created:,}",
                    "completedCalls": f"{completed_tasks:,}",
                    "failedCalls": f"{failed_tasks:,}",
                    "inProgress": f"{in_progress_tasks:,}"
                },
                "statusData": status_distribution,
                "durationData": duration_volume_data,
                "call_logs": CallLogSerializer(deduped_call_logs, many=True).data,
                "agent_tasks": AgentTaskSerializer(agent_tasks, many=True).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentTotalDurationView(APIView):
    def get(self, request, department_id):
        try:
            client = getattr(request.user, "client", None)
            if not client:
                return Response(
                    {"error": "User not linked to client"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from django.db.models import Sum
            from datetime import time


            start_date_param = (
                request.query_params.get("start_date")
                or request.query_params.get("startDate")
            )
            end_date_param = (
                request.query_params.get("end_date")
                or request.query_params.get("endDate")
            )

            if not start_date_param or not end_date_param:
                return Response(
                    {"error": "start_date and end_date are required. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            parsed_start = parse_date(start_date_param)
            parsed_end = parse_date(end_date_param)

            if not parsed_start or not parsed_end:
                return Response(
                    {"error": "Invalid start_date or end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if parsed_start > parsed_end:
                return Response(
                    {"error": "start_date cannot be after end_date"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            start_dt = datetime.combine(parsed_start, time.min)
            end_dt = datetime.combine(parsed_end, time.max)
            current_tz = timezone.get_current_timezone()
            start_dt = timezone.make_aware(start_dt, current_tz)
            end_dt = timezone.make_aware(end_dt, current_tz)

            call_logs = CallLog.objects.filter(
                app__module_id=department_id,
                user__client=client,
                created_at__range=[start_dt, end_dt],
            )

            total_calls = call_logs.count()
            total_duration_seconds = float(
                call_logs.aggregate(total=Sum("duration_seconds"))["total"] or 0
            )
            total_duration_minutes = sum(
                ceil(float(duration_seconds) / 60)
                for duration_seconds in call_logs.values_list("duration_seconds", flat=True)
                if duration_seconds and float(duration_seconds) > 0
            )

            return Response(
                {
                    "departmentId": department_id,
                    "startDate": parsed_start.isoformat(),
                    "endDate": parsed_end.isoformat(),
                    "totalCalls": total_calls,
                    "totalDurationMinutes": total_duration_minutes,
                    "totalDurationSeconds": round(total_duration_seconds, 2),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoricalMonthlySpendView(APIView):
    def get(self, request, department_id):
        try:
            client = getattr(request.user, "client", None)
            if not client:
                return Response(
                    {"error": "User not linked to client"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from django.db.models import Sum
            from math import ceil
            import calendar
            from datetime import timedelta

            now = timezone.now()
            results = []

            # Loop for last 6 months (including current month)
            # Example: If now is Oct, loop May, June, July, Aug, Sep, Oct
            for i in range(5, -1, -1):
                # Calculate start and end of the month
                target_date = now.replace(day=1) - timedelta(days=i*30) # Approx
                # Correct calculation to get specific month
                # Use year and month logic
                month = now.month - i
                year = now.year
                if month <= 0:
                    month += 12
                    year -= 1
                
                start_dt = datetime(year, month, 1)
                last_day = calendar.monthrange(year, month)[1]
                end_dt = datetime(year, month, last_day, 23, 59, 59)
                
                current_tz = timezone.get_current_timezone()
                start_dt = timezone.make_aware(start_dt, current_tz)
                end_dt = timezone.make_aware(end_dt, current_tz)

                # Query CallLogs
                call_logs = CallLog.objects.filter(
                    app__module_id=department_id,
                    user__client=client,
                    created_at__range=[start_dt, end_dt]
                )

                # Calculate duration in minutes (ceil per call)
                total_duration_minutes = sum(
                    ceil(float(duration_seconds) / 60)
                    for duration_seconds in call_logs.values_list("duration_seconds", flat=True)
                    if duration_seconds and float(duration_seconds) > 0
                )

                amount = total_duration_minutes * 0.09
                
                results.append({
                    "month": start_dt.strftime("%b").upper(), # "JAN", "FEB"
                    "amount": round(amount, 2)
                })

            return Response(results, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentTaskDataUpdateView(APIView):
    def patch(self, request, pk):
        try:
            task = AgentTask.objects.get(pk=pk)
        except AgentTask.DoesNotExist:
            return Response({"error": "AgentTask not found."}, status=status.HTTP_404_NOT_FOUND)

        # ── Support both single and bulk update ───────────────────────────────
        # Single:  {"key": "call_status", "value": "connected"}
        # Bulk:    {"updates": {"call_status": "connected", "room": "outbound-123"}}
        updates = request.data.get("updates")  # bulk

        if updates:
            if not isinstance(updates, dict):
                return Response({"error": "updates must be a dict."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Fall back to single key/value
            key   = request.data.get("key")
            value = request.data.get("value")
            if not key:
                return Response({"error": "key or updates is required."}, status=status.HTTP_400_BAD_REQUEST)
            updates = {key: value}

        task.data.update(updates)
        task.save(update_fields=["data"])

        return Response({"message": "Data updated successfully.", "data": task.data})

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db.models.functions import TruncDay
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import datetime
from math import ceil

class DailyVoiceAIUsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if request.user.roles != "admin":
                 return Response(
                    {"error": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )

            from .models import CallLog
            from datetime import time as dt_time
            
            # 1. Extract query parameters
            start_date_param = (
                request.query_params.get("start_date")
                or request.query_params.get("startDate")
            )
            end_date_param = (
                request.query_params.get("end_date")
                or request.query_params.get("endDate")
            )
            client_id_param = request.query_params.get("client_id") # <-- Added client_id parameter

            start_dt = None
            end_dt = None

            # 2. Parse dates
            if start_date_param and end_date_param:
                parsed_start = parse_date(start_date_param)
                parsed_end = parse_date(end_date_param)

                if parsed_start and parsed_end:
                    if parsed_start > parsed_end:
                        return Response(
                            {"error": "start_date cannot be after end_date"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    start_dt = datetime.combine(parsed_start, dt_time.min)
                    end_dt = datetime.combine(parsed_end, dt_time.max)
                    current_tz = timezone.get_current_timezone()
                    start_dt = timezone.make_aware(start_dt, current_tz)
                    end_dt = timezone.make_aware(end_dt, current_tz)
            
            # 3. Base filter: Ensure logs belong to SOME client
            call_logs = CallLog.objects.filter(
                Q(app__client__isnull=False) | Q(user__client__isnull=False)
            )

            # 4. Apply Date Filter
            if start_dt and end_dt:
                call_logs = call_logs.filter(created_at__range=[start_dt, end_dt])

            # 5. Apply Client Filter if a specific client is provided (and not "all")
            if client_id_param and str(client_id_param).lower() != "all":
                call_logs = call_logs.filter(
                    user__client_id=client_id_param
                )

            # 6. Group by day and fetch required fields
            logs_data = call_logs.annotate(day=TruncDay('created_at')).values('day', 'duration_seconds', 'id')

            # 7. Aggregate in Python
            daily_stats = {}
            
            for entry in logs_data:
                day_str = entry['day'].date().isoformat() if entry['day'] else "Unknown"
                duration_sec = entry['duration_seconds'] or 0
                
                # Calculate minutes with ceiling logic per call
                duration_min = ceil(float(duration_sec) / 60) if duration_sec > 0 else 0

                if day_str not in daily_stats:
                    daily_stats[day_str] = {
                        "date": day_str,
                        "total_usage_min": 0,
                        "total_calls": 0
                    }
                
                daily_stats[day_str]["total_usage_min"] += duration_min
                daily_stats[day_str]["total_calls"] += 1

            # Convert to list and sort by date
            response_data = sorted(daily_stats.values(), key=lambda x: x['date'])

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClientVoiceAIUsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if request.user.roles != "admin":
                 return Response(
                    {"error": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )

            from accounts.models import Client
            from .models import MobileNumber, CallLog
            from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
            from datetime import time as dt_time

            start_date_param = (
                request.query_params.get("start_date")
                or request.query_params.get("startDate")
            )
            end_date_param = (
                request.query_params.get("end_date")
                or request.query_params.get("endDate")
            )
            
            # Sorting parameters
            ordering = request.query_params.get("ordering", "client_name") # default sort by client_name
            
            # Pagination parameters
            page_number = request.query_params.get("page", 1)
            page_size = request.query_params.get("page_size", 10)

            start_dt = None
            end_dt = None

            if start_date_param and end_date_param:
                parsed_start = parse_date(start_date_param)
                parsed_end = parse_date(end_date_param)

                if parsed_start and parsed_end:
                    if parsed_start > parsed_end:
                        return Response(
                            {"error": "start_date cannot be after end_date"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    start_dt = datetime.combine(parsed_start, dt_time.min)
                    end_dt = datetime.combine(parsed_end, dt_time.max)
                    current_tz = timezone.get_current_timezone()
                    start_dt = timezone.make_aware(start_dt, current_tz)
                    end_dt = timezone.make_aware(end_dt, current_tz)
            
            # Fetch all clients
            clients = Client.objects.all()
            response_data = []

            for client in clients:
                # Get phone numbers associated with the client
                phone_numbers = list(MobileNumber.objects.filter(client=client).values_list('mobile_number', flat=True))

                # Calculate total usage (min)
                # Filter CallLogs for this client within the date range
                call_logs = CallLog.objects.filter(
                    Q(app__client=client) | Q(user__client=client)
                )

                if start_dt and end_dt:
                    call_logs = call_logs.filter(created_at__range=[start_dt, end_dt])

                # Calculate total duration in minutes using the logic from AgentTotalDurationView
                # Sum of ceil(duration_seconds / 60) for each call
                total_usage_min = sum(
                    ceil(float(duration_seconds) / 60)
                    for duration_seconds in call_logs.values_list("duration_seconds", flat=True)
                    if duration_seconds and float(duration_seconds) > 0
                )

                client_data = {
                    "client_id": client.client_id,
                    "client_name": client.client_name,
                    "total_usage_min": total_usage_min,
                    "phone_numbers": phone_numbers
                }
                response_data.append(client_data)

            # Apply Sorting
            reverse = False
            if ordering.startswith("-"):
                reverse = True
                ordering = ordering[1:]
            
            # Sort the list of dictionaries
            # Default to client_name if key not found or error
            try:
                response_data.sort(key=lambda x: x.get(ordering, ""), reverse=reverse)
            except Exception:
                # Fallback if sorting fails (e.g. invalid key)
                response_data.sort(key=lambda x: x.get("client_name", ""), reverse=reverse)

            # Apply Pagination
            paginator = Paginator(response_data, page_size)
            try:
                paginated_data = paginator.page(page_number)
            except PageNotAnInteger:
                paginated_data = paginator.page(1)
            except EmptyPage:
                paginated_data = paginator.page(paginator.num_pages)
            
            return Response({
                "count": paginator.count,
                "num_pages": paginator.num_pages,
                "current_page": paginated_data.number,
                "results": paginated_data.object_list
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VoiceAIKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import datetime, time as dt_time
        try:
            if request.user.roles != "admin":
                 return Response(
                    {"error": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )

            from .models import CallLog
            
            # 1. Extract query parameters
            start_date_param = request.query_params.get("start_date") or request.query_params.get("startDate")
            end_date_param = request.query_params.get("end_date") or request.query_params.get("endDate")
            client_id_param = request.query_params.get("client_id")

            start_dt = None
            end_dt = None

            # 2. Parse dates
            if start_date_param and end_date_param:
                parsed_start = parse_date(start_date_param)
                parsed_end = parse_date(end_date_param)

                if parsed_start and parsed_end:
                    if parsed_start > parsed_end:
                        return Response(
                            {"error": "start_date cannot be after end_date"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    start_dt = datetime.combine(parsed_start, dt_time.min)
                    end_dt = datetime.combine(parsed_end, dt_time.max)
                    current_tz = timezone.get_current_timezone()
                    start_dt = timezone.make_aware(start_dt, current_tz)
                    end_dt = timezone.make_aware(end_dt, current_tz)
            
            # 3. Base filter: Ensure logs belong to SOME client
            call_logs = CallLog.objects.filter(
                Q(app__client__isnull=False) | Q(user__client__isnull=False)
            )

            # 4. Apply Date Filter
            if start_dt and end_dt:
                call_logs = call_logs.filter(created_at__range=[start_dt, end_dt])

            # 5. Apply Client Filter
            if client_id_param and str(client_id_param).lower() != "all":
                call_logs = call_logs.filter(user__client_id=client_id_param)

            # 6. Aggregate Totals
            total_calls = call_logs.count()
            
            # Fetch only the duration_seconds column to keep the DB query lightweight
            durations = call_logs.values_list('duration_seconds', flat=True)
            
            total_usage_min = 0
            for sec in durations:
                if sec and sec > 0:
                    total_usage_min += ceil(float(sec) / 60)

            # Calculate Billable Amount (0.09 per minute)
            total_billable_amount = round(total_usage_min * 0.09, 2)

            return Response({
                "total_calls": total_calls,
                "total_usage_min": total_usage_min,
                "total_billable_amount": total_billable_amount
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)