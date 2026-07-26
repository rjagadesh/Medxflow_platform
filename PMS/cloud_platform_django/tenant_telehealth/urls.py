from django.urls import path
from .views import *

urlpatterns = [
    # Meeting endpoints
    path('create/', CreateMeetingView.as_view(), name='create-meeting'),
    path('join/', JoinMeetingView.as_view(), name='join-meeting'),
    path('rejoin/', RejoinMeetingView.as_view(), name='rejoin-meeting'),  # NEW
    path('call/hold/', PutCallOnHoldView.as_view(), name='put-call-on-hold'),
    path('call/status/<str:meeting_id>/', GetCallStatusView.as_view(), name='get-call-status'),
    path('status/<str:meeting_id>/', CheckMeetingStatusView.as_view(), name='check-meeting-status'),  # NEW
    path('end/<str:meeting_id>/', EndMeetingView.as_view(), name='end-meeting'),
    path('list/', ListMeetingsView.as_view(), name='list-meetings'),
    path('detail/<str:meeting_id>/', MeetingDetailView.as_view(), name='meeting-detail'),
    
    # Guest (patient) access endpoints
    path('guest/generate/', GenerateGuestAccessView.as_view(), name='generate-guest-access'),
    path('guest/validate/', ValidateGuestTokenView.as_view(), name='validate-guest-token'),
    path('guest/join/', GuestJoinMeetingView.as_view(), name='guest-join-meeting'),

    # Chat endpoints
    path('chat/send/', SendMessageView.as_view(), name='send-message'),
    path('chat/<str:meeting_id>/messages/', GetMessagesView.as_view(), name='get-messages'),
    path('chat/message/<int:message_id>/delete/', DeleteMessageView.as_view(), name='delete-message'),
# Audio Call endpoints
    path('audio/start/', StartAudioCallView.as_view(), name='start-audio-call'),
    path('audio/join/', JoinAudioCallView.as_view(), name='join-audio-call'),
    path('audio/mute/', MuteUnmuteAudioView.as_view(), name='mute-unmute-audio'),
    path('audio/end/', EndAudioCallView.as_view(), name='end-audio-call'),
    path('audio/<str:meeting_id>/status/', GetAudioCallStatusView.as_view(), name='audio-call-status'),
    path('audio/<str:meeting_id>/history/', GetAudioCallHistoryView.as_view(), name='audio-call-history'),

# Screen Share endpoints
    path('screenshare/start/', StartScreenShareView.as_view(), name='start-screen-share'),
    path('screenshare/stop/', StopScreenShareView.as_view(), name='stop-screen-share'),
    path('screenshare/<str:meeting_id>/status/', GetScreenShareStatusView.as_view(), name='screen-share-status'),
    path('screenshare/<str:meeting_id>/history/', GetScreenShareHistoryView.as_view(), name='screen-share-history'),
    
    # Recording endpoints
    path('recording/start/', StartRecordingView.as_view(), name='start-recording'),
    path('recording/stop/', StopRecordingView.as_view(), name='stop-recording'),
    path('recording/pause/', PauseRecordingView.as_view(), name='pause-recording'),
    path('recording/resume/', ResumeRecordingView.as_view(), name='resume-recording'),
    path('recording/<str:recording_id>/status/', GetRecordingStatusView.as_view(), name='recording-status'),
    path('recording/<str:meeting_id>/list/', ListMeetingRecordingsView.as_view(), name='list-recordings'),
    path('recording/<str:recording_id>/download/', DownloadRecordingView.as_view(), name='download-recording'),
    path('recording/<str:recording_id>/delete/', DeleteRecordingView.as_view(), name='delete-recording'),

    # Scheduling endpoints
    path('schedule/', ScheduleMeetingView.as_view(), name='schedule-meeting'),
    path('scheduled/list/', ListScheduledMeetingsView.as_view(), name='list-scheduled-meetings'),
    path('scheduled/<int:meeting_id>/', ScheduledMeetingDetailView.as_view(), name='scheduled-meeting-detail'),
    path('scheduled/<int:meeting_id>/update/', UpdateScheduledMeetingView.as_view(), name='update-scheduled-meeting'),
    path('scheduled/<int:meeting_id>/cancel/', CancelScheduledMeetingView.as_view(), name='cancel-scheduled-meeting'),
    path('scheduled/<int:meeting_id>/start/', StartScheduledMeetingView.as_view(), name='start-scheduled-meeting'),
    path('scheduled/<int:meeting_id>/end/', EndScheduledMeetingView.as_view(), name='end-scheduled-meeting'),
    path('scheduled/<int:meeting_id>/info/', GetMeetingJoinInfoView.as_view(), name='meeting-join-info'),
]