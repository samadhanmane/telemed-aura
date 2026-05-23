# DOCUMENT 4 — Test Scenarios and Test Cases

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System  
**Source:** Scanned from `backend/src/modules/*`, `frontend/src/routes/*`, `shared/validations/*`, `docs/MANUAL_TEST_CASES.md`  
**Instructions:** Fill **Actual Result** and **Status** (Pass/Fail/Blocked) during execution.

---

## 1. Test Environment Preconditions (Global)

| Item | Requirement |
|------|-------------|
| Backend | `npm run dev` in `backend/`, `MONGODB_URI`, `JWT_SECRET` set |
| Frontend | `npm run dev` in `frontend/`, `VITE_API_URL=http://localhost:4000/api/v1` |
| Cloudinary | Required for doctor register + report upload |
| Gemini | `GEMINI_API_KEY` for AI features |
| SMTP | Optional for email/OTP tests |
| Browser | Chrome/Edge latest |

---

## 2. Test Case Index by Category

| Category | IDs |
|----------|-----|
| Normal / Happy path | TC-001 – TC-020 |
| Boundary | TC-021 – TC-028 |
| Error / Validation | TC-029 – TC-038 |
| Security | TC-039 – TC-046 |
| Edge / Workflow | TC-047 – TC-054 |
| Performance / API | TC-055 – TC-058 |

---

## 3. Test Cases Table

