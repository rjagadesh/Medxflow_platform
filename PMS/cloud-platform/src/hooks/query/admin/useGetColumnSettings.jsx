import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetColumnSettings = () => {
  return useQuery({
    queryKey: ["column-settings"],
    queryFn: () => apiRequest(apiRoutes.column_settings.all),
  });
};
