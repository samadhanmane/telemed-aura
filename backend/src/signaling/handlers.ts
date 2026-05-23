import type { Server, Socket } from "socket.io";
import { SIGNALING_EVENTS as E } from "./events.js";
import { getSocketSession } from "./auth.middleware.js";

const roomRoles = new Map<string, Map<string, "patient" | "doctor">>();

function trackRole(roomId: string, socketId: string, role: "patient" | "doctor") {
  if (!roomRoles.has(roomId)) roomRoles.set(roomId, new Map());
  roomRoles.get(roomId)!.set(socketId, role);
}

function untrackRole(roomId: string, socketId: string) {
  roomRoles.get(roomId)?.delete(socketId);
  if (roomRoles.get(roomId)?.size === 0) roomRoles.delete(roomId);
}

export function registerSignalingHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const session = getSocketSession(socket);
    let currentRoom: string | null = null;

    socket.on(E.JOIN_ROOM, (payload: { roomId: string }) => {
      const roomId = payload.roomId;

      if (roomId !== session.appointmentId) {
        socket.emit(E.SESSION_ERROR, { message: "Invalid room for this session" });
        return;
      }

      const rolesInRoom = roomRoles.get(roomId);
      if (rolesInRoom) {
        const hasRole = [...rolesInRoom.values()].includes(session.role);
        if (hasRole) {
          socket.emit(E.SESSION_ERROR, { message: `${session.role} already in call` });
          return;
        }
        if (rolesInRoom.size >= 2) {
          socket.emit(E.SESSION_ERROR, { message: "Room is full" });
          return;
        }
      }

      if (currentRoom) socket.leave(currentRoom);
      currentRoom = roomId;
      socket.join(roomId);
      trackRole(roomId, socket.id, session.role);

      const count = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
      if (count > 1) {
        socket.to(roomId).emit(E.PEER_JOINED, {
          role: session.role,
          name: session.name,
          socketId: socket.id,
        });
        socket.emit(E.PEER_JOINED, { existing: true });
      }
    });

    socket.on(E.OFFER, (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.roomId !== session.appointmentId) return;
      socket.to(payload.roomId).emit(E.OFFER, { sdp: payload.sdp });
    });

    socket.on(E.ANSWER, (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (payload.roomId !== session.appointmentId) return;
      socket.to(payload.roomId).emit(E.ANSWER, { sdp: payload.sdp });
    });

    socket.on(
      E.ICE_CANDIDATE,
      (payload: { roomId: string; candidate: RTCIceCandidateInit }) => {
        if (payload.roomId !== session.appointmentId) return;
        socket.to(payload.roomId).emit(E.ICE_CANDIDATE, { candidate: payload.candidate });
      },
    );

    socket.on(
      E.MEDIA_STATE,
      (payload: {
        roomId: string;
        audio: boolean;
        video: boolean;
        qualityTier?: string;
        audioOnlyFallback?: boolean;
      }) => {
        if (payload.roomId !== session.appointmentId) return;
        socket.to(payload.roomId).emit(E.MEDIA_STATE, {
          role: session.role,
          audio: payload.audio,
          video: payload.video,
          qualityTier: payload.qualityTier,
          audioOnlyFallback: payload.audioOnlyFallback,
        });
      },
    );

    socket.on(E.END_CALL, (payload: { roomId: string }) => {
      if (!currentRoom || payload.roomId !== session.appointmentId) return;
      socket.to(currentRoom).emit(E.PEER_LEFT, { role: session.role, name: session.name });
      cleanup(socket, currentRoom);
      currentRoom = null;
    });

    socket.on(E.LEAVE_ROOM, () => {
      if (currentRoom) {
        socket.to(currentRoom).emit(E.PEER_LEFT, { role: session.role, name: session.name });
        cleanup(socket, currentRoom);
        currentRoom = null;
      }
    });

    socket.on("disconnect", () => {
      if (currentRoom) {
        socket.to(currentRoom).emit(E.PEER_LEFT, { role: session.role, name: session.name });
        cleanup(socket, currentRoom);
      }
    });

    function cleanup(sock: Socket, roomId: string) {
      untrackRole(roomId, sock.id);
      sock.leave(roomId);
    }
  });
}

type RTCSessionDescriptionInit = { type?: string; sdp?: string };
type RTCIceCandidateInit = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
};
