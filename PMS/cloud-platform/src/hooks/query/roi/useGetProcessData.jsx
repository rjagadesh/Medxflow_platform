import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

const initialProcessData = {
  department: null,
  agent: null,
  head_count: null,
  hours_spent: null,
  hourly_rate: null,
  avg_time: null,
  invoice_value: null,
  operational_model: "ONSITE ONLY",
  additional_load_cost: 0,
  onsite_head_count: null,
  onsite_hours_spent: null,
  onsite_hourly_rate: null,
  onsite_additional_load_cost: null,
  offshore_head_count: null,
  offshore_hours_spent: null,
  offshore_hourly_rate: null,
  offshore_additional_load_cost: null,
};

export const useGetProcessData = (params) => {
  return useQuery({
    queryKey: [
      `roi_process_data-${params.app_id}`,
      params.app_id,
      params.module_id,
    ],
    staleTime: 0,
    enabled: !!params.app_id,
    queryFn: () => apiRequest(apiRoutes.roiProcces.get, { params }),
    placeholderData: {},
    select: (data) => {
      if (data?.length > 0) {
        return data[0];
      } else {
        return initialProcessData;
      }
    },
  });
};
