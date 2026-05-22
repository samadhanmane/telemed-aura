import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { apiClient } from "@/lib/api/client";
import { createVideoSession, endVideoSession } from "@/lib/api/appointments";
import { env } from "@/lib/env";

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
} as const;

const MEDIA = {
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 360, max: 720 },
    frameRate: { ideal: 15, max: 24 },
    facingMode: "user",
  },
};

export type CallStatus =
  | "idle"
  | "joining"
  | "connecting"
  | "waiting"
  | "live"
  | "ended"
  | "error";

export function useVideoCall(appointmentId: string, role: "patient" | "doctor") {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(appointmentId);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [peerAudioOn, setPeerAudioOn] = useState(true);
  const [peerVideoOn, setPeerVideoOn] = useState(true);
  const [appointmentInfo, setAppointmentInfo] = useState<{
    doctorName: string;
    patientName: string;
    date: string;
    time: string;
    specialization: string;
  } | null>(null);

  const cleanup = useCallback(() => {
    socketRef.current?.emit(E.LEAVE_ROOM);
    socketRef.current?.disconnect();
    socketRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }, []);

  const joinCall = useCallback(async () => {
    setStatus("joining");
    setError(null);
    try {
      const session = await createVideoSession(appointmentId);
      roomIdRef.current = session.appointment.id;
      setAppointmentInfo({
        doctorName: session.appointment.doctorName,
        patientName: session.appointment.patientName ?? "Patient",
        date: session.appointment.date,
        time: session.appointment.time,
        specialization: session.appointment.specialization,
      });

      const { data: iceData } = await apiClient.get<{ iceServers: RTCIceServer[] }>(
        "/video/ice-servers",
      );

      const stream = await navigator.mediaDevices.getUserMedia(MEDIA);
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
        localRef.current.muted = true;
      }

      const pc = new RTCPeerConnection({ iceServers: iceData.iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (ev) => {
        if (remoteRef.current && ev.streams[0]) {
          remoteRef.current.srcObject = ev.streams[0];
          setStatus("live");
        }
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
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit(E.JOIN_ROOM, { roomId: roomIdRef.current });
        setStatus("waiting");
        socket.emit(E.MEDIA_STATE, {
          roomId: roomIdRef.current,
          audio: true,
          video: true,
        });
      });

      socket.on(E.SESSION_ERROR, (data: { message: string }) => {
        setError(data.message);
        setStatus("error");
        cleanup();
      });

      socket.on(E.PEER_JOINED, async (data: { existing?: boolean }) => {
        if (data.existing) return;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit(E.OFFER, { roomId: roomIdRef.current, sdp: offer });
        } catch {
          setError("Could not establish secure connection");
          setStatus("error");
        }
      });

      socket.on(E.OFFER, async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
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
        (data: { audio: boolean; video: boolean }) => {
          setPeerAudioOn(data.audio);
          setPeerVideoOn(data.video);
        },
      );

      socket.on(E.PEER_LEFT, () => setStatus("waiting"));

      socket.on(E.CALL_ENDED, () => {
        setStatus("ended");
        cleanup();
      });

      socket.on("connect_error", () => {
        setError("Secure connection failed. Check backend is running.");
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
  }, [appointmentId, cleanup]);

  const endCall = useCallback(async () => {
    socketRef.current?.emit(E.END_CALL, { roomId: roomIdRef.current });
    cleanup();
    setStatus("ended");
    try {
      await endVideoSession(appointmentId);
    } catch {
      /* session may already be ended */
    }
  }, [appointmentId, cleanup]);

  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    setAudioOn(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    socketRef.current?.emit(E.MEDIA_STATE, {
      roomId: roomIdRef.current,
      audio: next,
      video: videoOn,
    });
  }, [audioOn, videoOn]);

  const toggleVideo = useCallback(() => {
    const next = !videoOn;
    setVideoOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    socketRef.current?.emit(E.MEDIA_STATE, {
      roomId: roomIdRef.current,
      audio: audioOn,
      video: next,
    });
  }, [audioOn, videoOn]);

  useEffect(() => {
    return () => {
      if (status !== "idle" && status !== "ended") {
        cleanup();
      }
    };
  }, [cleanup, status]);

  return {
    localRef,
    remoteRef,
    status,
    error,
    audioOn,
    videoOn,
    peerAudioOn,
    peerVideoOn,
    appointmentInfo,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
