import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAppointments = (dateRange) => {
  const { fromDate, toDate } = dateRange || {};

  return useQuery({
    queryKey: ["pms-appointments", fromDate, toDate],
    queryFn: async () => {
      try {
        const params = {};
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        const response = await apiRequest(apiRoutes.appointments.get, {
          params,
        });
        // FIXED: Use optional chaining to prevent TypeError if response.data is undefined/null
        // Note: Appointments API uses "appointments" key, unlike patients/providers which use "results"
        return response?.appointments || [];
      } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
    },
    retry: false,
    placeholderData: [],
    refetchOnWindowFocus: false,
  });
};

export const useGetAppointmentById = (appointmentId) => {
  return useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;

      const route = apiRoutes.appointments.getById;
      const config = {
        ...route,
        url: route.url(appointmentId),
      };

      const response = await apiRequest(config);
      return response; // adjust based on what your apiRequest returns (data? response.data?)
    },
    enabled: !!appointmentId,
    placeholderData: null,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 mins
  });
};


export const useGetCheckInAppointments = (queryParams) => {
  return useQuery({
    queryKey: ["pms-checkin-appointments", queryParams],
    queryFn: async () => {
      try {
        // Remove null/undefined values from queryParams to ensure defaults work
        const cleanedParams = Object.fromEntries(
          Object.entries(queryParams).filter(([_, v]) => v != null)
        );

        const params = {
          encounter: "True",
          status: "check_in",
          ...cleanedParams,
        };
        const response = await apiRequest(apiRoutes.appointments.getCheckIn, {
          params,
        });
        return response || { appointments: [], count: 0 };
      } catch (error) {
        console.error("Error fetching check-in appointments:", error);
        return { appointments: [], count: 0 };
      }
    },
    retry: false,
    placeholderData: { appointments: [], count: 0 },
    refetchOnWindowFocus: false,
  });
};
