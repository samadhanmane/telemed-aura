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
