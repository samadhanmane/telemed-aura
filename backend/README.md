# Telemed Aura — Backend

Monorepo-style backend for AI Rural Telehealth.

## Structure

| Path | Purpose |
|------|---------|
| `src/` | Main API (auth, users, appointments, booking) |
| `services/email/` | Nodemailer — notifications to patients & doctors |
| `services/ai/` | Symptom scanner, triage, severity scoring |
| `services/video/` | WebRTC telehealth — signaling, low-bandwidth media |

## Scripts

- `npm run dev` — Main API
- `npm run email:dev` — Email service only
- `npm run ai:dev` — AI service only
- `npm run video:dev` — Video / signaling service

## Environment

Use **`backend/.env` only** (not repo root). Copy `backend/.env.example` → `backend/.env`.

Frontend has its own **`frontend/.env`** with `VITE_*` variables. See `docs/ENV.md`.
