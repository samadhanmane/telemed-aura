import { getVideoConfig } from "../config/video.config.js";

/**
 * Recommended RTCPeerConnection config for rural/low bandwidth.
 */
export function getPeerConnectionConfig(): RTCConfiguration {
  const cfg = getVideoConfig();
  return {
    iceServers: [], // filled from getIceServers() at runtime
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceCandidatePoolSize: 4,
  };
}

type RTCConfiguration = {
  iceServers?: unknown[];
  bundlePolicy?: string;
  rtcpMuxPolicy?: string;
  iceCandidatePoolSize?: number;
};

export const ruralMediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 360, max: 720 },
    frameRate: { ideal: 15, max: 24 },
    facingMode: "user",
  },
};
