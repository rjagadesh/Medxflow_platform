import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateSubAgentsAPIkey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.sub_agents_key.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["sub-agents-keys"]);
    },
  });
};
