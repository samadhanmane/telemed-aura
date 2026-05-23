import type { RefObject } from "react";
import { cn } from "@/lib/utils";

/** Self-view mirror (like FaceTime); remote peer is never mirrored. */
export function LocalConsultVideo({
  videoRef,
  visible,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  className?: string;
}) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        "h-full w-full object-cover -scale-x-100",
        !visible && "hidden",
        className,
      )}
    />
  );
}

/** Remote participant — full audio, natural (non-mirrored) orientation. */
export function RemoteConsultVideo({
  videoRef,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
}) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
