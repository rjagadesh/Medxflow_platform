import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAllergyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.allergies.profileCreate, {
        payload: data,
        metadata: {
          id: data.id,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["allergy-profile"]);
    },
  });
};
