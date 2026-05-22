import { getVideoConfig } from "./video.config.js";

/**
 * ICE servers for WebRTC — STUN + TURN required for many rural NAT setups.
 */
export function getIceServers() {
  const cfg = getVideoConfig();
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];
  if (cfg.turnUrl) {
    servers.push({
      urls: cfg.turnUrl,
      username: cfg.turnUsername,
      credential: cfg.turnCredential,
    });
  }
  return servers;
}

/** Node types — use frontend WebRTC types at integration time */
type RTCIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};
