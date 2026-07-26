from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<meeting_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/audio/(?P<meeting_id>[^/]+)/$', consumers.AudioCallConsumer.as_asgi()),
]