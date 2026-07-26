// utils/FileManagerDownloadZip.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerDownloadZip = () => {
  return useMutation({
    mutationFn: async (ids) => {
      const token = localStorage.getItem("access");
      const res = await axios.post(
        apiRoutes.filemanager.download_zip.url,
        { ids },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "downloaded_files.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });
};
