# Environment variables

## Backend — `backend/.env`

Used by:

- `npm run dev` (main API)
- `npm run email:dev` / `ai:dev` / `video:dev`

All services read the **same** `backend/.env` via `src/config/env.ts`.

## Frontend — `frontend/.env`

Only variables prefixed with `VITE_` are available in the app (`src/lib/env.ts`).

## MongoDB

```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB_NAME=netmetaura
```

The app connects to database **`netmetaura`** on startup (`src/database/connection.ts`).

### `querySrv ECONNREFUSED` on another laptop

This means **DNS could not resolve** the Atlas SRV host (`_mongodb._tcp.cluster….mongodb.net`). It is not fixed by `npm install` or `npm audit fix`.

**Option A — Atlas standard URI (best on restricted networks)**

1. [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect** → **Drivers**.
2. Copy the connection string and choose **Standard** (not SRV), e.g.  
   `mongodb://USER:PASS@ac-xxxxx.mongodb.net:27017/?retryWrites=true&w=majority`
3. In `backend/.env`:
   ```bash
   MONGODB_URI=mongodb://USER:PASS@ac-xxxxx.mongodb.net:27017/?retryWrites=true&w=majority
   MONGODB_DB_NAME=netmetaura
   ```
4. **Network Access** → add the laptop’s public IP (or `0.0.0.0/0` for dev only).

**Option B — Local MongoDB (no Atlas)**

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) or run:  
   `docker run -d -p 27017:27017 --name telemed-mongo mongo:7`
2. In `backend/.env`:
   ```bash
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB_NAME=netmetaura
   ```
3. Seed admin if needed: `npm run seed` (from `backend/`).

**Option C — Fix DNS on Windows**

- Use DNS `8.8.8.8` or `1.1.1.1`, disable VPN, retry.
- Test: `nslookup _mongodb._tcp.cluster0.k9oca.mongodb.net`

Copy `backend/.env` from a working machine (never commit it). Ensure `JWT_SECRET`, `GEMINI_API_KEY`, and Cloudinary keys are set for full features.

## Local development

```bash
# backend/.env
FRONTEND_URL=http://localhost:5173
PORT=4000
MONGODB_DB_NAME=netmetaura

# frontend/.env
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_URL=http://localhost:5173
VITE_VIDEO_SERVICE_URL=http://localhost:4003
```

## AWS deployment

| Where | Backend | Frontend |
|-------|---------|----------|
| ECS / Elastic Beanstalk | Task env from `backend/.env` keys | Build-time `VITE_*` in CI |
| Amplify / S3+CloudFront | — | Environment variables in console |
| Secrets Manager | `SMTP_PASS`, `JWT_SECRET`, `DATABASE_URL` | — |

Production example:

- `FRONTEND_URL=https://app.yourdomain.com`
- `VITE_API_URL=https://api.yourdomain.com/api/v1`
- `VITE_VIDEO_SERVICE_URL=https://api.yourdomain.com` (same host as API — signaling is on `/signaling`)

WebSocket path `/signaling` must be enabled on your load balancer alongside `/api/v1`.

## AI services (monolith + optional microservice)

The main API embeds AI logic from `backend/services/ai/core` (symptom scan, triage, vitals risk, report OCR, prescription OCR).

```bash
# Optional — richer report summaries via Gemini
GEMINI_API_KEY=
AI_API_KEY=          # alias for GEMINI_API_KEY
AI_MODEL=gemini-2.0-flash

# Standalone AI microservice (optional)
AI_SERVICE_URL=http://localhost:4002
AI_PORT=4002
npm run ai:dev
```

### Cloudinary (file storage)

Medical PDFs and prescription images are uploaded to **Cloudinary**, then AI downloads from the Cloudinary URL for OCR/analysis. MongoDB stores metadata + `fileUrl` + `cloudinaryPublicId` + AI results — not the binary file.

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

| Endpoint | Flow |
|----------|------|
| `POST /api/v1/clinical/reports` (file) | Cloudinary → fetch → AI report analysis → `MedicalReport` |
| `POST /api/v1/ai/prescription-ocr/file` | Cloudinary → fetch → OCR → `PrescriptionUpload` |
| `GET /api/v1/ai/prescription-uploads` | List saved prescription images for patient |

Limits: reports 10MB, prescriptions 8MB. Formats: PDF, PNG, JPG.

## WebRTC / TURN (production)

Video calls use **Socket.io signaling** on the main API (`/signaling`) and ICE servers from `GET /api/v1/video/ice-servers`.

**STUN alone is not enough** for many rural/mobile NAT networks. Configure TURN in `backend/.env`:

```bash
STUN_URL=stun:stun.l.google.com:19302
TURN_URL=turn:your-turn.example.com:3478?transport=udp,turn:your-turn.example.com:3478?transport=tcp
TURN_USERNAME=your-turn-user
TURN_CREDENTIAL=your-turn-secret
```

`TURN_URL` and `TURN_URLS` accept comma-separated relay URLs. All three TURN fields must be set or TURN is skipped.

### Self-hosted coturn (example)

```bash
# Ubuntu — install coturn, edit /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=telemed:YOUR_STRONG_SECRET
realm=telemed.example.com
```

Then set `TURN_URL=turn:YOUR_PUBLIC_IP:3478`, `TURN_USERNAME=telemed`, `TURN_CREDENTIAL=YOUR_STRONG_SECRET`.

Open UDP/TCP **3478** (and TLS 5349 if used) on your firewall. On AWS, use an Elastic IP on EC2 or a managed TURN provider.

Frontend shows a warning during calls when TURN is not configured. Set `VITE_VIDEO_DEBUG=true` to log ICE state in the browser console.

## Low-bandwidth video (rural)

Consultations use **WebRTC adaptive quality** (not a separate Jitsi/LiveKit server):

| Network | Behavior |
|---------|----------|
| Good | Upgrades toward HD (capped by `VIDEO_MAX_BITRATE_KBPS`) |
| Weak | Steps down 360p → 240p |
| Very weak | **Audio-only** — call continues without disconnecting |

```bash
VIDEO_MIN_BITRATE_KBPS=120
VIDEO_MAX_BITRATE_KBPS=500
VIDEO_START_TIER=low          # low | medium | high
VIDEO_AUDIO_FALLBACK=true
```

Client loads `GET /api/v1/video/media-config` and applies `RTCRtpSender.setParameters` + `applyConstraints` every ~4s based on packet loss and RTT.

During a call, users see quality badge (240p / 360p / HD / Audio only) and can manually switch to audio or retry video.
