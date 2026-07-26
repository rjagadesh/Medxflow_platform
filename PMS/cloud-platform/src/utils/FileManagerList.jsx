import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerList = (parent = "root") => {
  return useQuery({
    queryKey: ["file-manager-list", parent],
    queryFn: async () => {
      const token = localStorage.getItem("access");
      const response = await axios.get(apiRoutes.filemanager.list.url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { parent }, // Django expects ?parent=root
      });

      // Django usually returns a dict with `data` or a list directly
      return response.data.data || response.data || [];
    },
  });
};
