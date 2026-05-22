import { Router } from "express";
import { roomRoutes } from "../rooms/room.routes.js";

export const videoRouter = Router();

videoRouter.use("/rooms", roomRoutes);
videoRouter.get("/ice-servers", (_req, res) => {
  res.status(501).json({ message: "Return ICE config — wire getIceServers" });
});
