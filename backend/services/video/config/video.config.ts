export type VideoConfig = {
  signalingPath: string;
  maxBitrateKbps: number;
  minBitrateKbps: number;
  turnUrl: string;
  turnUsername: string;
  turnCredential: string;
};

export function getVideoConfig(): VideoConfig {
  return {
    signalingPath: process.env.SIGNALING_PATH ?? "/signaling",
    maxBitrateKbps: Number(process.env.VIDEO_MAX_BITRATE_KBPS ?? 500),
    minBitrateKbps: Number(process.env.VIDEO_MIN_BITRATE_KBPS ?? 150),
    turnUrl: process.env.TURN_URL ?? "",
    turnUsername: process.env.TURN_USERNAME ?? "",
    turnCredential: process.env.TURN_CREDENTIAL ?? "",
  };
}
