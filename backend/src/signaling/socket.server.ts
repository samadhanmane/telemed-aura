import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerSignalingHandlers } from "./handlers.js";
import { socketAuthMiddleware } from "./auth.middleware.js";
import { parseFrontendOrigins } from "../config/frontend-origins.js";
import { setSignalingServer } from "./io.js";

export function attachSignaling(httpServer: HttpServer) {
  const path = process.env.SIGNALING_PATH ?? "/signaling";

  const io = new Server(httpServer, {
    path,
    cors: { origin: parseFrontendOrigins(), credentials: true },
  });

  io.use(socketAuthMiddleware);
  registerSignalingHandlers(io);
  setSignalingServer(io);
  return io;
}
