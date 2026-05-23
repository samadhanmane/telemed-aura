import { Router } from "express";
import { getIceServers, isTurnConfigured } from "../../config/ice-servers.js";
import { getVideoMediaConfig } from "../../config/video-media.js";

export const videoRoutes = Router();

videoRoutes.get("/ice-servers", (_req, res) => {
  const turnEnabled = isTurnConfigured();
  res.json({
    iceServers: getIceServers(),
    turnEnabled,
    iceTransportPolicy: "all" as const,
    hint: turnEnabled
      ? "TURN relay enabled for NAT traversal."
      : "TURN not configured — set TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL in production.",
  });
});

/** Adaptive bitrate ladder + rural defaults for WebRTC clients. */
videoRoutes.get("/media-config", (_req, res) => {
  res.json(getVideoMediaConfig());
});
