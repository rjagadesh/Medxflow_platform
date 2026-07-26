// src/pages/pms/meeting/meeting/services/chimeService.js

import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from "amazon-chime-sdk-js";

class ChimeMeetingService {
  constructor() {
    this.meetingSession = null;
    this.audioVideo = null;
    this.logger = new ConsoleLogger("ChimeLogs", LogLevel.INFO);
    this.deviceController = new DefaultDeviceController(this.logger);
    this.localVideoElement = null;

    // Tracks currently active video deviceId
    this.activeVideoDeviceId = null;

    // Map for remote video tiles: tileId → <video> element
    this.remoteVideoElements = new Map();
  }

  // ------------------- REMOTE VIDEO ELEMENT MANAGEMENT -------------------

  registerRemoteVideoElement(tileId, element) {
    if (!tileId || !element) return;
    this.remoteVideoElements.set(tileId, element);
    if (this.audioVideo) {
      this.audioVideo.bindVideoElement(tileId, element);
    }
  }

  unregisterRemoteVideoElement(tileId) {
    this.remoteVideoElements.delete(tileId);
  }

  rebindAllRemoteTiles() {
    if (!this.audioVideo) return;
    this.remoteVideoElements.forEach((el, tileId) => {
      if (el) {
        this.audioVideo.bindVideoElement(tileId, el);
        el.play().catch(() => {});
      }
    });
  }

  // ------------------- AUDIO / VIDEO HELPERS -------------------

  isAudioMuted() {
    return this.audioVideo ? this.audioVideo.realtimeIsLocalAudioMuted() : true;
  }

  isVideoEnabled() {
    return this.audioVideo ? this.audioVideo.hasStartedLocalVideoTile() : false;
  }

  async muteAudio() {
    this.audioVideo?.realtimeMuteLocalAudio();
  }

  async unmuteAudio() {
    this.audioVideo?.realtimeUnmuteLocalAudio();
  }

  async stopVideoInput() {
    if (!this.audioVideo) return;
    this.audioVideo.stopLocalVideoTile();
    await this.audioVideo.stopVideoInput();
    this.activeVideoDeviceId = null;
  }

  getCurrentVideoInputDevice() {
    return this.activeVideoDeviceId || null;
  }

  async startVideo(deviceId) {
    if (!this.audioVideo) return;

    // Already started? just return
    if (this.audioVideo.hasStartedLocalVideoTile()) return;

    let id = deviceId || this.activeVideoDeviceId;

    // Pick first available camera if no deviceId provided
    if (!id) {
      const devices = await this.audioVideo.listVideoInputDevices();
      if (devices.length === 0) return;
      id = devices[0].deviceId;
    }

    await this.audioVideo.startVideoInput(id);
    this.activeVideoDeviceId = id;
    this.audioVideo.startLocalVideoTile();
  }

  async sendDataMessage(data) {
    if (!this.audioVideo) return;
    this.audioVideo.realtimeSendDataMessage(
      "hold-state-topic",
      JSON.stringify(data),
      1000
    );
  }

  // ------------------- MEETING INITIALIZATION -------------------

  async initializeMeetingSession(meetingData, attendeeData) {
    const configuration = new MeetingSessionConfiguration(
      {
        Meeting: {
          MeetingId: meetingData.meeting_id,
          ExternalMeetingId: meetingData.external_meeting_id,
          MediaRegion: meetingData.media_region,
          MediaPlacement: meetingData.media_placement,
        },
      },
      {
        Attendee: {
          AttendeeId: attendeeData.attendee_id,
          ExternalUserId: attendeeData.external_user_id,
          JoinToken: attendeeData.join_token,
        },
      }
    );

    this.meetingSession = new DefaultMeetingSession(
      configuration,
      this.logger,
      this.deviceController
    );

    this.audioVideo = this.meetingSession.audioVideo;
  }

  bindAudioElement(audioElement) {
    this.audioVideo?.bindAudioElement(audioElement);
  }

  // ------------------- START MEETING -------------------

