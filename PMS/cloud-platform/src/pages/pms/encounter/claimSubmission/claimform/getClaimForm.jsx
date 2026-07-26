import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClaimById = (id) => {
  return useQuery({
    queryKey: [`get-claim-id-${id}`],
    queryFn: () =>
      apiRequest(apiRoutes.claimsubmission.getById, {
        metadata: {
          id,
        },
      }),
    placeholderData: {},
    enabled: !!id,
  });
};
