# DOCUMENT 2 — Coverage of Project Modules (15 Marks)

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BROWSER (React + Vite + TanStack Router)                                 │
│  Routes: /, /login, /register, /patient/*, /doctor/*, /admin/*, /consult/*│
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS  +  WSS (/signaling)
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  EXPRESS API (:4000)  —  /api/v1/*  +  /health  +  Socket.IO signaling    │
│  Middleware: helmet, cors, mongo-sanitize, rate-limit, JWT, Zod validate   │
└───────┬─────────────┬──────────────┬──────────────┬────────────────────────┘
        ▼             ▼              ▼              ▼
   MongoDB       Cloudinary      Gmail SMTP      Google Gemini
```

**Response contract (most routes):**
```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": [{ "field": "", "message": "" }] }
```

---

## 2. Module Catalog (19 Modules)

### M1 — Authentication & Identity

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Register, login, profile, OTP password reset |
| **Features** | Patient/doctor signup; doctor certificate; admin env login; rate-limited auth |
| **Input** | email, password, name, phone; doctor: specialty, license, experience, certificate file |
| **Output** | JWT + user profile; or pending doctor message |
| **Workflow** | Register → hash (bcrypt) → doctor pending → admin approve → login |
| **Technology** | Express, Zod (`auth.schemas.ts`), bcryptjs, JWT, multer |
| **API** | `GET /auth/specialties`, `POST /auth/register`, `POST /auth/register/doctor`, `POST /auth/login`, `POST /auth/forgot-password/request`, `POST /auth/forgot-password/reset`, `GET /auth/me`, `PATCH /auth/me/profile` |
| **DB** | `User`, `DoctorProfile`, `PasswordResetOtp` |
| **UI** | `login.tsx`, `register.tsx`, `forgot-password.tsx`, `SpecialtyCategoryPicker.tsx` |
| **Security** | Password 8+ upper/lower/number on register; generic login failure message |
| **Integrations** | All modules via `requireAuth` |

---

### M2 — Doctor Directory & Slots

| Attribute | Detail |
|-----------|--------|
| **Purpose** | List approved doctors; compute 30-minute bookable slots |
| **Features** | Specialty filter; weekly schedule; blocked dates; hide past slots today |
| **Input** | `?specialty=`, `?date=YYYY-MM-DD` |
| **Output** | Doctor list; `{ date, slots: string[] }` |
| **Workflow** | Patient filters → picks doctor/date → selects available time |
| **Technology** | `appointment-slots.ts`, `doctors.service.ts` |
| **API** | `GET /doctors`, `GET /doctors/:id/slots`, `GET/PUT /doctors/me/availability` |
| **DB** | `DoctorProfile` |
| **UI** | `patient.doctors.tsx`, `doctor.availability.tsx` |
| **Security** | Only `verificationStatus: approved` in public list |

---

### M3 — Appointment Management

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Book and manage video consultations |
| **Features** | Status machine; email on book/update; unique doctor+date+time index |
| **Input** | `doctorId`, `date`, `time`, `specialty` |
| **Output** | `Appointment` with `mode: "video"`, `fee: 0` |
| **Workflow** | pending → confirmed → in_progress (on join) → completed (doctor only) |
| **API** | `GET/POST /appointments`, `GET/PATCH /appointments/:id`, video-session routes |
| **DB** | `Appointment` |
| **UI** | `patient.appointments.tsx`, `doctor.appointments.tsx` |
| **Integrations** | Video, EMR finalize, Reviews, Notifications, Email |

---

### M4 — Video Consultation (WebRTC)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Real-time audio/video consult |
| **Features** | Socket.IO signaling; adaptive tiers; leave without ending; doctor completes visit |
| **Input** | appointmentId, JWT, SDP/ICE |
| **Output** | Media streams; session token |
| **Workflow** | `POST .../video-session` → join room → OFFER/ANSWER/ICE → leave/rejoin → doctor `completed` |
| **API** | `GET /video/ice-servers`, `GET /video/media-config`, signaling events |
| **UI** | `patient.consult.$appointmentId.tsx`, `doctor.consult.$appointmentId.tsx`, `useVideoCall.ts` |
| **Security** | Signaling auth; only confirmed/in_progress; participant check |

---

### M5 — AI Symptom Scanner

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Patient-reported triage with severity tier |
| **Input** | symptoms[], description, optional vitals, locale |
| **Output** | `SymptomScan` + recommendations; may create `CriticalCareAlert` |
| **API** | `POST /ai/symptom-scan`, `GET /ai/health-summary` |
| **DB** | `SymptomScan`, `CriticalCareAlert` |
| **UI** | `patient.ai-scanner.tsx` |
| **Policy** | Rules-first severity; disclaimers in UI |

---

### M6 — Medical Report Analysis (Clinical AI)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Upload labs/imaging; extract; score; chart |
| **Pipeline** | Cloudinary → extract → rules → ML → vision → synthesis → severity (rules only) |
| **API** | `POST /clinical/reports`, `GET /clinical/reports`, `PATCH /clinical/reports/:id/review` |
| **DB** | `MedicalReport` |
| **UI** | `patient.reports.tsx`, `doctor.reports.tsx`, `ReportChatPanel.tsx` |

---

### M7 — Doc Assistant (RAG)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Upload documents; Q&A with retrieved chunks |
| **API** | `GET /ai/documents`, `POST /ai/documents/upload`, `POST /ai/document-chat` |
| **DB** | `DocumentChunk`, `PrescriptionUpload` |
| **UI** | `patient.doc-assistant.tsx`, `DocAssistantHub.tsx` |

---

### M8 — Prescriptions

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Doctor digital Rx; patient OCR upload |
| **API** | `POST /clinical/patients/:id/prescriptions`, `GET /clinical/prescriptions`, `POST /ai/prescription-ocr`, `POST /ai/prescription-ocr/file` |
| **DB** | `Prescription`, `PrescriptionUpload` |
| **UI** | `doctor.prescriptions.tsx`, `patient.prescriptions.tsx` |

---

### M9 — EMR

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Unified health timeline |
| **API** | `GET /emr/me`, `POST /emr/me/snapshot`, `PATCH /emr/me/profile`, `POST /emr/me/vitals`, doctor patient EMR, `POST /emr/consultations/:id/complete` |
| **DB** | Aggregates User, ConsultationRecord, Prescription, MedicalReport, SymptomScan, VitalRecord, EmrSnapshot |
| **UI** | `patient.emr.tsx`, `doctor.patients.$patientId.emr.tsx`, `EmrView.tsx` |

---

### M10 — Critical Care & Triage

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Escalate and book urgent cases |
| **API** | `/clinical/doctor/triage-queue`, `/clinical/doctor/critical-patients`, `/clinical/doctor/urgent-book`, `/clinical/patient/critical-*`, `/clinical/doctor/reschedule` |
| **DB** | `CriticalCareAlert` |
| **UI** | `DoctorTriagePanel.tsx`, critical banners on patient flows |

---

### M11 — Notifications

| **API** | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| **DB** | `Notification` |
| **UI** | `patient.notifications.tsx`, `doctor.notifications.tsx`, `NotificationBell` |

---

### M12 — Email Service

| **Technology** | Nodemailer; templates in `services/email/templates/` |
| **Triggers** | Booking, status change, OTP, AI high-severity alerts |

---

### M13 — Reviews

| **API** | `POST /reviews`, `GET /reviews`, `GET /reviews/appointment/:appointmentId` |
| **DB** | `ConsultationReview` |
| **UI** | `RateConsultationDialog.tsx` |

---

### M14 — Dashboards & Analytics

| **API** | `/dashboard/patient`, `/dashboard/doctor`, `/dashboard/admin`, analytics sub-routes |
| **UI** | `patient.index.tsx`, `doctor.index.tsx`, `admin.index.tsx`, `*.analytics.tsx` |

---

### M15 — Admin Governance

| **API** | `/dashboard/admin/doctors`, approve/reject, users, patients, `ai-monitoring` |
| **UI** | `admin.doctors.tsx`, `admin.patients.tsx`, `admin.ai-monitoring.tsx` |

---

### M16 — File Download Proxy

| **API** | `GET /files/download?url=&filename=` |
| **Security** | Cloudinary + `/uploads/` allowlist only |

---

### M17 — Internationalization

| **Tech** | react-i18next, `en.json`, `hi.json`, `Accept-Language` header |

---

### M18 — Public Marketing Site

| **UI** | `index.tsx`, `SiteHeader`, `SiteFooter`, auth-gated CTAs |

---

### M19 — API Infrastructure (Cross-cutting)

| **Components** | `AppError`, `asyncHandler`, `error-handler.ts`, `validate.middleware.ts`, `response.ts`, `client.ts` interceptors |

---

## 3. Database Collections (16 Models)

| Collection | Purpose |
|------------|---------|
| User | Auth, profile, health fields |
| DoctorProfile | Specialty, license, availability, verification |
| Appointment | Bookings, roomId, status |
| SymptomScan | AI symptom history |
| MedicalReport | Uploaded report + aiAnalysis |
| Prescription | Doctor-issued medicines |
| PrescriptionUpload | Patient-uploaded Rx files |
| DocumentChunk | RAG embeddings text |
| ConsultationRecord | Completed visit summary |
| ConsultationReview | Star ratings |
| EmrSnapshot | Point-in-time export |
| VitalRecord | BP, glucose, SpO2 |
| ClinicalNote | Doctor notes per patient |
| Notification | In-app alerts |
| CriticalCareAlert | High-risk escalations |
| PasswordResetOtp | Reset flow |

---

## 4. Frontend Route Map (41 route files)

| Area | Routes |
|------|--------|
| Public | `/`, `/login`, `/register`, `/forgot-password` |
| Patient | `/patient`, `/patient/doctors`, `/patient/appointments`, `/patient/ai-scanner`, `/patient/reports`, `/patient/doc-assistant`, `/patient/emr`, `/patient/prescriptions`, `/patient/analytics`, `/patient/timeline`, `/patient/notifications`, `/patient/settings`, `/patient/consult/$appointmentId` |
| Doctor | `/doctor`, `/doctor/appointments`, `/doctor/patients`, `/doctor/patients/$patientId/emr`, `/doctor/prescriptions`, `/doctor/reports`, `/doctor/availability`, `/doctor/analytics`, `/doctor/notifications`, `/doctor/settings`, `/doctor/consult/$appointmentId` |
| Admin | `/admin`, `/admin/doctors`, `/admin/patients`, `/admin/users`, `/admin/appointments`, `/admin/reports`, `/admin/analytics`, `/admin/ai-monitoring`, `/admin/notifications`, `/admin/settings` |

---

## 5. Module Interaction Diagram (Text)

```
[Landing] ──► [Auth] ──► Patient / Doctor / Admin dashboards
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
[Doctors]──►[Appointments]──►[Video]──►[EMR Complete]
    │           │              │
    │           ├──►[Email]    └──►[Reviews]
    │           └──►[Notifications]
    ▼
[AI Symptom]──►[Critical/Triage]──►[Urgent Book]
    │
    ├──►[Reports Pipeline]──►[Doctor Review]
    └──►[Doc Assistant RAG]
              │
         [Cloudinary] ◄── [Files Download]
              │
         [Gemini API]
```

---

*End of Document 2*
