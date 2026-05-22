import type { Server, Socket } from "socket.io";

/**
 * WebRTC signaling: offer, answer, ice-candidate, join-room, leave-room.
 */
export function registerSignalingHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join-room", (_payload: { roomId: string; role: string; token: string }) => {
      /* TODO: verify token, socket.join(roomId) */
    });

    socket.on("offer", (_payload: { roomId: string; sdp: unknown }) => {});
    socket.on("answer", (_payload: { roomId: string; sdp: unknown }) => {});
    socket.on("ice-candidate", (_payload: { roomId: string; candidate: unknown }) => {});

    socket.on("disconnect", () => {});
  });
}
