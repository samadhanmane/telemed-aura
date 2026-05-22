# Video consult (frontend)

Integrates with `backend/services/video/` signaling.

Configure `frontend/.env`: `VITE_VIDEO_SERVICE_URL`, `VITE_VIDEO_SIGNALING_PATH`.

Planned components:

- `components/LocalVideo.tsx` — mirrored self view (`scaleX(-1)`)
- `components/RemoteVideo.tsx` — doctor/patient remote stream
- `hooks/useWebRTC.ts` — offer/answer/ICE via Socket.IO
- `hooks/useAdaptiveBitrate.ts` — applies ladder from API
- `pages/ConsultRoomPage.tsx` — join by appointment token

Low bandwidth: start audio-only fallback, reduce resolution via `RTCRtpSender.setParameters`.
