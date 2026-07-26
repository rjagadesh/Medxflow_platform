import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetCallLogs = ({
  enabled = false,
  api_key,
  appId,
  userId,
  status,
  page_size = 10,
  page = 1,
  ordering,
  clicked = 0,
  ...rest
} = {}) => {
  return useQuery({
    queryKey: [
      "call-logs",
      appId,
      userId,
      status,
      page_size,
      page,
      api_key,
      ordering,
      clicked,
    ],
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.callLogs.all, {
        params: {
          // If the API requires filtering by app/agent, we pass it here.
          // Assuming 'app' or 'agent_id' might be the param name, but useGetRequest used apikey.
          // We'll pass what useGetRequest passed to be safe, plus any others.
          apikey: api_key,
          app_id: appId,
          user_id: userId,
          status: status !== "All" ? status : undefined,
          page_size,
          page,
          ordering,
          ...rest,
        },
      }),
    enabled,
    retry: 0,
  });
};
