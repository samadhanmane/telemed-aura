import { Signal, SignalHigh, SignalLow, SignalMedium, Mic, Video, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NetworkSample, VideoQualityTier } from "../lib/adaptive-media";
import { tierLabel } from "../lib/adaptive-media";

export function ConnectionQualityBar({
  tier,
  audioOnlyFallback,
  adaptiveMessage,
  onSwitchAudioOnly,
  onRestoreVideo,
  showControls = true,
  networkStats,
  downgradeCount = 0,
  ruralOptimized = true,
}: {
  tier: VideoQualityTier;
  audioOnlyFallback: boolean;
  adaptiveMessage: string | null;
  onSwitchAudioOnly?: () => void;
  onRestoreVideo?: () => void;
  showControls?: boolean;
  networkStats?: NetworkSample | null;
  downgradeCount?: number;
  ruralOptimized?: boolean;
}) {
  const Icon =
    tier === "audio-only"
      ? Mic
      : tier === "high"
        ? SignalHigh
        : tier === "medium"
          ? SignalMedium
          : SignalLow;

  const variant =
    tier === "audio-only"
      ? "destructive"
      : tier === "low"
        ? "secondary"
        : "outline";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={variant} className="gap-1 font-normal">
          <Icon className="h-3 w-3" />
          {audioOnlyFallback ? "Audio only · low network" : tierLabel(tier)}
        </Badge>
        {ruralOptimized && (
          <Badge variant="outline" className="gap-1 text-[10px] font-normal">
            <Wifi className="h-3 w-3" />
            Village / low-data mode
          </Badge>
        )}
        {adaptiveMessage && (
          <span className="text-xs text-muted-foreground">{adaptiveMessage}</span>
        )}
        {showControls && (
          <div className="flex gap-1">
            {tier !== "audio-only" && onSwitchAudioOnly && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onSwitchAudioOnly}>
                <Mic className="mr-1 h-3 w-3" />
                Audio only
              </Button>
            )}
            {tier === "audio-only" && onRestoreVideo && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onRestoreVideo}>
                <Video className="mr-1 h-3 w-3" />
                Try video
              </Button>
            )}
          </div>
        )}
      </div>
      {networkStats && (
        <p className="text-[10px] text-muted-foreground">
          ↑ {Math.round(networkStats.outboundKbps)} kbps · loss {networkStats.packetLossPercent.toFixed(1)}% ·
          RTT {Math.round(networkStats.rttMs)} ms
          {downgradeCount > 0 && ` · ${downgradeCount} quality adjustment(s)`}
        </p>
      )}
    </div>
  );
}
