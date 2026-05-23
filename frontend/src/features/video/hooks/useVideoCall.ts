import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import type { ApiAppointment } from "@/lib/api/appointments";
import { apiClient } from "@/lib/api/client";
import { createVideoSession, endVideoSession } from "@/lib/api/appointments";
import { env } from "@/lib/env";
import {
  applyVideoTier,
  downgradeTier,
  evaluateNetwork,
  getMediaConstraints,
  resetNetworkStats,
  sampleNetwork,
  tierLabel,
  upgradeTier,
  type NetworkSample,
  type VideoMediaConfig,
  type VideoQualityTier,
} from "../lib/adaptive-media";

const E = {
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
  PEER_JOINED: "peer-joined",
  PEER_LEFT: "peer-left",
  MEDIA_STATE: "media-state",
  END_CALL: "end-call",
  CALL_ENDED: "call-ended",
  SESSION_ERROR: "session-error",
  FOLLOW_UP_SCHEDULED: "follow-up-scheduled",
} as const;

const STATS_INTERVAL_MS = 4000;
const SIGNALING_CONNECT_TIMEOUT_MS = 20_000;

async function attachLocalPreview(el: HTMLVideoElement | null, stream: MediaStream) {
  if (!el) return;
  el.srcObject = stream;
  el.muted = true;
  el.volume = 0;
  try {
    await el.play();
  } catch {
    /* local preview only */
  }
}

async function unlockBrowserAudio() {
  try {
    const ctx = new AudioContext();
    await ctx.resume();
    await ctx.close();
  } catch {
    /* optional unlock */
  }
}

async function attachRemotePeer(el: HTMLVideoElement | null, stream: MediaStream) {
  if (!el) return;
  stream.getAudioTracks().forEach((t) => {
    t.enabled = true;
  });
  stream.getVideoTracks().forEach((t) => {
    t.enabled = true;
  });
  if (el.srcObject !== stream) {
    el.srcObject = stream;
  }
  el.muted = false;
  el.defaultMuted = false;
  el.volume = 1;
  el.setAttribute("playsinline", "true");

  const tryPlay = async (attempt = 0) => {
    try {
      await el.play();
    } catch {
      if (attempt < 4) {
        window.setTimeout(() => void tryPlay(attempt + 1), 250 * (attempt + 1));
      }
    }
  };
  await tryPlay();
}

function ensureLocalAudioPublished(pc: RTCPeerConnection, stream: MediaStream, enabled: boolean) {
  stream.getAudioTracks().forEach((t) => {
    t.enabled = enabled;
  });
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind === "audio") {
      sender.track.enabled = enabled;
    }
  }
  for (const transceiver of pc.getTransceivers()) {
    if (transceiver.sender.track?.kind === "audio" || transceiver.receiver.track?.kind === "audio") {
      if (transceiver.direction === "inactive") {
        transceiver.direction = "sendrecv";
      }
    }
  }
}

function mergeRemoteTrack(remote: MediaStream, track: MediaStreamTrack): MediaStream {
  if (!remote.getTracks().some((t) => t.id === track.id)) {
    remote.addTrack(track);
  }
  track.enabled = true;
  return remote;
}

export type CallStatus =
  | "idle"
  | "joining"
  | "connecting"
  | "waiting"
  | "live"
  | "ended"
  | "error";

