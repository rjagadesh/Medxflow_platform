import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateMinutesOfMeetings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.minutesOfMeeting.create, {
        payload: data,
        header: {
          ContentType: "multipart/form-data",
        },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries([`minutes-of-meetings-${res.id}`]);
    },
  });
};
