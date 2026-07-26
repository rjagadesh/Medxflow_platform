import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMinutesOfMeetingsById = (id, options = {}) => {
  return useQuery({
    queryKey: [`minutes-of-meetings-${id}`],
    queryFn: () =>
      apiRequest(apiRoutes.minutesOfMeeting.getById, { metadata: { id } }),
    placeholderData: [],
    ...options,
  });
};
