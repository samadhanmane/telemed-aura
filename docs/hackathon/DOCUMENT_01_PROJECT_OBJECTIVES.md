# DOCUMENT 1 — Coverage of Project Objectives (10 Marks)

**Project Title:** AI-Enabled Telehealth & Patient Data System  
**Product Name:** Telemed Aura  
**Repository:** `samadhanmane/telemed-aura` (branch: `testcase` includes latest validation/docs)  
**Version:** 0.1.0

---

## 1. Project Overview

Telemed Aura is a full-stack **AI-enabled telehealth and patient data platform** for connecting rural and semi-urban patients with verified doctors. The system is implemented as a monorepo:

| Layer | Path | Stack |
|-------|------|-------|
| Frontend | `frontend/` | React 19, Vite 7, TanStack Router/Start, Tailwind 4, shadcn/ui, Zustand, React Query, Socket.IO client, i18next (en/hi) |
| Backend | `backend/` | Node.js, Express 4, TypeScript, Mongoose, JWT, Socket.IO signaling, Zod validation |
| AI services | `backend/services/ai/` | Gemini, Tesseract, pdf-parse, rule-based severity engines |
| Data | MongoDB | 16 Mongoose collections (User, Appointment, MedicalReport, etc.) |
| Files | Cloudinary | Reports, certificates, prescriptions |
| Email | Nodemailer | Booking, OTP, AI alerts |

**Roles:** `patient`, `doctor`, `admin`  
**API base:** `/api/v1`  
**Health:** `GET /health`

**Assumption:** Marketing statistics on the landing page (`index.tsx`: “120k+ consultations”) are illustrative UI copy unless backed by live analytics APIs.

---

## 2. Problem Statement

Rural healthcare in India and similar regions faces:

1. **Access** — Long travel to specialists; limited local clinicians.
2. **Connectivity** — Poor mobile bandwidth unsuitable for default HD video apps.
3. **Records** — Paper labs and prescriptions are lost between visits.
4. **Triage delay** — Urgent vs mild symptoms are not prioritized before human review.
5. **Trust** — Unverified online providers create safety risk.

Telemed Aura addresses these with **verified doctors**, **adaptive video**, **centralized EMR**, **rules-first AI triage**, and **admin-gated onboarding**.

---

## 3. Main Objectives

| ID | Objective | Evidence in codebase |
|----|-----------|----------------------|
| O1 | Secure multi-role telehealth | JWT (`auth.middleware.ts`), RBAC on all protected routes |
| O2 | AI-assisted screening (not diagnosis) | `POST /ai/symptom-scan`, `symptom-triage.rules.ts` |
| O3 | Digitized longitudinal health data | EMR (`emr.service.ts`), reports, vitals, consultations |
| O4 | Video consultation for remote care | WebRTC + Socket.IO `/signaling`, `useVideoCall.ts` |
| O5 | Doctor verification & governance | `verificationStatus`, admin approve/reject |
| O6 | Multilingual access | `react-i18next`, `Accept-Language`, AI `translator.ts` |
| O7 | User notifications | `Notification` model, email templates |
| O8 | Production-grade errors & validation | `AppError`, Zod schemas, `{ success, message, data }` API format |

---

## 4. Functional Objectives

| ID | Objective | Implementation |
|----|-----------|----------------|
| FO-1 | Patient registration/login | `POST /auth/register`, `POST /auth/login`, `/register`, `/login` |
| FO-2 | Doctor registration + certificate | `POST /auth/register/doctor`, Cloudinary upload, pending status |
| FO-3 | Password reset (OTP) | `POST /auth/forgot-password/*`, `PasswordResetOtp` model |
| FO-4 | Browse/book doctors (video) | `GET /doctors`, `GET /doctors/:id/slots`, `POST /appointments` |
| FO-5 | Appointment lifecycle | `pending` → `confirmed` → `in_progress` → `completed` / `cancelled` |
| FO-6 | Video consult with leave/rejoin | `video-session`, `leaveVideoSession`; complete via doctor only |
| FO-7 | AI symptom scanner | `POST /ai/symptom-scan`, `SymptomScan` |
| FO-8 | Medical report upload + AI pipeline | `POST /clinical/reports` (multipart), 6-layer pipeline |
| FO-9 | Doc Assistant (RAG chat) | `POST /ai/documents/upload`, `POST /ai/document-chat` |
| FO-10 | Digital prescriptions | Doctor: `POST /clinical/patients/:id/prescriptions`; patient lists |
| FO-11 | Patient EMR + doctor view | `/emr/me`, `/emr/patients/:patientId` (consult history required) |
| FO-12 | Critical care / triage | Triage queue, critical alerts, urgent booking |
| FO-13 | Post-consult reviews | `POST /reviews` (completed appointments only) |
| FO-14 | Secure file download | `GET /files/download` (Cloudinary allowlist) |
| FO-15 | Dashboards per role | `/dashboard/patient|doctor|admin` |
| FO-16 | Admin doctor approval | `PATCH /dashboard/admin/doctors/:id/approve|reject` |
| FO-17 | Doctor availability (30-min slots) | `PUT /doctors/me/availability`, `buildAppointmentSlotTimes()` |
| FO-18 | Standard API error responses | `sendSuccess` / `sendError`, frontend `getApiErrorMessage()` |

