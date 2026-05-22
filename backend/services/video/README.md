# Video Consultation Service

Secure telehealth video for **low-bandwidth rural** networks.

## Goals

- **Mirrored local preview** (patient sees self naturally) — handled in frontend `media/mirror`
- **Clear audio** — Opus, echo cancellation hints via constraints
- **Adaptive quality** — simulcast / bitrate caps in `media/adaptive`
- **End-to-end signaling** — Socket.IO `signaling/`
- **TURN/STUN** — `config/ice-servers` for NAT traversal in villages
- **Room per appointment** — `rooms/`
- **E2E security** — DTLS-SRTP (WebRTC default) + token-gated join `security/`

## Run

`npm run video:dev` — default port **4003** (HTTP) + WebSocket signaling
