// src/pages/pms/meeting/meeting/services/apiService.js

import axios from 'axios';
import config from "../../../../../services/config.js"; // Adjust path if needed, e.g., '../../../config.js'

// Use dynamic BASE_URL from your config.js (supports local/dev/beta/prod)
const BASE_URL = config.config.BASE_URL;

// Two different base paths:
// - Video calls use: /app/meetings/
// - Audio calls use: /meetings/audio/
const VIDEO_BASE_URL = `${BASE_URL}/app/meetings`;
const AUDIO_BASE_URL = `${BASE_URL}/app/meetings/audio`;

class ApiService {
  // ==================== VIDEO CALL APIs (Keep existing ones unchanged) ====================

  async createMeeting(attendeeName) {
    try {
      const response = await axios.post(`${VIDEO_BASE_URL}/create/`, {
        attendee_name: attendeeName,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create meeting');
    }
  }

  async joinMeeting(meetingId, attendeeName) {
    try {
      const response = await axios.post(`${VIDEO_BASE_URL}/join/`, {
        meeting_id: meetingId,
        attendee_name: attendeeName,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to join meeting');
    }
  }

  async endMeeting(meetingId) {
    try {
      const response = await axios.post(`${VIDEO_BASE_URL}/end/${meetingId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to end meeting');
    }
  }

  async listMeetings() {
    try {
      const response = await axios.get(`${VIDEO_BASE_URL}/list/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch meetings');
    }
  }

  // ==================== AUDIO CALL APIs (New ones for your AudioCallComponent) ====================

  async start(attendeeName) {
    try {
      const response = await axios.post(`${AUDIO_BASE_URL}/start/`, {
        attendee_name: attendeeName,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to start audio call');
    }
  }

  async join(meetingId, attendeeName) {
    try {
      const response = await axios.post(`${AUDIO_BASE_URL}/join/`, {
        meeting_id: meetingId,
        attendee_name: attendeeName,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to join audio call');
    }
  }

  async mute(meetingId, attendeeId, isMuted) {
    try {
      const response = await axios.post(`${AUDIO_BASE_URL}/mute/`, {
        meeting_id: meetingId,
        attendee_id: attendeeId,
        is_muted: isMuted,
      });
      return response.data;
    } catch (error) {
      console.error('Mute failed:', error);
      // Don't throw — mute state is local-first
    }
  }

  async end(meetingId, attendeeId, endForAll = false) {
    try {
      const response = await axios.post(`${AUDIO_BASE_URL}/end/`, {
        meeting_id: meetingId,
        attendee_id: attendeeId,
        end_for_all: endForAll,
      });
      return response.data;
    } catch (error) {
      console.error('End call failed:', error);
      throw error;
    }
  }

  async getStatus(meetingId) {
    try {
      const response = await axios.get(`${AUDIO_BASE_URL}/${meetingId}/status/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch status:', error);
      throw error;
    }
  }

  async getHistory(meetingId) {
    try {
      const response = await axios.get(`${AUDIO_BASE_URL}/${meetingId}/history/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch history:', error);
      throw error;
    }
  }

  async startTranscription(meetingId) {
    try {
      const response = await axios.post(`${BASE_URL}/app/meetings/transcript/start/`, {
        meeting_id: meetingId,
        language: "en-US",
        enable_medical: true,
        enable_speaker_identification: true,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to start transcription');
    }
  }

  async stopTranscription(meetingId) {
    try {
      const response = await axios.post(`${BASE_URL}/app/meetings/transcript/stop/`, {
        meeting_id: meetingId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to stop transcription');
    }
  }

  async getLiveCaptions(meetingId) {
    try {
      const response = await axios.get(`${BASE_URL}/app/meetings/transcript/live-captions/${meetingId}/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch live captions');
    }
  }

  async getTranscript(meetingId) {
    try {
      const response = await axios.get(`${BASE_URL}/app/meetings/transcript/${meetingId}/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch transcript');
    }
  }

  async searchTranscript(transcriptId, query) {
    try {
      const response = await axios.get(
        `${BASE_URL}/app/meetings/transcript/${transcriptId}/search/?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      throw new Error('Search failed');
    }
  }

  async exportTranscript(transcriptId, format) {
    try {
      const response = await axios.post(`${BASE_URL}/app/meetings/transcript/export/`, {
        transcript_id: transcriptId,
        format: format,
      });
      return response.data;
    } catch (error) {
      throw new Error('Export failed');
    }
  }
}

export default new ApiService();