| Test Case ID | Module | Scenario | Preconditions | Steps | Input Data | Expected Result | Actual Result | Status | Priority |
|--------------|--------|----------|---------------|-------|------------|-----------------|---------------|--------|----------|
| TC-001 | Auth | Patient registration success | API up; email unused | 1. Open `/register` 2. Choose Patient 3. Submit valid form | name, valid email, password `Test@1234`, phone `9876543210` | `{ success: true, message: "Registration completed successfully", data: { user, token } }`; redirect to patient dashboard | | Not Run | P1 |
| TC-002 | Auth | Doctor registration pending | Cloudinary configured | 1. Register as Doctor 2. Upload PDF certificate 3. Select specialty | Valid doctor fields + cert file | `{ success: true }` with pending message; **no** immediate practice access | | Not Run | P1 |
| TC-003 | Auth | Pending doctor login blocked | TC-002 done | 1. Login with doctor credentials | pending doctor email/password | `success: false`, message about pending review, `code: REGISTRATION_PENDING` | | Not Run | P1 |
| TC-004 | Auth | Admin approves doctor | Admin logged in | 1. `/admin/doctors` 2. Approve pending doctor | doctorId | `{ success: true, message: "Doctor approved successfully" }`; doctor can login | | Not Run | P1 |
| TC-005 | Auth | Patient login success | Patient exists | POST `/auth/login` or UI login | valid email/password | `{ success: true, message: "Login successful", data: { token } }`; toast "Login successful" | | Not Run | P1 |
| TC-006 | Auth | Invalid credentials (generic) | User exists | Login with wrong password | correct email, wrong password | `success: false`, message **"Invalid email or password"** (no hint which field) | | Not Run | P1 |
| TC-007 | Auth | Register password policy | — | POST `/auth/register` weak password | password `test` | 422, message contains uppercase/lowercase/number requirement | | Not Run | P1 |
| TC-008 | Auth | Invalid email format | — | Register with bad email | `not-an-email` | 422, **"Please enter a valid email address"** | | Not Run | P2 |
| TC-009 | Auth | Duplicate email | Email already registered | Register same email again | existing email | 409, **"Email already registered"** | | Not Run | P1 |
| TC-010 | Auth | Forgot password OTP flow | SMTP configured | 1. `/forgot-password` request OTP 2. Reset with OTP | email, 6-digit OTP, new password `New@Test99` | Success messages; old password fails | | Not Run | P2 |
| TC-011 | Auth | Get specialties (public) | — | GET `/auth/specialties` | — | `{ success: true, data: { specialties: [...] } }` with 10 specialties | | Not Run | P2 |
| TC-012 | Auth | JWT profile load | Logged in | GET `/auth/me` with Bearer token | valid JWT | `{ success: true, data: { user } }` | | Not Run | P1 |
| TC-013 | Doctors | List approved doctors only | ≥1 approved doctor | GET `/doctors` | — | Only doctors with `verificationStatus: approved` | | Not Run | P1 |
| TC-014 | Doctors | Filter by specialty | Cardiology doctor exists | GET `/doctors?specialty=cardiology` | specialty=cardiology | Filtered list matches specialty | | Not Run | P2 |
| TC-015 | Doctors | Get slots for date | Doctor has availability | GET `/doctors/:id/slots?date=2026-06-01` | valid date | `{ success: true, data: { date, slots: [] } }` with 30-min strings | | Not Run | P1 |
| TC-016 | Doctors | Slots query validation | — | GET slots without date | missing `date` | 422, date format error | | Not Run | P2 |
| TC-017 | Doctors | Past slots hidden (today) | Book on today | UI `/patient/doctors` pick today | today's date | Times before now not selectable / unavailable | | Not Run | P1 |
| TC-018 | Doctors | Doctor updates availability | Doctor JWT | PUT `/doctors/me/availability` | weekly schedule JSON | `{ success: true, message: "Availability saved" }`; slots reflect change | | Not Run | P2 |
| TC-019 | Appointments | Book appointment | Patient JWT; free slot | POST `/appointments` | doctorId, date, time, specialty | 201, **"Appointment booked successfully"**; status `pending` | | Not Run | P1 |
| TC-020 | Appointments | Doctor confirms | Pending appointment | PATCH `/appointments/:id` `{status:"confirmed"}` | appointmentId | **"Appointment confirmed successfully"**; patient notification | | Not Run | P1 |
| TC-021 | Appointments | Book past datetime | Patient JWT | POST with yesterday slot | past date/time | 400, **"Appointments cannot be booked in the past"** | | Not Run | P1 |
| TC-022 | Appointments | Double-book same slot | Slot taken | Two bookings same doctor/date/time | identical slot | Second request 409, **"Selected slot is already booked"** or conflict message | | Not Run | P1 |
| TC-023 | Appointments | Doctor cancels | Confirmed appointment | PATCH `{status:"cancelled"}` | id | **"Appointment cancelled"** | | Not Run | P2 |
| TC-024 | Appointments | Doctor marks completed | in_progress consult | PATCH `{status:"completed"}` + optional vitals | conclusion text | **"Consultation marked as completed"**; EMR record created | | Not Run | P1 |
| TC-025 | Appointments | Patient cannot complete | Patient JWT | PATCH completed as patient | id | 403, permission error | | Not Run | P1 |
| TC-026 | Video | Join when confirmed | Confirmed appointment | POST `/appointments/:id/video-session` | appointmentId | `{ success: true, data: { sessionToken, appointment } }`; status → `in_progress` | | Not Run | P1 |
| TC-027 | Video | Join when pending blocked | pending appointment | Navigate `/patient/consult/:id` or video-session API | pending id | 403, **"Consultation has not started yet"** or UI block | | Not Run | P1 |
| TC-028 | Video | Leave and rejoin | Active consult | 1. Join 2. Leave 3. Rejoin | — | Session remains `in_progress`; second join succeeds | | Not Run | P1 |
| TC-029 | Video | ICE servers config | — | GET `/video/ice-servers` | — | JSON with `iceServers` array | | Not Run | P2 |
| TC-030 | Video | Media config ladder | — | GET `/video/media-config` | — | Tiered bitrate config returned | | Not Run | P3 |
| TC-031 | AI Symptom | Scan with symptoms | Patient JWT; Gemini on | POST `/ai/symptom-scan` | symptoms: `["fever","cough"]`, description | `{ success: true, data: { result: { severity, risk, recommendations } } }` | | Not Run | P1 |
| TC-032 | AI Symptom | Empty symptoms and description | Patient JWT | POST body `{}` | no symptoms/description | 422, **"Add at least one symptom or description"** | | Not Run | P1 |
| TC-033 | AI Symptom | High-risk text escalation | Patient JWT | Scan with chest pain + severe SOB | emergency-like text | severity High/Critical; `CriticalCareAlert` in DB | | Not Run | P1 |
| TC-034 | AI Symptom | Health summary | Patient JWT | GET `/ai/health-summary` | — | `{ success: true, data: { summary } }` with healthScore | | Not Run | P2 |
| TC-035 | Reports | Upload PDF report | Patient JWT; Cloudinary+Gemini | POST `/clinical/reports` multipart | PDF lab file, name, category | 201, analysis with severity, charts from rules | | Not Run | P1 |
| TC-036 | Reports | Upload without file | Patient JWT | POST `/clinical/reports` no file | — | 400, upload file required message | | Not Run | P2 |
| TC-037 | Reports | File too large | Patient JWT | Upload &gt;20MB | large file | 413, file too large message | | Not Run | P2 |
| TC-038 | Reports | Doctor reviews report | Doctor JWT; report exists | PATCH `/clinical/reports/:id/review` | remarks text | `{ success: true, message: "Report review saved" }` | | Not Run | P2 |
| TC-039 | Doc Assistant | Upload document | Patient JWT | POST `/ai/documents/upload` | PDF + documentType | `{ success: true }`; appears in GET `/ai/documents` | | Not Run | P2 |
| TC-040 | Doc Assistant | Chat min question length | Patient JWT; doc uploaded | POST `/ai/document-chat` | question: `a` | 422, min 2 characters | | Not Run | P2 |
| TC-041 | Doc Assistant | RAG answer from doc | Document indexed | POST chat with doc-specific question | question about uploaded content | Answer references document; localized if `Accept-Language: hi` | | Not Run | P2 |
| TC-042 | Prescriptions | Doctor creates Rx | Doctor JWT; patient linked | POST `/clinical/patients/:id/prescriptions` | medicines array | 201, prescription saved | | Not Run | P1 |
| TC-043 | Prescriptions | Rx without medicines | Doctor JWT | POST empty medicines | `medicines: []` | 422, **"At least one medicine required"** | | Not Run | P2 |
| TC-044 | EMR | Patient views own EMR | Patient JWT | GET `/emr/me` | — | `{ success: true, data: { emr, latestSnapshot } }` with timeline | | Not Run | P1 |
| TC-045 | EMR | Doctor views patient EMR | Doctor had consultation with patient | GET `/emr/patients/:patientId` | patientId | Full EMR payload | | Not Run | P1 |
| TC-046 | EMR | Doctor denied unrelated patient | No shared consult | GET `/emr/patients/:otherId` | other patientId | 403, access denied / EMR not available | | Not Run | P1 |
| TC-047 | EMR | Record vitals | Patient JWT | POST `/emr/me/vitals` | BP, sugar values | 201, vitals recorded | | Not Run | P2 |
| TC-048 | Triage | Doctor triage queue | Doctor JWT | GET `/clinical/doctor/triage-queue` | — | Queue sorted by priority | | Not Run | P2 |
| TC-049 | Triage | Critical patients board | Doctor JWT | GET `/clinical/doctor/critical-patients` | — | Critical board JSON | | Not Run | P2 |
| TC-050 | Triage | Patient critical book | Active critical alert | POST `/clinical/patient/critical-book` | doctorId, date, time | Urgent appointment created | | Not Run | P2 |
| TC-051 | Reviews | Submit after completed | Completed appointment | POST `/reviews` | rating 1-5, appointmentId | 201, **"Thank you for your feedback"** | | Not Run | P2 |
| TC-052 | Reviews | Rate before complete | Not completed | POST `/reviews` | pending appointmentId | 400, rate only after completed | | Not Run | P2 |
| TC-053 | Notifications | List and mark read | Unread exist | GET `/notifications`; PATCH `/:id/read` | — | Read flag updates in UI | | Not Run | P3 |
| TC-054 | Dashboard | Patient home | Patient JWT | GET `/dashboard/patient` | — | stats, upcoming, healthScore | | Not Run | P2 |
| TC-055 | Dashboard | Admin reject doctor | Admin JWT | PATCH reject with reason | doctorId, reason | Doctor `rejected`; login shows REGISTRATION_REJECTED | | Not Run | P2 |
| TC-056 | Files | Download allowed URL | Patient JWT; Cloudinary file | GET `/files/download?url=<cloudinary>&filename=x.pdf` | valid cloudinary URL | File bytes returned with Content-Disposition | | Not Run | P1 |
| TC-057 | Files | Download blocked URL | Patient JWT | GET `/files/download?url=https://evil.com/x` | external URL | 400, **"File URL is not allowed"** | | Not Run | P1 |
| TC-058 | Security | No token on protected API | — | GET `/emr/me` without Authorization | — | 401, **"Please login to continue"** | | Not Run | P1 |
| TC-059 | Security | Patient cannot access admin API | Patient JWT | GET `/dashboard/admin` | — | 403, permission message | | Not Run | P1 |
| TC-060 | Security | 401 auto-logout frontend | Expired/invalid token | Call API with bad token from UI | — | Redirect to `/login`; toast session expired | | Not Run | P2 |
| TC-061 | Security | Auth rate limit | — | &gt;30 login attempts in 15 min | repeated POST `/auth/login` | 429, too many attempts message | | Not Run | P3 |
| TC-062 | i18n | Hindi UI | App loaded | Switch language to Hindi | — | Nav/landing strings in Hindi (`hi.json`) | | Not Run | P2 |
| TC-063 | API | Health check | Server running | GET `/health` | — | `{ status: "ok", database: { connected: true } }` | | Not Run | P3 |
| TC-064 | Clinical | Schedule follow-up | Doctor in active consult | POST `/clinical/follow-up` | patientId, date, time | 201, follow-up appointment; optional socket event | | Not Run | P2 |
| TC-065 | Clinical | Clinical note save | Doctor JWT | PUT `/clinical/patients/:id/notes` | content text | Note persisted | | Not Run | P2 |

