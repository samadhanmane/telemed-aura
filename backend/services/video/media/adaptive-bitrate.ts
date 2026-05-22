import { getVideoConfig } from "../config/video.config.js";

/**
 * Bitrate ladder for 2G/3G village networks.
 * Frontend applies via RTCRtpSender.setParameters.
 */
export function getBitrateLadder() {
  const cfg = getVideoConfig();
  return {
    minKbps: cfg.minBitrateKbps,
    maxKbps: cfg.maxBitrateKbps,
    startKbps: Math.floor((cfg.minBitrateKbps + cfg.maxBitrateKbps) / 2),
    layers: [
      { label: "low", width: 320, height: 180, maxBitrateKbps: cfg.minBitrateKbps },
      { label: "medium", width: 640, height: 360, maxBitrateKbps: Math.floor(cfg.maxBitrateKbps * 0.6) },
      { label: "high", width: 1280, height: 720, maxBitrateKbps: cfg.maxBitrateKbps },
    ],
  };
}
