# Video consultations (WebRTC)

Rural-optimized telehealth calls on the main API (`/signaling` + `/api/v1/video/*`).

## Low-bandwidth design

1. **Start low** — default 240p (`VIDEO_START_TIER=low`) to save data in villages.
2. **Adaptive bitrate** — `RTCRtpSender.setParameters({ maxBitrate })` per tier.
3. **Dynamic resolution** — `applyConstraints` on the camera track (320×180 → 640×360 → 720p).
4. **Audio-first fallback** — on high packet loss / RTT, video stops but audio continues.
5. **Manual controls** — "Audio only" / "Try video" in the consult header.

Quality ladder is served from `GET /api/v1/video/media-config`.

## Debug

Set `VITE_VIDEO_DEBUG=true` in `frontend/.env` for ICE connection logs.
