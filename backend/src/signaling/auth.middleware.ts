import type { Socket } from "socket.io";
import { verifyVideoSessionToken } from "../shared/utils/video-session.js";

export type SocketSession = {
  userId: string;
  role: "patient" | "doctor";
  appointmentId: string;
  name: string;
};

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  try {
    const session = verifyVideoSessionToken(token);
    (socket.data as { session: SocketSession }).session = {
      userId: session.userId,
      role: session.role,
      appointmentId: session.appointmentId,
      name: session.name,
    };
    next();
  } catch {
    next(new Error("Invalid or expired video session"));
  }
}

export function getSocketSession(socket: Socket): SocketSession {
  return (socket.data as { session: SocketSession }).session;
}
