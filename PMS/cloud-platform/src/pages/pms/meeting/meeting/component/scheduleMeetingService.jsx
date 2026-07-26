// src/pages/pms/meeting/meeting/component/ScheduleMeetingService.jsx

import axios from "axios";
import config from "../../../../../services/config.js";

const BASE_URL = config.config.BASE_URL.trim().replace(/\/+$/, "");

// Auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const scheduleMeetingService = {
  getScheduledMeetings: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/app/telehealth/scheduled/list/`, {
        headers: getAuthHeaders(),
      });

      // API returns { count: 13, meetings: [...] }
      const data = response.data;
      return Array.isArray(data.meetings) ? data.meetings : data.results || data || [];
    } catch (error) {
      console.error("Failed to fetch meetings:", error.response?.data || error.message);
      return []; // Graceful fallback
    }
  },

  startMeeting: async (meetingId) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/app/telehealth/scheduled/${meetingId}/start/`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to start meeting ${meetingId}:`, error);
      throw error;
    }
  },

  // endMeeting and cancelMeeting - update paths if needed
  endMeeting: async (meetingId) => {
    try {
      return await axios.post(
        `${BASE_URL}/app/telehealth/scheduled/${meetingId}/end/`,
        {},
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      console.error(`Failed to end meeting:`, error);
      throw error;
    }
  },

  cancelMeeting: async (meetingId) => {
    try {
      return await axios.post(
        `${BASE_URL}/app/telehealth/scheduled/${meetingId}/cancel/`,
        {},
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      console.error(`Failed to cancel meeting:`, error);
      throw error;
    }
  },
};

export default scheduleMeetingService;