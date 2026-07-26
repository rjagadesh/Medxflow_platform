// utils/FileManagerDelete.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerDelete = () => {
  return useMutation({
    mutationFn: async (file_id) => {
      const token = localStorage.getItem("access");
      const res = await axios.delete(
        apiRoutes.filemanager.delete.url(file_id),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
  });
};
