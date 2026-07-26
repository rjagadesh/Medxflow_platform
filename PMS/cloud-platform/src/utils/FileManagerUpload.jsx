// hooks/useFileManagerUpload.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerUpload = (currentFolder = "root") => {
  return useMutation({
    mutationFn: async ({ files, onProgress }) => {
      const token = localStorage.getItem("access");
      const formData = new FormData();

      const folderSet = new Set();

      files.forEach((f) => {
        const relativePath = f.webkitRelativePath || f.name;
        formData.append("files", f, relativePath);
        formData.append("relativePath", relativePath);

        // collect folders from file path
        const parts = relativePath.split("/").slice(0, -1); // all but file
        for (let i = 1; i <= parts.length; i++) {
          folderSet.add(parts.slice(0, i).join("/"));
        }
      });

      // ✅ Send folders explicitly
      folderSet.forEach((folder) => formData.append("folders", folder));

      // ✅ Also send current parent
      formData.append("parent", currentFolder || "root");

      // Debug (optional)
      for (const [key, val] of formData.entries()) {
        console.log(key, val);
      }

      const res = await axios.post(apiRoutes.filemanager.upload.url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        },
      });

      return res.data.files;
    },
  });
};
