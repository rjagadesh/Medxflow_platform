import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAllergies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.allergies.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries([`${res.id}-allergies`]);
    },
  });
};
