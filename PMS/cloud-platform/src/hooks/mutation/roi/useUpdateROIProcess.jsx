import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateROIProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.roiProcces.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries([`roi_process_data-${response.agent}`]);
    },
  });
};
