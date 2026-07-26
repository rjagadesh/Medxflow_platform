import { apiRoutes } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useUploadEob = () => {
  return useMutation({
    mutationKey: ["uplaod-eob"],
    mutationFn: async (payload) => {
      const token = localStorage.getItem("access");

      const isFormData = payload instanceof FormData;

      const response = await axios.post(apiRoutes.paperEob.create, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          // IMPORTANT FIX
          ...(isFormData
            ? {} // let browser set multipart boundary
            : { "Content-Type": "application/json" }),
        },
      });

      return response.data;
    },
  });
};
