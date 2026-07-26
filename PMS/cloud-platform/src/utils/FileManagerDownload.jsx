// utils/FileManagerDownload.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerDownload = () => {
  return useMutation({
    mutationFn: async (file_id) => {
      const token = localStorage.getItem("access");

      // ✅ correct syntax: (url, body, config)
      const res = await axios.post(
        apiRoutes.filemanager.download.url, // base URL (no file_id in path)
        { file_id }, // 👈 send file_id in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // 👈 important for binary files
        }
      );

      // ✅ Extract filename from Content-Disposition
      const contentDisposition = res.headers["content-disposition"];
      let filename = "downloaded_file";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) filename = match[1];
      }

      // ✅ Create blob and trigger download
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // ✅ Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};
