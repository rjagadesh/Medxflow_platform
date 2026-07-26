import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useSearchPayers = (searchValue) => {
  return useQuery({
    queryKey: ["search-payers", searchValue],
    queryFn: () =>
      apiRequest(apiRoutes.patient.payers, {
        payload: {
          payload: {
            query: searchValue,
          },
          types: "payer_search",
        },
        headers: {
          "X-API-Key": "dbeba15294ba69fc589a576c71e2a284",
        },
      }),
    placeholderData: {
      count: 0,
      results: [],
      page_size: 10,
      page: 1,
    },
  });
};
