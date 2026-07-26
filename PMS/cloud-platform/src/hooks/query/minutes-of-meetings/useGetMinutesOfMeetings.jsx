import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMinutesOfMeetings = () => {
  return useQuery({
    queryKey: ["minutes-of-meetings"],
    queryFn: () => apiRequest(apiRoutes.minutesOfMeeting.get),
    placeholderData: [],
  });
};
