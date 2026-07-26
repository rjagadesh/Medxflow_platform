import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerFolderCreate = (currentFolder = "root") => {
  return useMutation({
    mutationFn: async ({ name }) => {
      if (!name.trim()) throw new Error("Folder name cannot be empty");

      const token = localStorage.getItem("access");

      const res = await axios.post(
        apiRoutes.filemanager.create_folder.url,
        {
          name,
          parent: currentFolder, // ✅ automatically use current folder
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return res.data;
    },
  });
};
