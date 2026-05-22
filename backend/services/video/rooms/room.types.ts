export type ParticipantRole = "patient" | "doctor";

export interface VideoRoom {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  createdAt: Date;
  endedAt?: Date;
}
