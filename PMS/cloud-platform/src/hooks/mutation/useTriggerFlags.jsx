// import { apiRoutes } from "@/services/api";
// import apiRequest from "@/services/api-request";
// import { useMutation, useQueryClient } from "@tanstack/react-query";

// export const useTriggerFlags = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data) => apiRequest(apiRoutes.triggerflags.create, { payload: data }),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["triggers"]);
//     },
//   });
// };



import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useTriggerFlags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      console.log("Payload being sent to API:", data);

      // 🔑 Convert JSON into FormData so Django sees it in request.POST
      const formData = new FormData();
      formData.append("triggerid", data.triggerid);
      formData.append("machine_id", data.machine_id);

      // If flag_value is an array, append each value
      if (Array.isArray(data.flag_value)) {
        data.flag_value.forEach((val) => formData.append("flag_value", val));
      } else {
        formData.append("flag_value", data.flag_value);
      }

      return apiRequest(apiRoutes.triggerflags.create, {
        payload: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["triggers"]);
    },
  });
};