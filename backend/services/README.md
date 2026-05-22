# Backend Services

Standalone services invoked by `src/` API or run independently.

| Service | Port | Path |
|---------|------|------|
| Email (Nodemailer) | 4001 | `services/email/` |
| AI (scanner, triage) | 4002 | `services/ai/` |
| Video (WebRTC signaling) | 4003 | `services/video/` |

Each service reads **`backend/.env`** (no per-service env files).
