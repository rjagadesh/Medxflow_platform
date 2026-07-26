import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAllergies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.allergies.create, {
        payload: data,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries([`${res.id}-allergies`]);
    },
  });
};
