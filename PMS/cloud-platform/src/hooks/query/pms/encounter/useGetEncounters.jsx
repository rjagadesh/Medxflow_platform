import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetEncounters = (params) => {
  return useQuery({
    queryKey: ["pms-encounterList", params],
    queryFn: () => apiRequest(apiRoutes.encounter.getEncounters, { params }),
    placeholderData: [],
  });
};

export const useGetEncounterById = (encounterId) => {
  return useQuery({
    queryKey: ["pms-encounter", encounterId],
    queryFn: async () => {
      if (!encounterId) return null;
      const route = apiRoutes.encounter.getEncounterById;
      const config = {
        ...route,
        url: route.url(encounterId),
      };

      const response = await apiRequest(config);
      return response;
    },
    enabled: !!encounterId,
    placeholderData: null,
    // staleTime: 1000 * 60 * 5,
  });
};

export const useGetAutoFillEncounter = (appointmentId, options = {}) => {
  return useQuery({
    queryKey: ["pms-autoFillEncounter", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const route = apiRoutes.encounter.autoFillEncounter;
      const response = await apiRequest(route, {
        params: { id: appointmentId },
      });
      return response;
    },
    enabled: !!appointmentId,
    placeholderData: null,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};
