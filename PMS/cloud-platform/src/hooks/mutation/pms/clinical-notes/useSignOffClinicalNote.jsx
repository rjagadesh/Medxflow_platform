import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSignOffClinicalNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiRequest(apiRoutes.clinicalNotes.signOff, {
        metadata: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
    },
  });
};
