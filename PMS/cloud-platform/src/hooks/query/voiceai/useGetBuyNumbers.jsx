import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetNumbers = () => {
  return useQuery({
    queryKey: ["BuyPhone-Numbers"],
    queryFn: () => apiRequest(apiRoutes.voiceAI.telephony.getavailablenumbers),
  });
};

export const useBuyNumbers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.telephony.buynumbers, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["mobile-numbers"]);
    },
  });
};

export const useGetAvailableNumbers = () => {
  return useQuery({
    queryKey: ["BuyAvailablePhone-Numbers"],
    queryFn: () => apiRequest(apiRoutes.voiceAI.telephony.availableNumbers, {}),
  });
};
