import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetInstruction = () => {
  return useQuery({
    queryKey: ["instruction"],
    queryFn: () => apiRequest(apiRoutes.instructions.get),
    placeholderData: [],
  });
};
