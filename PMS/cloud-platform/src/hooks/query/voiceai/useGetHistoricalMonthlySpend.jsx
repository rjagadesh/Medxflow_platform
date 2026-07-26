import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetHistoricalMonthlySpend = ({
  departmentId,
  enabled = true,
} = {}) => {
  return useQuery({
    queryKey: ["voice-ai-historical-spend", departmentId],
    enabled: Boolean(enabled && departmentId),
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.analytics.historicalSpend, {
        metadata: { id: departmentId },
      }),
    retry: 0,
  });
};
