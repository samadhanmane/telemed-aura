import { Router } from "express";
import { getIceServers } from "../../config/ice-servers.js";

export const videoRoutes = Router();

videoRoutes.get("/ice-servers", (_req, res) => {
  res.json({ iceServers: getIceServers() });
});
