import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAppointments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentData) =>
      apiRequest(apiRoutes.appointments.create, {
        payload: appointmentData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pms-appointments"] });
    },
  });
};


export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointmentData }) => {
      const config = apiRoutes.appointments.update;
      const endpoint = { ...config, url: config.url(id) };
      return apiRequest(endpoint, {
        payload: appointmentData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pms-appointments"] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId) => {
      const config = apiRoutes.appointments.delete;
      const endpoint = { ...config, url: config.url(appointmentId) };
      return apiRequest(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pms-appointments"] });
    },
  });
};


export const useRunEligibilityCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({ 
    mutationFn: (data) =>
      apiRequest(apiRoutes.appointments.runEligibilityCheck, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pms-appointments"] });
    }
  });
}
