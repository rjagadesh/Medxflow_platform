import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useAnalyzeAgentFiles = () => {
  return useMutation({
    mutationFn: (formData) =>
      apiRequest(apiRoutes.agentConfig.analyzeFiles, {
        payload: formData,
      }),
  });
};
