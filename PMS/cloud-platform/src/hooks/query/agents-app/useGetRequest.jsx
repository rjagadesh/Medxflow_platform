import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetRequest = ({
  enabled = false,
  api_key,
  appId,
  status,
  page_size = 10,
  page = 1,
  ordering,
  clicked = 0,
  start_date,
  end_date,
  ...rest
} = {}) => {
  console.log("clicked111", clicked);
  return useQuery({
    queryKey: [
      appId,
      status,
      page_size,
      page,
      api_key,
      ordering,
      clicked,
      start_date,
      end_date,
    ],
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.all, {
        // metadata: {
        //   isCustomAuth: true,
        //   api_key: "b816a75ee736fadde73238cba2b4a233",
        // },
        params: Number(clicked)
          ? {
              apikey: api_key,
              status: status ? status : undefined,
              page_size,
              page: page || 1,
              ordering,
              start_date,
              end_date,
              ...rest,
            }
          : {
              apikey: api_key,
              status: status ? status : undefined,
              page_size,
              page,
              ordering,
              start_date,
              end_date,
            },
      }),
    enabled,
    retry: 0,
  });
};
