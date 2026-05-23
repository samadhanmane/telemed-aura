# DOCUMENT 2 — Coverage of Project Modules (15 Marks)

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                                 │
│  TanStack Router │ React │ shadcn/ui │ i18n │ Socket.IO │ Axios         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express :4000)                            │
│  /api/v1/auth │ doctors │ appointments │ clinical │ ai │ emr │ ...    │
│  /signaling (Socket.IO WebRTC) │ /health                                 │
└───────┬─────────────────┬──────────────────┬──────────────────────────┘
        │                 │                  │
        ▼                 ▼                  ▼
   MongoDB Atlas    Cloudinary CDN      Gmail SMTP
   (Mongoose)       (uploads)           (Nodemailer)
        │
        ▼
   Google Gemini API (vision, synthesis, RAG, symptom)
```

---

## Module Catalog

### M1 — Authentication & Identity

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Register, login, profile, password reset, doctor onboarding |
| **Features** | Patient/doctor/admin roles; JWT; doctor certificate upload; OTP reset |
| **Input** | Email, password, profile fields, multipart certificate |
| **Output** | JWT token, user payload, specialty list |
| **Workflow** | Register → hash password → (doctor: pending) → login → JWT in `localStorage` |
| **Technology** | Express, bcryptjs, jsonwebtoken, multer, Cloudinary |
| **API Endpoints** | `GET /auth/specialties`, `POST /auth/register`, `POST /auth/register/doctor`, `POST /auth/login`, `POST /auth/forgot-password/*`, `GET /auth/me`, `PATCH /auth/me/profile` |
| **Database** | `User`, `DoctorProfile`, `PasswordResetOtp` |
| **UI** | `login.tsx`, `register.tsx`, `forgot-password.tsx`, `SpecialtyCategoryPicker.tsx` |
| **Dependencies** | Cloudinary (doctor cert), mail (OTP) |
| **Security** | Password hash not returned; doctor blocked until approved |
| **Integrations** | All modules via `requireAuth` |

---

### M2 — Doctor Directory & Availability

| Attribute | Detail |
|-----------|--------|
| **Purpose** | List verified doctors, compute bookable slots |
| **Features** | Filter by specialty; weekly schedule; blocked dates; 48×30-min slots/day |
| **Input** | `specialty`, `date` (YYYY-MM-DD), doctor availability JSON |
| **Output** | Doctor cards, `slots[]` with `available` flag |
| **Workflow** | Patient selects specialty → doctor → date → slot → book |
| **Technology** | Mongoose, `buildAppointmentSlotTimes()` |
| **API** | `GET /doctors`, `GET /doctors/:id/slots`, `GET /doctors/me`, `PUT /doctors/me/availability` |
| **Database** | `DoctorProfile` (availability, blockedDates, verificationStatus) |
| **UI** | `patient.doctors.tsx`, `doctor.availability.tsx` |
| **Security** | Public list only `approved` doctors |
| **Integrations** | Appointments, Dashboard |

---

### M3 — Appointment Management

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Book, confirm, cancel, complete video visits |
| **Features** | Status machine; email on create/update; video session token; leave vs complete |
| **Input** | `doctorId`, `date`, `time`, `specialty` |
| **Output** | Appointment document, notifications, emails |
| **Workflow** | `pending` → doctor `confirmed` → join video `in_progress` → doctor `completed` + EMR finalize |
| **Technology** | Express, Nodemailer |
| **API** | `GET/POST /appointments`, `GET/PATCH /appointments/:id`, `POST .../video-session`, `.../leave`, `.../end` |
| **Database** | `Appointment` (unique doctor+date+time index) |
| **UI** | `patient.appointments.tsx`, `doctor.appointments.tsx`, `use-appointments.ts` |
| **Security** | Role-filtered lists; only participants join video |
| **Integrations** | Video, EMR, Reviews, Notifications, Email |

---

### M4 — Video Consultation (WebRTC)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Real-time audio/video between patient and doctor |
| **Features** | Socket.IO signaling; adaptive bitrate; audio-only; mirror local preview; rejoin |
| **Input** | Appointment id, JWT, SDP/ICE |
| **Output** | Peer connection, media streams |
| **Workflow** | `videoSession` → join room → OFFER/ANSWER/ICE → leave (session stays) → rejoin → doctor completes |
| **Technology** | WebRTC, Socket.IO, `adaptive-media.ts` |
| **API** | `GET /video/ice-servers`, `GET /video/media-config`, signaling events |
| **Database** | `Appointment.roomId`, status |
| **UI** | `ConsultRoom.tsx`, `PatientConsultRoom.tsx`, `DoctorConsultRoom.tsx`, `useVideoCall.ts` |
| **Security** | Signaling auth middleware; appointment role check |
| **Integrations** | Appointments, EMR on complete |

---

### M5 — AI Symptom Scanner

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Patient-reported symptom triage with severity tier |
| **Features** | Rule-based triage; optional Gemini enrichment; health score; critical alert |
| **Input** | Symptom text, optional vitals |
| **Output** | `severity`, `healthScore`, `recommendations`, stored `SymptomScan` |
| **Workflow** | Submit → rules → optional LLM → persist → notify if high severity |
| **Technology** | Gemini, `symptom-triage.rules.ts`, `symptom-analyzer.ts` |
| **API** | `POST /ai/symptom-scan`, `GET /ai/health-summary` |
| **Database** | `SymptomScan`, `CriticalCareAlert` |
| **UI** | `patient.ai-scanner.tsx` |
| **Security** | Patient role only |
| **Integrations** | Clinical triage, EMR, Notifications |

---

### M6 — Medical Report Analysis (Clinical AI Pipeline)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Upload lab/imaging reports; extract, score severity, chart values |
| **Features** | PDF/OCR → rules → optional vision → synthesis → doctor review |
| **Input** | Multipart file (≤20MB) |
| **Output** | `MedicalReport` with severity, charts, AI summary |
| **Workflow** | See `backend/services/ai/ARCHITECTURE.md` (6-layer pipeline) |
| **Technology** | pdf-parse, Tesseract, Gemini Vision, severity-engine |
| **API** | `POST /clinical/reports`, `GET /clinical/reports`, `PATCH /clinical/reports/:id/review` |
| **Database** | `MedicalReport` |
| **UI** | `patient.reports.tsx`, `doctor.reports.tsx` |
| **Security** | Patient owns uploads; doctor reviews assigned reports |
| **Integrations** | Cloudinary, EMR, Admin AI monitoring |

---

### M7 — Doc Assistant (Document RAG)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Upload health documents and chat with context-aware answers |
| **Features** | Chunking, embedding retrieval, localized answers, download only (no open-in-tab) |
| **Input** | File upload, chat message + `documentId` |
| **Output** | Answer text, document list |
| **Workflow** | Upload → chunk store → chat retrieves chunks → Gemini answer |
| **Technology** | `doc-assistant` service, `DocumentChunk` model |
| **API** | `POST /ai/documents/upload`, `GET /ai/documents`, `POST /ai/document-chat` |
| **Database** | `DocumentChunk`, `PrescriptionUpload` (metadata) |
| **UI** | `patient.doc-assistant.tsx` |
| **Integrations** | Files download, i18n translator |

---

### M8 — Prescription Management

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Doctor digital Rx; patient OCR upload |
| **Features** | Structured prescription create; OCR parse; list by role |
| **API** | `POST /clinical/patients/:id/prescriptions`, `GET /clinical/prescriptions`, `POST /ai/prescription-ocr` |
| **Database** | `Prescription`, `PrescriptionUpload` |
| **UI** | `doctor.prescriptions.tsx`, `patient.prescriptions.tsx` |
| **Integrations** | EMR, AI pipeline |

---

### M9 — EMR (Electronic Medical Record)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Unified patient health timeline |
| **Features** | Profile, vitals, snapshots, consultation records, access control |
| **API** | `GET /emr/me`, `POST /emr/me/snapshot`, `PATCH /emr/me/profile`, `POST /emr/me/vitals`, doctor patient EMR routes |
| **Database** | `EmrSnapshot`, `VitalRecord`, `ConsultationRecord`, `ClinicalNote` |
| **UI** | `patient.emr.tsx`, `doctor/patients/$patientId/emr.tsx` |
| **Integrations** | Appointments (finalize on complete), Clinical |

---

### M10 — Critical Care & Triage

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Escalate high-risk patients to doctors |
| **Features** | Triage queue, accept critical, urgent book, patient critical banner |
| **API** | `/clinical/doctor/triage-queue`, `/clinical/patient/critical-*`, `/clinical/doctor/urgent-book` |
| **Database** | `CriticalCareAlert` |
| **UI** | `DoctorTriagePanel.tsx`, critical alert components |
| **Integrations** | Symptom scan, Appointments |

---

### M11 — Notifications

| Attribute | Detail |
|-----------|--------|
| **Purpose** | In-app notification center |
| **API** | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| **Database** | `Notification` |
| **UI** | `NotificationBell.tsx`, dashboard hooks |
| **Integrations** | Appointments, AI alerts |

---

### M12 — Email Service

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Transactional email (booking, status, OTP, AI alerts) |
| **Technology** | Nodemailer, templates under `backend/services/email/templates/` |
| **Config** | `EMAIL`, `EMAIL_PASSWORD`, `FRONTEND_URL` |
| **Integrations** | Auth OTP, Appointments, AI critical notifications |

---

### M13 — Reviews & Ratings

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Post-consultation feedback |
| **API** | `POST /reviews`, `GET /reviews`, `GET /reviews/appointment/:id` |
| **Database** | `ConsultationReview` |
| **UI** | `RateConsultationDialog.tsx` |
| **Integrations** | Appointments (must be `completed`) |

---

### M14 — Dashboards & Analytics

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Role-specific home metrics and charts |
| **API** | `/dashboard/patient`, `/dashboard/doctor`, `/dashboard/admin`, analytics sub-routes |
| **UI** | `patient.index.tsx`, `doctor.index.tsx`, `admin.index.tsx`, `*.analytics.tsx` |
| **Integrations** | Aggregates from MongoDB collections |

---

### M15 — Admin & Governance

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Approve doctors, view users, AI monitoring |
| **API** | `/dashboard/admin/*`, approve/reject doctor |
| **UI** | `admin.doctors.tsx`, `admin.patients.tsx`, `admin.ai-monitoring.tsx` |
| **Security** | `requireRole("admin")` |

---

### M16 — File Download Proxy

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Authenticated download of Cloudinary/local uploads |
| **API** | `GET /files/download?url=...` |
| **UI** | `DownloadFileButton.tsx` |
| **Security** | URL allowlist (Cloudinary + `/uploads/`) |

---

### M17 — Internationalization (i18n)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | English/Hindi UI and localized AI |
| **Technology** | react-i18next, `Accept-Language` header, `translator.ts` |
| **UI** | `LanguageSwitcher.tsx`, `en.json`, `hi.json` |

---

### M18 — Public Marketing Site

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Landing, SEO, auth-gated CTAs |
| **UI** | `index.tsx`, `SiteHeader`, `SiteFooter` |
| **Routes** | `/`, `/login`, `/register` |

---

## Module Interaction Diagram (Text)

```
                    ┌──────────────┐
                    │   Landing    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌──────────┐  ┌─────────┐
        │  Auth   │  │  Admin   │  │  i18n   │
        └────┬────┘  └────┬─────┘  └────┬────┘
             │            │             │
    ┌────────┼────────────┼─────────────┘
    ▼        ▼            ▼
┌────────┐ ┌──────────┐ ┌─────────────┐
│Doctors │→│Appointments│→│   Video     │
└───┬────┘ └─────┬────┘ └──────┬──────┘
    │            │              │
    │            ├──────────────┼──→ EMR
    │            ▼              │
    │      ┌───────────┐       │
    │      │  Email    │       │
    │      └───────────┘       │
    ▼            ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│AI Scan │→│ Critical │  │ Reviews  │
└───┬────┘  │  Triage  │  └──────────┘
    │       └────┬─────┘
    ▼            ▼
┌────────┐  ┌──────────┐
│Reports │  │Doc Assist│
│Pipeline│  │   RAG    │
└───┬────┘  └────┬─────┘
    │            │
    └─────┬──────┘
          ▼
    ┌───────────┐     ┌──────────────┐
    │ Cloudinary│     │ Notifications│
    └───────────┘     └──────────────┘
          │
          ▼
    ┌───────────┐
    │  Gemini   │
    └───────────┘
```

---

## Database Schema Summary

| Collection | Primary Use |
|------------|-------------|
| User | Credentials, role, health profile |
| DoctorProfile | Specialty, license, availability, verification |
| Appointment | Bookings, video room, status |
| SymptomScan | AI symptom history |
| MedicalReport | Uploaded report analysis |
| Prescription | Doctor-issued Rx |
| PrescriptionUpload | Patient-uploaded Rx files |
| DocumentChunk | RAG chunks |
| ConsultationRecord | Visit summary post-complete |
| ConsultationReview | Ratings |
| EmrSnapshot | Point-in-time EMR export |
| VitalRecord | BP, glucose, etc. |
| ClinicalNote | Doctor notes per patient |
| Notification | In-app alerts |
| CriticalCareAlert | High-risk escalations |
| PasswordResetOtp | Reset flow |

---

## Frontend Route Map (Implemented)

| Route | Role | Module |
|-------|------|--------|
| `/` | Public | Marketing |
| `/login`, `/register`, `/forgot-password` | Public | Auth |
| `/patient/*` | Patient | Dashboard, doctors, appointments, scanner, reports, doc-assistant, EMR, analytics |
| `/doctor/*` | Doctor | Dashboard, appointments, patients, prescriptions, reports, availability, analytics |
| `/admin/*` | Admin | Dashboard, doctors, patients, analytics, AI monitoring |
| `/consult/:appointmentId` | Patient/Doctor | Video |

---

*End of Document 2*
