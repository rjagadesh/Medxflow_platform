import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const usePatientEligibleCheck = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.patient.eligibilityCheck, {
        payload: {
          payload: data,
          // {
          //   encounter: {
          //     serviceTypeCodes: ["30"],
          //   },
          //   externalPatientId: "UAA111222333",
          //   provider: {
          //     npi: "1999999984",
          //     organizationName: "ACME Health Services",
          //   },
          //   subscriber: {
          //     dateOfBirth: "19640702",
          //     firstName: "Dias",
          //     lastName: "Melissa",
          //     memberId: "R50287926",
          //   },
          //   tradingPartnerServiceId: "84980",
          // },
          types: "insurance_eligibility",
        },
        headers: {
          "X-API-Key": "dbeba15294ba69fc589a576c71e2a284",
        },
      }),
    onSuccess: () => {
      //   queryClient.invalidateQueries(["get-patients"]);
    },
  });
};
