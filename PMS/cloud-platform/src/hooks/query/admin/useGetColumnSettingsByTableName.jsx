import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetColumnSettingsByTableName = () => {
  // return useQuery({
  //   queryKey: ["claims_processing"],
  //   queryFn: () =>
  //     apiRequest(apiRoutes.column_settings.get, {
  //       params: { app_name: "claim_processing" },
  //     }),
  // });
};
