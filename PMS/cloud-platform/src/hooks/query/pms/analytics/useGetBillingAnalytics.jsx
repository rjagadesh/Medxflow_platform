import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

const EMPTY = {
  top_metrics: {
    gross_charges: { value: 0, display: "$0", delta: 0, direction: "up" },
    net_collections: { value: 0, display: "$0", delta: 0, direction: "up" },
    ar_balance: { value: 0, display: "$0", delta: 0, direction: "up" },
    total_encounters: { value: 0, display: "0", delta: 0, direction: "up" },
  },
  charges_vs_collections: [],
  avg_gross_charges_per_encounter: [],
  top_procedures: [],
  top_payers: [],
  claims_by_status: [],
  appointments_by_status: [],
  summary: {},
};

export const useGetBillingAnalytics = (range = "6m") => {
  return useQuery({
    queryKey: ["pms-billing-analytics", range],
    queryFn: () =>
      apiRequest(apiRoutes.encounter.billingAnalytics, {
        params: { range },
      }),
    placeholderData: EMPTY,
    keepPreviousData: true,
  });
};
