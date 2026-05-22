# Telemed Aura — Full Stack Implementation Plan

**Scope now:** Auth (JWT), MongoDB, email (Nodemailer), doctor registration, category booking, video consult (low bandwidth).  
**Later:** AI symptom scanner / triage service.

---

## Phase 1 — Backend foundation

| # | Task | Details |
|---|------|---------|
| 1.1 | MongoDB models | `User`, `DoctorProfile`, `Appointment`, `Notification` |
| 1.2 | Specialties | psychology, dermatology, physiotherapy, cardiology, general, pediatrics, gynecology, neurology |
| 1.3 | JWT auth | register/login, bcrypt passwords, `Authorization: Bearer` middleware |
| 1.4 | Patient signup | name, email, password, phone |
| 1.5 | Doctor signup | + specialty, license, experience, fee, phone |
| 1.6 | Mail service | `EMAIL` + `EMAIL_PASSWORD` → Gmail SMTP, appointment/confirm emails |

## Phase 2 — Appointments

| # | Task | Details |
|---|------|---------|
| 2.1 | List doctors | filter by `specialty`, verified doctors only |
| 2.2 | Time slots | date → available slots (9:00–17:00, 30 min), exclude booked |
| 2.3 | Book appointment | patient + doctor + datetime + specialty + status `pending` |
| 2.4 | Email on book | patient + doctor receive Nodemailer notification |
| 2.5 | Doctor actions | confirm / cancel → update DB + email |

## Phase 3 — Frontend (no mocks)

| # | Task | Details |
|---|------|---------|
| 3.1 | `frontend/.env` | `VITE_API_URL`, video URLs |
| 3.2 | API client | JWT on axios, auth/doctors/appointments APIs |
| 3.3 | Login / register | real API; remove demo/mock auth |
| 3.4 | Doctor registration form | extended fields + specialty select |
| 3.5 | Patient booking UI | category → doctor → date → time → confirm |
| 3.6 | Dashboards | fetch real appointments, prescriptions placeholder from API |

## Phase 4 — Video consult

| # | Task | Details |
|---|------|---------|
| 4.1 | Room API | create/join token per appointment |
| 4.2 | Socket signaling | offer/answer/ICE (port 4003 or embedded) |
| 4.3 | Consult page | mirrored local video, adaptive bitrate, audio-first fallback |
| 4.4 | Join from appointment | “Join consultation” when status `confirmed` |

## Phase 5 — Polish (post-MVP)

- Admin approval for doctors  
- Prescriptions & reports upload to S3  
- AI services hook into booking priority  
- AWS deploy (ECS, ALB, env per `docs/ENV.md`)

---

## API contract (v1)

```
POST   /api/v1/auth/register          { role, name, email, password, ...doctorFields }
POST   /api/v1/auth/login             { email, password }
GET    /api/v1/auth/me                (JWT)

GET    /api/v1/doctors                ?specialty=dermatology
GET    /api/v1/doctors/:id/slots      ?date=2026-05-22

POST   /api/v1/appointments           { doctorId, date, time, specialty }
GET    /api/v1/appointments           (role-filtered)
PATCH  /api/v1/appointments/:id       { status }

POST   /api/v1/video/rooms/:appointmentId/token   (JWT)
```

---

## Env coordination

| Backend `backend/.env` | Frontend `frontend/.env` |
|------------------------|---------------------------|
| `MONGODB_URI`, `MONGODB_DB_NAME=netmetaura` | `VITE_API_URL=http://localhost:4000/api/v1` |
| `JWT_SECRET` | `VITE_VIDEO_SERVICE_URL=http://localhost:4003` |
| `EMAIL`, `EMAIL_PASSWORD` | `VITE_APP_URL=http://localhost:5173` |
| `FRONTEND_URL=http://localhost:5173` | |

---

## File map (new/updated)

```
backend/src/database/models/
backend/src/modules/auth/          (full JWT)
backend/src/modules/doctors/
backend/src/services/mail.service.ts
backend/src/constants/specialties.ts

frontend/src/lib/api/
frontend/src/features/video/
frontend/src/routes/register.tsx, login.tsx
frontend/src/routes/patient.* (API wired)
```

**Current sprint:** Phase 1 → 2 → 3 core, then Phase 4 video MVP.
