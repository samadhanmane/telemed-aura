# Telemed Aura — Project Structure

```
telemed-aura/
├── frontend/
│   ├── .env              # frontend only (VITE_*)
│   └── .env.example
├── backend/
│   ├── .env              # backend only (API, SMTP, AI, video, AWS)
│   └── .env.example
│   ├── src/              # Main API :4000
│   └── services/         # email :4001, ai :4002, video :4003
└── STRUCTURE.md
```

## Environment

| File | Used by |
|------|---------|
| `frontend/.env` | Vite — browser-safe `VITE_*` vars |
| `backend/.env` | API + email + ai + video services |

Copy each `.env.example` to `.env` in the same folder. Keep URLs in sync:

- `frontend`: `VITE_API_URL` → backend API
- `backend`: `FRONTEND_URL` → frontend origin (CORS)

See `backend/docs/ENV.md` for AWS deployment.
