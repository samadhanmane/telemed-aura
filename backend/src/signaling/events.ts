export const SIGNALING_EVENTS = {
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
