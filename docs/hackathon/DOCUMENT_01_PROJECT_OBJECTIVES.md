# DOCUMENT 1 — Coverage of Project Objectives (10 Marks)

**Project Title:** AI-Enabled Telehealth & Patient Data System  
**Product Name:** Telemed Aura  
**Repository:** Monorepo (`frontend/` + `backend/`)  
**Version:** 0.1.0 (implementation snapshot)

---

## 1. Project Overview

Telemed Aura is a full-stack telehealth platform designed for **rural and semi-urban healthcare access**. It connects **patients**, **verified doctors**, and a **platform administrator** through a single web application. Patients can register, run an **AI-assisted symptom scanner**, upload **medical reports and prescriptions** for analysis, book **video consultations** on 30-minute slots, and maintain a longitudinal **Electronic Medical Record (EMR)**. Doctors manage availability, conduct secure video visits, review AI-assisted reports, prescribe digitally, and complete consultations. Admins verify doctor credentials before they appear in the patient directory.

The system is implemented as:

- **Frontend:** React 19, TanStack Router/Start, Vite, Tailwind CSS, shadcn/ui, Socket.IO client, i18next (English/Hindi)
- **Backend:** Express 4, MongoDB (Mongoose), JWT authentication, Socket.IO signaling (same port as API), modular services under `backend/src/modules/`
- **AI layer:** Google Gemini (vision, synthesis, RAG chat), rule-based severity engines, Tesseract OCR, pdf-parse
- **Cloud:** Cloudinary (file storage), SMTP/Nodemailer (email), optional TURN/STUN for WebRTC

**Assumption:** Marketing figures on the landing page (e.g. “120k+ consultations”) are illustrative UI copy, not live production metrics unless backed by analytics DB.

---

## 2. Problem Statement

Rural populations often face:

1. **Distance and cost** — Limited access to specialists; travel time and expense for in-person visits.
2. **Low bandwidth** — Video tools designed for urban fiber fail on weak mobile networks.
3. **Fragmented records** — Paper prescriptions and scattered lab reports are hard to share with a new clinician.
4. **Delayed triage** — Mild and severe symptoms are not consistently prioritized before a human review.
5. **Trust and verification** — Unverified online “doctors” create safety and regulatory risk.

Telemed Aura addresses these by combining **verified providers**, **low-bandwidth video**, **centralized EMR**, **rules + AI screening**, and **admin-gated doctor onboarding**.

---

## 3. Main Objectives

| # | Objective | Priority |
|---|-----------|----------|
| O1 | Enable secure role-based telehealth for patients, doctors, and admins | Critical |
| O2 | Provide AI-assisted symptom screening with calibrated severity (not diagnosis) | Critical |
| O3 | Digitize patient health data (EMR, reports, prescriptions, vitals, consultations) | Critical |
| O4 | Support end-to-end video consultation with rural network optimizations | Critical |
| O5 | Automate doctor verification and platform governance | High |
| O6 | Support multilingual access (English/Hindi) for wider adoption | Medium |
| O7 | Notify users of appointments and critical alerts | High |

---

## 4. Functional Objectives

