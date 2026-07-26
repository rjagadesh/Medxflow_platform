import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";

export const useCreateProvider = () => {
  return useMutation({
    mutationKey: ["create-provider"],
    mutationFn: async (payload) => {
      const token = localStorage.getItem("access");

      const isFormData = payload instanceof FormData;

      const response = await axios.post(
        apiRoutes.provider.create.url,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // IMPORTANT FIX
            ...(isFormData
              ? {} // let browser set multipart boundary
              : { "Content-Type": "application/json" }),
          },
        },
      );

      return response.data;
    },
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.providerForAppointments.put, {
        payload: data,

        // ✅ Only set headers for JSON
        headers:
          data instanceof FormData
            ? {}
            : { "Content-Type": "application/json" },

        metadata: {
          id:
            data instanceof FormData
              ? data.get("id") // read from FormData if needed for URL
              : data.id,
        },
      }),

    onSuccess: () => {
      queryClient.invalidateQueries(["get-patients"]);
    },
  });
};
