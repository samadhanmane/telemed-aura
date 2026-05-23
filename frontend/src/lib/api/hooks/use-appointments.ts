import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  bookAppointment,
  updateAppointmentStatus,
} from "@/lib/api/appointments";
import type { AppointmentStatus } from "@/types/healthcare";

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      conclusion,
      vitals,
    }: {
      id: string;
      status: AppointmentStatus;
      conclusion?: string;
      vitals?: {
        bloodPressureSystolic?: number;
        bloodPressureDiastolic?: number;
        sugarLevel?: number;
        oxygenLevel?: number;
      };
    }) => updateAppointmentStatus(id, status, { conclusion, vitals }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
