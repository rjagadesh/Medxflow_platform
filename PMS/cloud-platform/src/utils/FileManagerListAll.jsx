import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { apiRoutes } from "@/services/api";

export const useFileManagerListAll = () => {
  return useQuery({
    queryKey: ["file-manager-list_all"],
    queryFn: async () => {
      const token = localStorage.getItem("access");
      const response = await axios.get(apiRoutes.filemanager.list_all.url, {
        headers: {
          Authorization: `Bearer ${token}`,
        }, // Django expects ?parent=root
      });

      // Django usually returns a dict with `data` or a list directly
      return response.data.data || response.data || [];
    },
  });
};
