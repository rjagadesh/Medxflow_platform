import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetFaqs = (params) => {
  return useQuery({
    queryKey: ["faqs", params.q, params.page],
    queryFn: () =>
      apiRequest(apiRoutes.faqs.all, {
        params,
      }),
    placeholderData: [],
  });
};
