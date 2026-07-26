import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetQueueDetails = (
  client_email,
  fromdate,
  todate,
  queueval
) => {
  return useQuery({
    queryKey: [`queue-details-${queueval}`, client_email],
    queryFn: ({ queryKey }) =>
      apiRequest(apiRoutes.droidMetrix.queues_details, {
        params: { client_email: queryKey[1], fromdate, todate, queueval },
        metadata: {
          isDroidMetrix: true,
        },
      }),
  });
};