**Not implemented:** Payment gateway (Stripe/Razorpay); `Appointment.fee` is `0`. `appointments/booking` routes return **501 Not implemented**.

---

## 5. Non-Functional Objectives

| ID | Objective | Implementation |
|----|-----------|----------------|
| NFO-1 | Security | Helmet, CORS allowlist, bcrypt, JWT, `express-mongo-sanitize`, rate limits |
| NFO-2 | Performance | Adaptive video tiers (`adaptive-media.ts`), Gemini cost guards |
| NFO-3 | Reliability | `/health` with DB status; AI fallbacks when Gemini unavailable |
| NFO-4 | Usability | Sonner toasts, empty/loading/error states (`ListStates.tsx`) |
| NFO-5 | Maintainability | Modular `modules/*`, shared `services/ai/*` |
| NFO-6 | i18n | English + Hindi UI and localized AI answers |
| NFO-7 | Deployability | `frontend/.env.example`, Vercel + Render documented |

---

## 6. Alignment with Project Goals

| Hackathon goal | How objectives deliver |
|----------------|------------------------|
| AI-enabled telehealth | Symptom scan, report pipeline, Doc Assistant RAG |
| Patient data system | EMR, reports, vitals, snapshots, consultation records |
| Rural focus | Hindi UI, low-bandwidth video, 30-min slots across availability window |
| Trust & safety | Admin verification; rules-first severity; doctor report review |

---

## 7. Justification of Each Objective

**O1 — Security:** Health data requires JWT and role guards; generic login errors prevent account enumeration (`Invalid email or password`).

**O2 — AI screening:** Rules in `symptom-triage.rules.ts` calibrate severity; Gemini enriches narrative without overriding rule-based `severity`.

**O3 — EMR:** `buildPatientEmrData()` aggregates consultations, prescriptions, reports, scans for continuity of care.

**O4 — Video:** Signaling on same port as API (`backend/src/index.ts`) simplifies deployment; adaptive bitrate supports rural networks.

**O5 — Verification:** Doctors cannot practice until `verificationStatus === "approved"`; login returns `REGISTRATION_PENDING` code.

**O6 — i18n:** Rural users benefit from Hindi UI (`hi.json`) and localized AI via `localeFromRequest()`.

**O7 — Notifications:** `Notification.insertMany` on booking; email via `mail.service.ts` when SMTP configured.

**O8 — Error handling:** Standard `{ success, message, errors[] }` improves demo quality and QA traceability.

---

## 8. Expected Outcomes

1. Patients book video visits, run symptom scans, upload reports, and maintain a portable EMR.
2. Doctors manage schedules, conduct consultations, prescribe, and review AI-assisted reports.
3. Admins approve doctors and monitor AI-flagged activity.
4. Platform stores structured artifacts in MongoDB and files in Cloudinary.

---

## 9. Benefits to Rural Healthcare Users

| Benefit | Feature |
|---------|---------|
| No travel for routine consults | Video appointments |
| Lower data usage | Adaptive video + audio-oriented fallback |
| Hindi support | `LanguageSwitcher`, localized AI |
| Specialist access | 10 specialties (`constants/specialties.ts`) |
| Continuity | EMR timeline, consultation records |
| Faster escalation | `CriticalCareAlert` after high-risk scans |
| Clear errors | Friendly messages (no raw Mongo/JWT errors) |

---

## 10. Coverage Matrix: Objective → Module → Implementation

| Objective | Module | Key paths / APIs |
|-----------|--------|------------------|
| O1 | Authentication | `modules/auth/`, `lib/auth/guards.ts` |
| O2 | AI Symptom | `services/ai/core/symptom-analyzer.ts`, `POST /ai/symptom-scan` |
| O3 | EMR | `modules/emr/emr.service.ts`, `routes/patient.emr.tsx` |
| O4 | Video | `features/video/`, `signaling/`, `POST .../video-session` |
| O5 | Admin | `dashboardController.approveDoctor`, `admin.doctors.tsx` |
| FO-4 | Appointments | `appointments.service.ts`, `patient.doctors.tsx` |
| FO-8 | Reports AI | `services/ai/pipeline/`, `POST /clinical/reports` |
| FO-9 | Doc Assistant | `doc-assistant/`, `patient.doc-assistant.tsx` |
| FO-14 | Files | `files.controller.ts`, `DownloadFileButton.tsx` |
| NFO-1 | Security middleware | `helmet`, `mongo-sanitize`, `authRateLimiter` |

---

## Assumptions & Limitations

1. No online payments; fees are zero.
2. No native mobile apps (web only).
3. No FHIR/HL7 export.
4. Organizational HIPAA compliance is outside code scope.
5. Automated unit/E2E tests are not in `package.json` (manual QA documented separately).

---

*End of Document 1*
