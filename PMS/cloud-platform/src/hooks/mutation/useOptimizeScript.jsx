import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useOptimizeScript = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.scripts.optimize, { payload: data }),
  });
};
