import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAllergyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.allergies.profileUpdate, {
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
