import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClinicalNotes = (params) => {
  return useQuery({
    queryKey: ["clinical-notes", params],
    queryFn: () => apiRequest(apiRoutes.clinicalNotes.getAll, { params }),
    placeholderData: {
      notes: [],
      count: 0,
    },
  });
};
