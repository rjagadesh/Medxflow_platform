import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateEncounter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (encounterData) =>
      apiRequest(apiRoutes.encounter.createEncounter, {
        payload: encounterData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      queryClient.invalidateQueries({ queryKey: ["pms-encounters"] });
    },
  });
};

export const useUpdateEncounter = () => {
  const queryClient = useQueryClient();
    return useMutation({
    mutationFn: ({ id, encounterData }) => {
        const config = apiRoutes.encounter.updateEncounterById;
        const endpoint = { ...config, url: config.url(id) };
        return apiRequest(endpoint, {
        payload: encounterData,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
        queryClient.invalidateQueries({ queryKey: ["pms-encounters"] });
    },
  });
}