| ID | Functional Objective | Implementation Evidence |
|----|----------------------|-------------------------|
| FO-1 | Patient self-registration and login | `POST /auth/register`, `POST /auth/login`, `/register`, `/login` |
| FO-2 | Doctor registration with certificate upload and admin approval | `POST /auth/register/doctor`, `DoctorProfile.verificationStatus`, admin approve/reject |
| FO-3 | Password reset via email OTP | `POST /auth/forgot-password/*`, `/forgot-password` |
| FO-4 | Browse and book doctors by specialty, date, 30-min slot | `GET /doctors`, `GET /doctors/:id/slots`, `POST /appointments` |
| FO-5 | Appointment lifecycle: pending → confirmed → in_progress → completed | `PATCH /appointments/:id`, doctor UI actions |
| FO-6 | WebRTC video consult with leave/rejoin until doctor completes visit | Signaling `/signaling`, `leaveVideoSession`, `updateStatus(completed)` |
| FO-7 | AI symptom scan with severity tier and health score | `POST /ai/symptom-scan`, `SymptomScan` model |
| FO-8 | Upload reports/prescriptions; OCR + rules + optional Gemini | `POST /clinical/reports`, `POST /ai/documents/upload`, pipelines in `backend/services/ai/` |
| FO-9 | RAG document Q&A (Doc Assistant chat) | `POST /ai/document-chat`, `DocumentChunk` embeddings |
| FO-10 | Patient EMR view; doctor EMR for consulted patients only | `/emr/*`, `/patient/emr`, `/doctor/patients/:id/emr` |
| FO-11 | Doctor availability (weekly schedule, blocked dates) | `PUT /doctors/me/availability`, slot generation in `appointment-slots.ts` |
| FO-12 | Critical-care triage queue for high-risk patients | `clinical/triage-queue`, `CriticalCareAlert` model |
| FO-13 | Post-consultation reviews | `POST /reviews` after completed appointment |
| FO-14 | Secure file download (reports, certificates) | `GET /files/download` with URL allowlist |
| FO-15 | In-app notifications | `Notification` model, `/notifications` |
| FO-16 | Dashboards and analytics per role | `/dashboard/patient|doctor|admin`, chart routes |
| FO-17 | Admin user/doctor/patient oversight and AI monitoring | `/admin/*`, `/dashboard/admin/ai-monitoring` |

**Not implemented (explicit):** Online payments (Stripe/Razorpay), native mobile apps, FHIR/HL7 interoperability, formal HIPAA certification workflow.

---

## 5. Non-Functional Objectives

| ID | Non-Functional Objective | Target / Approach |
|----|--------------------------|-------------------|
| NFO-1 | **Security** | JWT Bearer auth, bcrypt passwords, role guards, Helmet, CORS allowlist |
| NFO-2 | **Performance** | Adaptive video tiers (240p–360p, audio fallback), Gemini rate limiting (`AI_GEMINI_RPM`) |
| NFO-3 | **Scalability** | Stateless API + MongoDB; Cloudinary for blobs; horizontal scaling possible behind load balancer |
| NFO-4 | **Usability** | Responsive UI, loading/empty states, toast errors, specialty sidebar on doctor signup |
| NFO-5 | **Reliability** | `/health` endpoint with DB status; graceful AI fallbacks when Gemini unavailable |
| NFO-6 | **Maintainability** | Modular monorepo: `modules/*`, shared `services/ai/*`, typed TypeScript |
| NFO-7 | **i18n** | `react-i18next`, `Accept-Language` / locale on API for localized AI answers |
| NFO-8 | **Deployability** | Env-driven config (`VITE_*`, `backend/.env`); Vercel (frontend) + Render (API) per `.env.example` |

---

## 6. Alignment with Project Goals

| Project Goal | How Objectives Support It |
|--------------|---------------------------|
| Rural telehealth access | Video + audio-only fallback, 30-min slots across 24h (within doctor availability) |
| AI-enabled care | Symptom scanner, report pipeline, Doc Assistant RAG—not replacing clinicians |
| Patient data system | MongoDB models for EMR, reports, scans, vitals, consultations, chunks |
| Trust & safety | Admin doctor verification; rules-first severity; doctor report review |
| Hackathon demo readiness | Clear role separation, dashboards, end-to-end book → consult → complete flow |

---

## 7. Justification of Each Objective

**O1 — Secure telehealth:** JWT (`jsonwebtoken`) and middleware (`requireAuth`, `requireRole`) enforce that patients cannot approve doctors or access other patients’ EMR. Without this, the platform is not deployable for health data.

