import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetSmartDriveList = () => {
  return useQuery({
    queryKey: ["smart-drive-list"],
    queryFn: () => apiRequest(apiRoutes.smartDrive.list),
    placeholderData: [],
  });
};
