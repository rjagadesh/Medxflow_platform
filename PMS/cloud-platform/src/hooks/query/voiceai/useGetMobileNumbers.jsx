import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMobileNumbers = () => {
  return useQuery({
    queryKey: ["mobile-numbers"],
    queryFn: () => apiRequest(apiRoutes.voiceAI.mobileNumbers.all),
    retry: false,
    staleTime: 0,
  });
};
