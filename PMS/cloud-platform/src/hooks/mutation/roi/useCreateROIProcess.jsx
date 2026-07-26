import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateROIProcess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.roiProcces.create, { payload: data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries([`roi_process_data-${response.agent}`]);
    },
  });
};