  async startMeeting(localVideoEl) {
    if (!this.audioVideo) throw new Error("Meeting not initialized");

    this.localVideoElement = localVideoEl;

    const av = this.audioVideo;

    // Start audio/video devices
    const audioInputs = await av.listAudioInputDevices();
    const videoInputs = await av.listVideoInputDevices();
    const audioOutputs = await av.listAudioOutputDevices();

    if (audioInputs[0]) await av.startAudioInput(audioInputs[0].deviceId);
    if (audioOutputs[0]) await av.chooseAudioOutput(audioOutputs[0].deviceId);
    if (videoInputs[0]) await av.startVideoInput(videoInputs[0].deviceId);

    av.start();

    // Observer for video tiles
    av.addObserver({
      videoTileDidUpdate: (tileState) => {
        if (!tileState.boundAttendeeId) return;

        if (tileState.localTile && this.localVideoElement) {
          av.bindVideoElement(tileState.tileId, this.localVideoElement);
          return;
        }

        const remoteEl = this.remoteVideoElements.get(tileState.tileId);
        if (remoteEl) av.bindVideoElement(tileState.tileId, remoteEl);
      },

      videoTileWasRemoved: (tileId) => {
        const el = this.remoteVideoElements.get(tileId);
        if (el) el.srcObject = null;
        this.unregisterRemoteVideoElement(tileId);
      },
    });

    // Start local video if available
    if (videoInputs.length > 0) {
      av.startLocalVideoTile();
      this.activeVideoDeviceId = videoInputs[0].deviceId;
    }

    // Subscribe to hold state messages
    av.realtimeSubscribeToReceiveDataMessage("hold-state-topic", (dataMessage) => {
      try {
        const payload = JSON.parse(dataMessage.text());

        if (payload.isOnHold === false) {
          this.rebindAllRemoteTiles();
        }
      } catch (err) {
        console.error("Failed to parse data message:", err);
      }
    });
  }

  // ------------------- HOLD / RESUME -------------------

  async resumeLocalVideo() {
    await this.startVideo();
  }

  async toggleMute() {
    if (!this.audioVideo) return false;

    if (this.audioVideo.realtimeIsLocalAudioMuted()) {
      this.audioVideo.realtimeUnmuteLocalAudio();
      return false;
    } else {
      this.audioVideo.realtimeMuteLocalAudio();
      return true;
    }
  }

  async toggleVideo() {
    if (!this.audioVideo) return false;

    if (this.audioVideo.hasStartedLocalVideoTile()) {
      this.audioVideo.stopLocalVideoTile();
      return false;
    } else {
      await this.startVideo();
      return true;
    }
  }

  addObservers(observer) {
    if (!this.audioVideo) return;
    this.audioVideo.addObserver(observer);
  }

  // ------------------- CLEANUP -------------------

  async leaveMeeting() {
    if (!this.audioVideo) return;

    try {
      // Stop all media before stopping the session
      this.audioVideo.stopLocalVideoTile();
      await this.audioVideo.stopVideoInput();
      await this.audioVideo.stopAudioInput();
      
      // Stop the audio/video session
      this.audioVideo.stop();
    } catch (error) {
      console.error("Error during meeting cleanup:", error);
    }

    this.meetingSession = null;
    this.audioVideo = null;
    this.remoteVideoElements.clear();
    this.activeVideoDeviceId = null;
  }

  async stopMedia() {
    if (!this.audioVideo) return;

    try {
      // Stop local video tile
      this.audioVideo.stopLocalVideoTile();
      
      // Stop video input
      await this.audioVideo.stopVideoInput();
      
      // CRITICAL: Stop audio input to release microphone
      await this.audioVideo.stopAudioInput();
      
      // Stop the audio/video session
      this.audioVideo.stop();

      // Get all active media tracks and stop them
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      }).catch(() => null);
      
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    } catch (error) {
      console.error("Error stopping media:", error);
    }

    this.meetingSession = null;
    this.audioVideo = null;
    this.remoteVideoElements.clear();
    this.activeVideoDeviceId = null;
  }

  bindVideoElement(tileId, videoElement) {
    if (!this.audioVideo || !videoElement) return;
    this.audioVideo.bindVideoElement(tileId, videoElement);
  }

  // ------------------- SCREEN SHARE -------------------

  async startScreenShare() {
    return this.audioVideo.startContentShareFromScreenCapture();
  }

  async stopScreenShare() {
    this.audioVideo.stopContentShare();
  }
}

export default new ChimeMeetingService();