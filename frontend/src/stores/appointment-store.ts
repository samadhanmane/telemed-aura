import { create } from "zustand";
import type { Appointment, AppointmentStatus } from "@/types/healthcare";
import { mockAppointments } from "@/data/mock/healthcare";

interface AppointmentState {
  appointments: Appointment[];
  updateStatus: (id: string, status: AppointmentStatus) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: mockAppointments,
  updateStatus: (id, status) =>
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, status } : a,
      ),
    })),
}));
