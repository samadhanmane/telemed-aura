/** Video quality tiers for rural / low-bandwidth consultations. */
export type VideoQualityTier = "high" | "medium" | "low" | "audio-only";

export type VideoQualityLayer = {
  tier: VideoQualityTier;
  label: string;
  width: number;
  height: number;
  frameRate: number;
  maxBitrateKbps: number;
};

export type VideoMediaConfig = {
  ruralOptimized: boolean;
  defaultStartTier: VideoQualityTier;
  audioOnlyFallbackEnabled: boolean;
  adaptiveBitrate: boolean;
  minKbps: number;
  maxKbps: number;
  startKbps: number;
  layers: VideoQualityLayer[];
  thresholds: {
    downgradePacketLossPercent: number;
    downgradeRttMs: number;
    upgradeStablePolls: number;
    audioOnlyPacketLossPercent: number;
    audioOnlyRttMs: number;
  };
  getUserMedia: { audio: MediaTrackConstraints };
};

const TIER_ORDER: VideoQualityTier[] = ["low", "medium", "high"];

export function tierLabel(tier: VideoQualityTier): string {
  switch (tier) {
    case "high":
      return "HD";
    case "medium":
      return "360p";
    case "low":
      return "240p · low data";
    case "audio-only":
      return "Audio only";
  }
}

export function getLayer(config: VideoMediaConfig, tier: VideoQualityTier): VideoQualityLayer | undefined {
  if (tier === "audio-only") return undefined;
  return config.layers.find((l) => l.tier === tier);
}

export function getMediaConstraints(
  config: VideoMediaConfig,
  tier: VideoQualityTier,
): MediaStreamConstraints {
  const audio = config.getUserMedia.audio;
  if (tier === "audio-only") {
    return { audio, video: false };
  }
  const layer = getLayer(config, tier) ?? config.layers[0]!;
  return {
    audio,
    video: {
      width: { ideal: layer.width, max: layer.width },
      height: { ideal: layer.height, max: layer.height },
      frameRate: { ideal: layer.frameRate, max: layer.frameRate },
      facingMode: "user",
    },
  };
}

export async function applyMaxBitrate(sender: RTCRtpSender, maxBitrateBps: number) {
  try {
    const params = sender.getParameters();
    if (!params.encodings?.length) {
      params.encodings = [{}];
    }
    params.encodings = params.encodings.map((enc) => ({
      ...enc,
      maxBitrate: maxBitrateBps,
    }));
    await sender.setParameters(params);
  } catch {
    /* browser may reject before negotiation completes */
  }
}

export async function applyVideoTier(
  pc: RTCPeerConnection,
  stream: MediaStream,
  config: VideoMediaConfig,
  tier: VideoQualityTier,
  options?: { videoEnabled?: boolean },
) {
  const videoTrack = stream.getVideoTracks()[0];
  const sender = pc.getSenders().find((s) => s.track?.kind === "video");
  const wantVideo =
    options?.videoEnabled ?? (tier !== "audio-only");

  if (tier === "audio-only") {
    if (videoTrack) videoTrack.enabled = false;
    if (sender?.track) sender.track.enabled = false;
    if (sender) await applyMaxBitrate(sender, 32_000);
    const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
    stream.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    if (audioSender?.track) audioSender.track.enabled = true;
    if (audioSender) await applyMaxBitrate(audioSender, 128_000);
    return;
  }

  const layer = getLayer(config, tier);
  if (!layer || !videoTrack) return;

  if (!wantVideo) {
    videoTrack.enabled = false;
    if (sender?.track) sender.track.enabled = false;
    if (sender) await applyMaxBitrate(sender, layer.maxBitrateKbps * 1000);
    return;
  }

  videoTrack.enabled = true;
  if (sender?.track) sender.track.enabled = true;
  try {
    await videoTrack.applyConstraints({
      width: { ideal: layer.width, max: layer.width },
      height: { ideal: layer.height, max: layer.height },
      frameRate: { ideal: layer.frameRate, max: layer.frameRate },
    });
  } catch {
    /* some browsers limit mid-call constraint changes */
  }
  if (sender) await applyMaxBitrate(sender, layer.maxBitrateKbps * 1000);
}

export function downgradeTier(current: VideoQualityTier): VideoQualityTier {
  if (current === "audio-only") return "audio-only";
  if (current === "high") return "medium";
  if (current === "medium") return "low";
  return "audio-only";
}

export function upgradeTier(current: VideoQualityTier): VideoQualityTier {
  if (current === "audio-only") return "low";
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return current;
  return TIER_ORDER[idx + 1]!;
}

export type NetworkSample = {
  packetLossPercent: number;
  rttMs: number;
  outboundKbps: number;
};

let lastStatsSnapshot: {
  ts: number;
  bytesSent: number;
  packetsLost: number;
  packetsReceived: number;
} | null = null;

/** Parse WebRTC stats for adaptive decisions (uses deltas between polls). */
export async function sampleNetwork(pc: RTCPeerConnection): Promise<NetworkSample> {
  const stats = await pc.getStats();
  let rttMs = 0;
  let packetsLost = 0;
  let packetsReceived = 0;
  let bytesSent = 0;

  stats.forEach((report) => {
    if (report.type === "candidate-pair" && report.state === "succeeded") {
      const rtt = report.currentRoundTripTime;
      if (typeof rtt === "number") rttMs = Math.max(rttMs, rtt * 1000);
    }
    if (report.type === "inbound-rtp" && report.kind === "video") {
      packetsLost += report.packetsLost ?? 0;
      packetsReceived += report.packetsReceived ?? 0;
    }
    if (report.type === "outbound-rtp" && report.kind === "video") {
      bytesSent += report.bytesSent ?? 0;
    }
  });

  const now = Date.now();
  let outboundKbps = 0;
  let packetLossPercent = 0;

  if (lastStatsSnapshot) {
    const dt = (now - lastStatsSnapshot.ts) / 1000;
    if (dt > 0) {
      outboundKbps = Math.max(0, ((bytesSent - lastStatsSnapshot.bytesSent) * 8) / dt / 1000);
      const lostDelta = packetsLost - lastStatsSnapshot.packetsLost;
      const recvDelta = packetsReceived - lastStatsSnapshot.packetsReceived;
      const totalDelta = lostDelta + recvDelta;
      if (totalDelta > 0) packetLossPercent = (lostDelta / totalDelta) * 100;
    }
  }

  lastStatsSnapshot = { ts: now, bytesSent, packetsLost, packetsReceived };

  return { packetLossPercent, rttMs, outboundKbps };
}

export function resetNetworkStats() {
  lastStatsSnapshot = null;
}

export function evaluateNetwork(
  sample: NetworkSample,
  tier: VideoQualityTier,
  config: VideoMediaConfig,
): "ok" | "downgrade" | "audio-only" {
  const t = config.thresholds;
  if (
    config.audioOnlyFallbackEnabled &&
    (sample.packetLossPercent >= t.audioOnlyPacketLossPercent ||
      sample.rttMs >= t.audioOnlyRttMs)
  ) {
    return tier === "audio-only" ? "ok" : "audio-only";
  }
  if (
    sample.packetLossPercent >= t.downgradePacketLossPercent ||
    sample.rttMs >= t.downgradeRttMs
  ) {
    if (tier === "audio-only") return "ok";
    if (tier === "low" && config.audioOnlyFallbackEnabled) return "audio-only";
    return "downgrade";
  }
  return "ok";
}