---

## 4. Scenario Summaries (For Presentation)

### SC-01 — End-to-End Teleconsult
**Cases:** TC-001, TC-004, TC-005, TC-019, TC-020, TC-026, TC-028, TC-024, TC-051  
**Goal:** Demonstrate full hackathon patient journey.

### SC-02 — Doctor Onboarding & Trust
**Cases:** TC-002, TC-003, TC-004, TC-055  
**Goal:** Show admin-gated verification.

### SC-03 — AI Safety & Triage
**Cases:** TC-031, TC-033, TC-035, TC-048, TC-050  
**Goal:** Rules-first severity and critical path.

### SC-04 — Security & Data Protection
**Cases:** TC-046, TC-057, TC-058, TC-059, TC-060  
**Goal:** RBAC and safe file access.

### SC-05 — Validation & Error UX
**Cases:** TC-007, TC-021, TC-032, TC-043, TC-006  
**Goal:** Zod + friendly API messages (no raw stack traces).

---

## 5. API Quick Reference (For Testers)

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/doctors` | Public |
| POST | `/api/v1/appointments` | patient |
| PATCH | `/api/v1/appointments/:id` | doctor, admin |
| POST | `/api/v1/ai/symptom-scan` | patient |
| POST | `/api/v1/clinical/reports` | patient (multipart) |
| GET | `/api/v1/emr/me` | patient |
| PATCH | `/api/v1/dashboard/admin/doctors/:id/approve` | admin |

---

*End of Document 4 — 65 test cases defined*
