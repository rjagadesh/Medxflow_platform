import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClaimSubmission = (params) => {
  return useQuery({
    queryKey: ["pms-encounterClaimList", params.page, params.page_size],
    queryFn: () => apiRequest(apiRoutes.claimsubmission.getClaims, { params }),
    placeholderData: [],
  });
};

export const useGetClaimSubmissionById = (encounterId) => {
  return useQuery({
    queryKey: ["pms-encounter", encounterId],
    queryFn: async () => {
      if (!encounterId) return null;
      const route = apiRoutes.encounter.getEncounterById;
      const config = {
        ...route,
        url: route.url(encounterId),
      };

      const response = await apiRequest(config);
      return response;
    },
    enabled: !!encounterId,
    placeholderData: null,
    staleTime: 1000 * 60 * 5,
  });
};

import { useQueries } from "@tanstack/react-query";

export const useGetClaimSubmissionsByIds = (ids = []) => {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["pms-encounter", id],
      queryFn: async () => {
        const route = apiRoutes.encounter.getEncounterById;
        const config = {
          ...route,
          url: route.url(id),
        };
        const response = apiRequest(config);
        return response;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const dataById = queries.reduce((acc, q, index) => {
    if (q.data) {
      acc[ids[index]] = q.data;
    }
    return acc;
  }, {});

  return {
    data: dataById,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    errors: queries.filter((q) => q.isError).map((q) => q.error),
  };
};