**O2 — AI symptom screening:** `symptom-analyzer.ts` and `symptom-triage.rules.ts` apply research-calibrated tiers (Low/Moderate/High/Critical) using patient text only, reducing false “Critical” on mild isolated symptoms—a documented fix in the codebase.

**O3 — EMR:** Consolidates `MedicalReport`, `SymptomScan`, `ConsultationRecord`, `Prescription`, `VitalRecord` into patient-facing and doctor-facing views via `emr.service.ts`.

**O4 — Video:** `useVideoCall.ts` + `adaptive-media.ts` implement tiered bitrate and manual camera-off behavior; signaling on same server as API simplifies deployment.

**O5 — Doctor verification:** `registerDoctor` stores certificate on Cloudinary; `verificationStatus: pending|approved|rejected` gates login (`REGISTRATION_PENDING` / `REGISTRATION_REJECTED`).

**O6 — i18n:** Hindi UI and localized AI answers (`translator.ts`, RAG pipeline) support rural India language needs.

**O7 — Notifications:** Email on booking/status change (`mail.service.ts`) plus in-app `Notification` documents improve engagement.

---

## 8. Expected Outcomes

1. **Patients** book video visits, upload documents, receive AI-guided screening summaries, and retain a portable health record.
2. **Doctors** receive triage-ordered worklists, conduct consultations, finalize EMR entries on completion, and review AI drafts of reports.
3. **Admins** maintain platform quality by approving doctors and monitoring AI-flagged cases.
4. **System** stores structured health artifacts in MongoDB and files in Cloudinary for audit and continuity.

---

## 9. Benefits to Rural Healthcare Users

| Benefit | Feature |
|---------|---------|
| Reduced travel | Video consult from home |
| Lower data usage | Adaptive video + audio-only mode |
| Local language | Hindi UI and localized AI responses |
| Specialist access | 10 specialties + search/filters |
| Continuity of care | EMR timeline, consultation records |
| Faster urgency signaling | Critical alerts after high-risk scans |
| Transparent booking | Visible slots; past times hidden; video-only booking flow |

---

## 10. Coverage Matrix: Objective → Module → Implementation

| Objective | Module | Key Paths / APIs |
|-----------|--------|------------------|
| O1 Secure telehealth | Auth, RBAC | `backend/src/modules/auth/`, `frontend/src/lib/auth/guards.ts` |
| O1 | Appointments | `appointments.service.ts`, `patient.appointments.tsx` |
| O2 AI screening | AI Symptom | `services/ai/core/symptom-analyzer.ts`, `POST /ai/symptom-scan` |
| O3 Patient data | EMR | `emr.service.ts`, `MedicalReport`, `ConsultationRecord` |
| O3 | Clinical / Reports | `clinical.service.ts`, `POST /clinical/reports` |
| O4 Video | Video + Signaling | `features/video/`, `signaling/`, `POST .../video-session` |
| O5 Governance | Admin + Dashboard | `dashboardController.approveDoctor`, `admin.doctors.tsx` |
| O6 i18n | Frontend + AI | `frontend/src/i18n/`, `services/ai/i18n/` |
| FO-12 Triage | Clinical | `triage.service.ts`, `DoctorTriagePanel.tsx` |
| FO-14 Downloads | Files | `files.controller.ts`, `download-file.ts` |
| NFO-1 Security | Middleware | `helmet`, `cors`, `auth.middleware.ts` |

---

## Assumptions & Limitations (Documented)

1. **Payments:** `Appointment.fee` exists but is set to `0`; no payment gateway integration.
2. **Microservices:** `email:dev`, `ai:dev`, `video:dev` scripts exist; production bundles AI + signaling into main API (`index.ts`).
3. **Booking sub-router:** `appointments/booking/booking.routes.ts` returns 501—not used; booking via `POST /appointments`.
4. **HIPAA:** Technical controls (auth, encryption in transit) exist; organizational HIPAA compliance is out of scope for code-only assessment.

---

*End of Document 1*
