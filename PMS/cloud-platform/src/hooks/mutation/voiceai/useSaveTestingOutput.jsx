import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateTestingOutput = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, messages }) => {
      console.log("Mutation: Creating testing output with id:", id);
      return apiRequest(apiRoutes.voiceAI.testingOutput.create, {
        payload: { messages },
        metadata: { id },
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate the get query to refresh the data
      queryClient.invalidateQueries(["testing-output", variables.id]);
    },
  });
};
