import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerSignalingHandlers } from "./handlers.js";
import { getVideoConfig } from "../config/video.config.js";

export function attachSignaling(httpServer: HttpServer) {
  const { signalingPath } = getVideoConfig();
  const io = new Server(httpServer, {
    path: signalingPath,
    cors: { origin: "*" },
  });
  registerSignalingHandlers(io);
  return io;
}
