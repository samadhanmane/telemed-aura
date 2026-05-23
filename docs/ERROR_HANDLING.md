# Error handling & validation (Telemed Aura)

## API response format

**Success**

```json
{ "success": true, "message": "Login successful", "data": { ... } }
```

**Error**

```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": [{ "field": "email", "message": "..." }],
  "code": "VALIDATION_ERROR"
}
```

Legacy `{ "error": "..." }` responses are still parsed by the frontend during migration.

## Backend

| Piece | Path |
|-------|------|
| `AppError` | `backend/src/shared/errors/app-error.ts` |
| `asyncHandler` | `backend/src/shared/utils/async-handler.ts` |
| `sendSuccess` / `sendError` | `backend/src/shared/utils/response.ts` |
| Central error middleware | `backend/src/shared/middleware/error-handler.ts` |
| Zod route validation | `backend/src/shared/middleware/validate.middleware.ts` |
| Auth schemas | `backend/src/shared/validations/auth.schemas.ts` |
| Appointment schemas | `backend/src/shared/validations/appointment.schemas.ts` |
| Rate limits | `backend/src/shared/middleware/rate-limit.middleware.ts` |
| NoSQL sanitize | `express-mongo-sanitize` in `app.ts` |

Routes using the standardized format: **`/auth/*`**, **`/appointments/*`**, **`/doctors/*`**, **`/clinical/*`**, **`/ai/*`**, **`/emr/*`**, **`/dashboard/*`**, **`/notifications/*`**, **`/reviews/*`**, **`/files/download`** (errors only; success is binary stream).

**Legacy JSON shape:** `GET /video/ice-servers`, `GET /video/media-config`, `GET /health` (monitoring).

## Frontend

| Piece | Path |
|-------|------|
| Axios client + 401 logout | `frontend/src/lib/api/client.ts` |
| `unwrapApiData` / `getApiErrorMessage` | same |
| Form Zod schemas | `frontend/src/lib/validation/forms.ts` |
| Toast helpers | `frontend/src/lib/api/toast.ts` |
| List loading/empty/error UI | `frontend/src/components/common/ListStates.tsx` |
| Global toasts | `<Toaster />` in `frontend/src/routes/__root.tsx` |

## Manual QA

See `docs/MANUAL_TEST_CASES.md` — auth, booking, and API error sections align with these messages.
