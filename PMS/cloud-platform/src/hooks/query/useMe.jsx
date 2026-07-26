import default_iam_role from "@/_data/default_iam_role";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGETMe = ({ enabled } = {}) => {
  console.log("enabled", enabled);
  return useQuery({
    queryKey: ["me"],
    enabled: enabled,
    staleTime: 20000,
    queryFn: () => apiRequest(apiRoutes.me.get),
    retry: false,
    // select: (data) => {
    //   const checkRolePermissionLength = Object.keys(
    //     data.role_permission
    //   ).length;
    //   if (checkRolePermissionLength === 0) {
    //     return {
    //       ...data,
    //       role_permission: default_iam_role,
    //     };
    //   }
    //   return data;
    // },
  });
};
