/**
 * Low-bandwidth telehealth media policy — village / 2G–3G friendly defaults.
 * Frontend applies tiers via getUserMedia constraints + RTCRtpSender.setParameters.
 */

export type VideoQualityTier = "high" | "medium" | "low" | "audio-only";

export type VideoQualityLayer = {
  tier: VideoQualityTier;
  label: string;
  width: number;
  height: number;
  frameRate: number;
  maxBitrateKbps: number;
};

export function getVideoMediaConfig() {
  const minKbps = Number(process.env.VIDEO_MIN_BITRATE_KBPS ?? 120);
  const maxKbps = Number(process.env.VIDEO_MAX_BITRATE_KBPS ?? 500);
  const startTier = (process.env.VIDEO_START_TIER as VideoQualityTier) || "low";

  const layers: VideoQualityLayer[] = [
    {
      tier: "low",
      label: "Low data (240p)",
      width: 320,
      height: 180,
      frameRate: 10,
      maxBitrateKbps: minKbps,
    },
    {
      tier: "medium",
      label: "Standard (360p)",
      width: 640,
      height: 360,
      frameRate: 15,
      maxBitrateKbps: Math.floor(maxKbps * 0.55),
    },
    {
      tier: "high",
      label: "HD (when network allows)",
      width: 1280,
      height: 720,
      frameRate: 24,
      maxBitrateKbps: maxKbps,
    },
  ];

  return {
    ruralOptimized: true,
    defaultStartTier: startTier,
    audioOnlyFallbackEnabled: process.env.VIDEO_AUDIO_FALLBACK !== "false",
    adaptiveBitrate: true,
    minKbps,
    maxKbps,
    startKbps: Math.floor((minKbps + maxKbps) / 3),
    layers,
    /** Thresholds for client-side adaptation (packet loss %, RTT ms). */
    thresholds: {
      downgradePacketLossPercent: 4,
      downgradeRttMs: 350,
      upgradeStablePolls: 3,
      audioOnlyPacketLossPercent: 8,
      audioOnlyRttMs: 600,
    },
    getUserMedia: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: { ideal: 1 },
      },
    },
  };
}
