import apps_columns from "@/_data/apps_coloum";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetColumnData = (appName, isVoice) => {
  let findDefaultColumnData = apps_columns.find(
    (item) => item.app_id === appName,
  ) || { columns: [] };

  findDefaultColumnData = appName
    ? {
        ...findDefaultColumnData,
        columns: [
          ...findDefaultColumnData.columns,
          ...(isVoice
            ? [
                {
                  name: "From Phone Number",
                  id: "from_phone_number",
                  type: "text",
                  active: true,
                },
                {
                  name: "To Phone Number",
                  id: "to_phone_number",
                  type: "text",
                  active: true,
                },
              ]
            : [
                {
                  name: "Documents",
                  id: "documents",
                  type: "file",
                  active: false,
                },
              ]),
        ],
      }
    : {
        columns: [],
      };
  return useQuery({
    queryKey: ["column-data", appName],
    enabled: !!appName,
    retry: 0,
    queryFn: () =>
      apiRequest(apiRoutes.column_settings.get, {
        params: { app_name: appName },
      }),
    select: (data) => {
      const isDefaultColumnAlreadyExist = data.columns?.filter((item) => {
        return !item.is_custom;
      })?.length;
      return {
        ...data,
        columns: [
          ...data.columns,
          ...(isDefaultColumnAlreadyExist > 0
            ? []
            : findDefaultColumnData?.columns
              ? findDefaultColumnData.columns
              : []),
        ],
      };
    },
    initialData: () => ({
      ...findDefaultColumnData,
      columns: findDefaultColumnData?.columns || [],
      fromFallback: true, // helpful flag if you want to know in UI
    }),
  });
};
