import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerSignalingHandlers } from "./handlers.js";
import { socketAuthMiddleware } from "./auth.middleware.js";

export function attachSignaling(httpServer: HttpServer) {
  const path = process.env.SIGNALING_PATH ?? "/signaling";
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  const io = new Server(httpServer, {
    path,
    cors: { origin: [frontendUrl, "http://localhost:5173"], credentials: true },
  });

  io.use(socketAuthMiddleware);
  registerSignalingHandlers(io);
  return io;
}
