import type { Server } from "socket.io";

let signalingServer: Server | null = null;

export function setSignalingServer(io: Server) {
  signalingServer = io;
}

export function getSignalingServer(): Server | null {
  return signalingServer;
}

export function emitToAppointmentRoom(
  appointmentId: string,
  event: string,
  payload: unknown,
) {
  signalingServer?.to(appointmentId).emit(event, payload);
}
