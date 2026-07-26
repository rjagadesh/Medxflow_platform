import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateMinutesOfMeetings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.minutesOfMeeting.update, {
        payload: data.formData,
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["minutes-of-meetings"]);
    },
  });
};
