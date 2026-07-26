import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTotalDuration = ({
  departmentId,
  startDate,
  endDate,
  enabled = true,
} = {}) => {
  return useQuery({
    queryKey: ["voice-ai-total-duration", departmentId, startDate, endDate],
    enabled: Boolean(enabled && departmentId && startDate && endDate),
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.analytics.totalDuration, {
        metadata: { id: departmentId },
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      }),
    retry: 0,
  });
};