const DEFAULT_MEDIA_CONFIG: VideoMediaConfig = {
  ruralOptimized: true,
  defaultStartTier: "low",
  audioOnlyFallbackEnabled: true,
  adaptiveBitrate: true,
  minKbps: 120,
  maxKbps: 500,
  startKbps: 200,
  layers: [
    { tier: "low", label: "Low data (240p)", width: 320, height: 180, frameRate: 10, maxBitrateKbps: 120 },
    { tier: "medium", label: "Standard (360p)", width: 640, height: 360, frameRate: 15, maxBitrateKbps: 275 },
    { tier: "high", label: "HD", width: 1280, height: 720, frameRate: 24, maxBitrateKbps: 500 },
  ],
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

export function useVideoCall(appointmentId: string, role: "patient" | "doctor") {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(appointmentId);
  const mediaConfigRef = useRef<VideoMediaConfig>(DEFAULT_MEDIA_CONFIG);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableGoodPollsRef = useRef(0);
  const manualAudioOnlyRef = useRef(false);
  /** User turned camera off — adaptive tier changes must not re-enable video. */
  const manualVideoOffRef = useRef(false);
  const qualityTierRef = useRef<VideoQualityTier>("low");
  const audioOnRef = useRef(true);
  const downgradeCountRef = useRef(0);
  const cleanupRef = useRef<() => void>(() => {});

  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  audioOnRef.current = audioOn;
  const [videoOn, setVideoOn] = useState(true);
  const [peerAudioOn, setPeerAudioOn] = useState(true);
  const [peerVideoOn, setPeerVideoOn] = useState(true);
  const [peerQualityTier, setPeerQualityTier] = useState<VideoQualityTier | null>(null);
  const [qualityTier, setQualityTier] = useState<VideoQualityTier>("low");
  const [audioOnlyFallback, setAudioOnlyFallback] = useState(false);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<{
    patientId: string;
    doctorName: string;
    patientName: string;
    date: string;
    time: string;
    specialization: string;
    specialty: string;
  } | null>(null);
  const [turnEnabled, setTurnEnabled] = useState<boolean | null>(null);
  const [connectionHint, setConnectionHint] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkSample | null>(null);
  const [downgradeCount, setDowngradeCount] = useState(0);
  const [ruralOptimized, setRuralOptimized] = useState(true);
  const [scheduledFollowUp, setScheduledFollowUp] = useState<ApiAppointment | null>(null);
  const queryClient = useQueryClient();

  const stopAdaptiveMonitoring = useCallback(() => {
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    resetNetworkStats();
    stableGoodPollsRef.current = 0;
    setNetworkStats(null);
  }, []);

  const emitMediaState = useCallback(
    (audio: boolean, video: boolean) => {
      socketRef.current?.emit(E.MEDIA_STATE, {
        roomId: roomIdRef.current,
        audio,
        video,
        qualityTier: qualityTierRef.current,
        audioOnlyFallback: qualityTierRef.current === "audio-only",
      });
    },
    [],
  );

  const applyTier = useCallback(
    async (tier: VideoQualityTier, message?: string) => {
      const pc = pcRef.current;
      const stream = streamRef.current;
      if (!pc || !stream) return;

      qualityTierRef.current = tier;
      setQualityTier(tier);
      const isAudioOnly = tier === "audio-only";
      setAudioOnlyFallback(isAudioOnly);
      const videoActive = !isAudioOnly && !manualVideoOffRef.current;
      setVideoOn(videoActive);
      if (message) setAdaptiveMessage(message);

      await applyVideoTier(pc, stream, mediaConfigRef.current, tier, {
        videoEnabled: videoActive,
      });
      ensureLocalAudioPublished(pc, stream, audioOnRef.current);
      emitMediaState(audioOnRef.current, videoActive);
    },
    [audioOn, emitMediaState],
  );

  const startAdaptiveMonitoring = useCallback(() => {
    stopAdaptiveMonitoring();
    const cfg = mediaConfigRef.current;
    if (!cfg.adaptiveBitrate) return;

    statsTimerRef.current = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState !== "connected") return;

      try {
        const sample = await sampleNetwork(pc);
        setNetworkStats(sample);
        const current = qualityTierRef.current;
        const action = evaluateNetwork(sample, current, cfg);

        if (action === "audio-only" && current !== "audio-only" && !manualAudioOnlyRef.current) {
          downgradeCountRef.current += 1;
          setDowngradeCount(downgradeCountRef.current);
          manualAudioOnlyRef.current = false;
          await applyTier(
            "audio-only",
            "Weak connection — switched to audio so your consultation can continue.",
          );
          stableGoodPollsRef.current = 0;
          return;
        }

        if (action === "downgrade" && current !== "low" && current !== "audio-only") {
          const next = downgradeTier(current);
          if (next !== current) {
            downgradeCountRef.current += 1;
            setDowngradeCount(downgradeCountRef.current);
            await applyTier(next, `Network slow — reduced to ${tierLabel(next)} to prevent lag.`);
          }
          stableGoodPollsRef.current = 0;
          return;
        }

        if (action === "ok" && !manualAudioOnlyRef.current) {
          stableGoodPollsRef.current += 1;
          if (
            stableGoodPollsRef.current >= cfg.thresholds.upgradeStablePolls &&
            current !== "high" &&
            current !== "audio-only"
          ) {
            const next = upgradeTier(current);
            if (next !== current) {
              await applyTier(next, `Connection improved — ${tierLabel(next)} video.`);
              stableGoodPollsRef.current = 0;
            }
          }
        }
      } catch {
        /* stats unavailable */
      }
    }, STATS_INTERVAL_MS);
  }, [applyTier, stopAdaptiveMonitoring]);

  const cleanup = useCallback(() => {
    stopAdaptiveMonitoring();
    socketRef.current?.emit(E.LEAVE_ROOM);
    socketRef.current?.disconnect();
    socketRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) {
      remoteRef.current.srcObject = null;
      remoteRef.current.muted = false;
    }
    manualAudioOnlyRef.current = false;
    manualVideoOffRef.current = false;
    qualityTierRef.current = "low";
    setScheduledFollowUp(null);
  }, [stopAdaptiveMonitoring]);

  cleanupRef.current = cleanup;

  const switchToAudioOnly = useCallback(async () => {
    manualAudioOnlyRef.current = true;
    await applyTier("audio-only", "Audio-only mode — saves data and keeps the call stable.");
  }, [applyTier]);

  const tryRestoreVideo = useCallback(async () => {
    manualAudioOnlyRef.current = false;
    manualVideoOffRef.current = false;
    stableGoodPollsRef.current = 0;
    const start = mediaConfigRef.current.defaultStartTier;
    const tier = start === "audio-only" ? "low" : start;
    await applyTier(tier, "Restoring video at low resolution…");
  }, [applyTier]);

  const joinCall = useCallback(async () => {
    setStatus("joining");
    setError(null);
    setAdaptiveMessage(null);
    try {
      const [session, iceRes, mediaRes] = await Promise.all([
        createVideoSession(appointmentId),
        apiClient.get<{
          iceServers: RTCIceServer[];
          turnEnabled?: boolean;
          hint?: string;
        }>("/video/ice-servers"),
        apiClient.get<VideoMediaConfig>("/video/media-config").catch(() => ({
          data: DEFAULT_MEDIA_CONFIG,
        })),
      ]);

      mediaConfigRef.current = mediaRes.data ?? DEFAULT_MEDIA_CONFIG;
      setRuralOptimized(mediaConfigRef.current.ruralOptimized ?? true);
      downgradeCountRef.current = 0;
      setDowngradeCount(0);
      const startTier = mediaConfigRef.current.defaultStartTier;
      qualityTierRef.current = startTier === "audio-only" ? "low" : startTier;
      setQualityTier(qualityTierRef.current);

      roomIdRef.current = session.appointment.id;
      setAppointmentInfo({
        patientId: session.appointment.patientId,
        doctorName: session.appointment.doctorName,
        patientName: session.appointment.patientName ?? "Patient",
        date: session.appointment.date,
        time: session.appointment.time,
        specialization: session.appointment.specialization,
        specialty: session.appointment.specialty,
      });

      setTurnEnabled(iceRes.data.turnEnabled ?? false);
      setConnectionHint(iceRes.data.hint ?? null);

      await unlockBrowserAudio();

      const constraints = getMediaConstraints(mediaConfigRef.current, qualityTierRef.current);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (mediaErr) {
        if (qualityTierRef.current !== "audio-only") {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: mediaConfigRef.current.getUserMedia.audio,
            video: true,
          });
        } else {
          throw mediaErr;
        }
      }
      streamRef.current = stream;
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      if (localRef.current) {
        await attachLocalPreview(localRef.current, stream);
      }

      const pc = new RTCPeerConnection({
        iceServers: iceRes.data.iceServers,
        iceTransportPolicy: "all",
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      ensureLocalAudioPublished(pc, stream, true);
      await applyVideoTier(pc, stream, mediaConfigRef.current, qualityTierRef.current);

      setAdaptiveMessage(
        mediaConfigRef.current.ruralOptimized
          ? `Optimized for rural networks — starting at ${tierLabel(qualityTierRef.current)}.`
          : null,
      );

      if (env.videoDebug) {
        pc.oniceconnectionstatechange = () => {
          console.info("[webrtc] ice:", pc.iceConnectionState, "tier:", qualityTierRef.current);
        };
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          const local = streamRef.current;
          if (local) ensureLocalAudioPublished(pc, local, audioOnRef.current);
          startAdaptiveMonitoring();
          const remote = remoteStreamRef.current;
          if (remote && remoteRef.current) {
            void attachRemotePeer(remoteRef.current, remote);
          }
        }
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          stopAdaptiveMonitoring();
        }
      };

      pc.ontrack = (ev) => {
        const fromEvent = ev.streams[0];
        let remote = remoteStreamRef.current;
        if (!remote) {
          remote = fromEvent ?? new MediaStream();
          remoteStreamRef.current = remote;
        }
        if (fromEvent && fromEvent.id !== remote.id) {
          fromEvent.getTracks().forEach((t) => mergeRemoteTrack(remote!, t));
        } else {
          mergeRemoteTrack(remote, ev.track);
        }
        if (remoteRef.current) {
          void attachRemotePeer(remoteRef.current, remote);
        }
        setStatus("live");
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate && socketRef.current) {
          socketRef.current.emit(E.ICE_CANDIDATE, {
            roomId: roomIdRef.current,
            candidate: ev.candidate,
          });
        }
      };

      setStatus("connecting");

      const socket = io(env.videoServiceUrl, {
        path: env.videoSignalingPath,
        transports: ["websocket", "polling"],
        auth: { token: session.sessionToken },
        withCredentials: true,
      });
      socketRef.current = socket;

      const connectTimeout = window.setTimeout(() => {
        if (socket.connected) return;
        setError(
          `Could not reach video signaling at ${env.videoServiceUrl}. Check the backend is running and VITE_VIDEO_SERVICE_URL matches your API host.`,
        );
        setStatus("error");
        cleanup();
      }, SIGNALING_CONNECT_TIMEOUT_MS);

      socket.on("connect", () => {
        window.clearTimeout(connectTimeout);
        socket.emit(E.JOIN_ROOM, { roomId: roomIdRef.current });
        setStatus("waiting");
        emitMediaState(true, qualityTierRef.current !== "audio-only");
      });

      socket.on(E.SESSION_ERROR, (data: { message: string }) => {
        setError(data.message);
        setStatus("error");
        cleanup();
      });

      socket.on(E.PEER_JOINED, async (data: { existing?: boolean }) => {
        if (data.existing) return;
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          socket.emit(E.OFFER, { roomId: roomIdRef.current, sdp: offer });
        } catch {
          setError("Could not establish secure connection");
          setStatus("error");
        }
      });

      socket.on(E.OFFER, async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const local = streamRef.current;
        if (local) ensureLocalAudioPublished(pc, local, audioOnRef.current);
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(answer);
        socket.emit(E.ANSWER, { roomId: roomIdRef.current, sdp: answer });
      });

      socket.on(E.ANSWER, async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        setStatus("live");
      });

      socket.on(E.ICE_CANDIDATE, async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on(
        E.MEDIA_STATE,
        (data: {
          audio: boolean;
          video: boolean;
          qualityTier?: VideoQualityTier;
          audioOnlyFallback?: boolean;
        }) => {
          setPeerAudioOn(data.audio);
          setPeerVideoOn(data.video);
          if (data.qualityTier) setPeerQualityTier(data.qualityTier);
        },
      );

      socket.on(E.PEER_LEFT, () => setStatus("waiting"));

      socket.on(E.CALL_ENDED, () => {
        setStatus("ended");
        cleanup();
      });

      socket.on(E.FOLLOW_UP_SCHEDULED, (data: { appointment: ApiAppointment }) => {
        if (data?.appointment) {
          setScheduledFollowUp(data.appointment);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
        }
      });

      socket.on("connect_error", (err: Error) => {
        window.clearTimeout(connectTimeout);
        const detail = err?.message?.trim();
        setError(
          detail
            ? `Secure connection failed: ${detail}`
            : `Secure connection failed. Check backend at ${env.videoServiceUrl}.`,
        );
        setStatus("error");
        cleanup();
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Could not join consultation";
      setError(msg ?? "Could not join consultation");
      setStatus("error");
      cleanup();
    }
  }, [appointmentId, cleanup, emitMediaState, startAdaptiveMonitoring, stopAdaptiveMonitoring]);

  const endCall = useCallback(
    async (emrPayload?: {
      conclusion?: string;
      vitals?: {
        bloodPressureSystolic?: number;
        bloodPressureDiastolic?: number;
        sugarLevel?: number;
        oxygenLevel?: number;
      };
    }) => {
      socketRef.current?.emit(E.END_CALL, { roomId: roomIdRef.current });
      cleanup();
      setStatus("ended");
      try {
        await endVideoSession(appointmentId, emrPayload);
      } catch {
        /* session may already be ended */
      }
    },
    [appointmentId, cleanup],
  );

  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    setAudioOn(next);
    const stream = streamRef.current;
    const pc = pcRef.current;
    if (stream && pc) {
      ensureLocalAudioPublished(pc, stream, next);
    }
    emitMediaState(next, videoOn);
  }, [audioOn, videoOn, emitMediaState]);

  const toggleVideo = useCallback(async () => {
    if (qualityTierRef.current === "audio-only") {
      manualVideoOffRef.current = false;
      await tryRestoreVideo();
      return;
    }
    const next = !videoOn;
    manualVideoOffRef.current = !next;
    setVideoOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    pcRef.current
      ?.getSenders()
      .filter((s) => s.track?.kind === "video")
      .forEach((s) => {
        if (s.track) s.track.enabled = next;
      });
    emitMediaState(audioOnRef.current, next);
  }, [videoOn, emitMediaState, tryRestoreVideo]);

  // Re-bind remote stream when UI mounts or connection goes live (fixes silent remote audio).
  useEffect(() => {
    if (status !== "live" && status !== "waiting" && status !== "connecting") return;
    const remote = remoteStreamRef.current;
    const el = remoteRef.current;
    if (remote && remote.getTracks().length > 0 && el) {
      void attachRemotePeer(el, remote);
    }
  }, [status]);

  // Only tear down WebRTC when leaving the page — not on every status transition.
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);

  return {
    localRef,
    remoteRef,
    status,
    error,
    audioOn,
    videoOn,
    peerAudioOn,
    peerVideoOn,
    peerQualityTier,
    qualityTier,
    audioOnlyFallback,
    adaptiveMessage,
    appointmentInfo,
    turnEnabled,
    connectionHint,
    networkStats,
    downgradeCount,
    ruralOptimized,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
    switchToAudioOnly,
    tryRestoreVideo,
    scheduledFollowUp,
    setScheduledFollowUp,
  };
}
