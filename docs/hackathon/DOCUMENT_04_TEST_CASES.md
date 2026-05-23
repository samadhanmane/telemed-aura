# DOCUMENT 4 — Test Scenarios and Test Cases (20+ Cases)

**Project:** Telemed Aura  
**Format:** Manual execution; fill **Actual Result** and **Status** during QA  
**Extended catalog:** `docs/MANUAL_TEST_CASES.md`

---

## Test Case Index by Category

| Category | Case IDs |
|----------|----------|
| Normal | TC-001 – TC-008 |
| Boundary | TC-009 – TC-011 |
| Error | TC-012 – TC-015 |
| Security | TC-016 – TC-019 |
| Edge | TC-020 – TC-022 |
| Performance | TC-023 – TC-025 |
| AI-specific | TC-026 – TC-028 |

---

## Test Cases Table

| Test Case ID | Module | Scenario | Preconditions | Steps | Input Data | Expected Result | Actual Result | Status | Priority |
|--------------|--------|----------|---------------|-------|------------|-----------------|---------------|--------|----------|
| TC-001 | Auth | Patient registration (happy path) | API + DB running; email unused | 1. Open `/register` 2. Select Patient 3. Fill form 4. Submit | name, email, password, phone | 201/200; redirect or login; user in MongoDB `role: patient` | _(fill during test)_ | Not Run | P1 |
| TC-002 | Auth | Doctor registration pending approval | Cloudinary configured | 1. Register as doctor 2. Upload certificate 3. Select specialty | Valid doctor fields + PDF cert | Account created; `verificationStatus: pending`; login returns pending error | _(fill)_ | Not Run | P1 |
| TC-003 | Auth | Admin approves doctor | Admin JWT; pending doctor exists | 1. Login admin 2. `/admin/doctors` 3. Approve | doctorId | Status `approved`; doctor can login | _(fill)_ | Not Run | P1 |
| TC-004 | Auth | Login with valid credentials | Approved user exists | POST `/auth/login` or UI login | email, password | JWT returned; `/auth/me` returns profile | _(fill)_ | Not Run | P1 |
| TC-005 | Doctors | List doctors by specialty | ≥1 approved doctor in specialty | GET `/doctors?specialty=cardiology` | specialty=cardiology | Only approved doctors; matching specialty | _(fill)_ | Not Run | P1 |
| TC-006 | Appointments | Book available slot | Patient logged in; doctor has availability | 1. Pick doctor, date, time 2. POST `/appointments` | doctorId, date, time, specialty | 201; status `pending`; email sent (if SMTP on) | _(fill)_ | Not Run | P1 |
| TC-007 | Appointments | Doctor confirms appointment | Pending appointment exists | PATCH `/appointments/:id` `{status:"confirmed"}` | appointmentId | Status `confirmed`; patient notification | _(fill)_ | Not Run | P1 |
| TC-008 | Video | Full consult lifecycle | Confirmed appointment | 1. Both join `/consult/:id` 2. Verify media 3. Patient leaves 4. Rejoin 5. Doctor marks completed | appointmentId | Video works; rejoin OK; status `completed`; EMR finalized | _(fill)_ | Not Run | P1 |
| TC-009 | Doctors | Slots — past times hidden today | Doctor availability includes current hour | GET `/doctors/:id/slots?date=<today>` | today's date | Slots before now marked unavailable or omitted | _(fill)_ | Not Run | P2 |
| TC-010 | Appointments | Double-book same slot | Slot already booked | Two patients book same doctor/date/time | same slot | Second request fails (409/400) | _(fill)_ | Not Run | P1 |
| TC-011 | Upload | Report file size boundary | Patient logged in | Upload file ~19MB vs ~21MB | PDF files | ≤20MB accepted; &gt;20MB rejected | _(fill)_ | Not Run | P2 |
| TC-012 | Auth | Login wrong password | User exists | POST login | wrong password | 401; no token | _(fill)_ | Not Run | P1 |
| TC-013 | Auth | Pending doctor cannot login | Doctor pending | POST login | valid credentials | 403 `REGISTRATION_PENDING` | _(fill)_ | Not Run | P1 |
| TC-014 | AI | Symptom scan empty text | Patient JWT | POST `/ai/symptom-scan` `{}` or empty | empty body | 400 validation error | _(fill)_ | Not Run | P2 |
| TC-015 | Clinical | Upload report without file | Patient JWT | POST `/clinical/reports` multipart no file | — | 400 error | _(fill)_ | Not Run | P2 |
| TC-016 | Security | Access EMR without auth | None | GET `/emr/me` no header | — | 401 Unauthorized | _(fill)_ | Not Run | P1 |
| TC-017 | Security | Patient cannot approve doctor | Patient JWT | PATCH `/dashboard/admin/doctors/:id/approve` | doctorId | 403 Forbidden | _(fill)_ | Not Run | P1 |
| TC-018 | Security | Download arbitrary URL | Patient JWT | GET `/files/download?url=https://evil.com/x` | external URL | 400/403 rejected | _(fill)_ | Not Run | P1 |
| TC-019 | Security | Access other patient appointment | Patient A JWT | GET `/appointments/:id` for Patient B's id | B's appointmentId | 403 or 404 | _(fill)_ | Not Run | P1 |
| TC-020 | Video | Join before confirmed | Appointment `pending` | Navigate to consult URL | pending id | Join blocked or error in UI | _(fill)_ | Not Run | P2 |
| TC-021 | Reviews | Rate before completed | Appointment not completed | POST `/reviews` | rating 5 | 400 — must be completed | _(fill)_ | Not Run | P2 |
| TC-022 | Critical | Symptom scan triggers alert | Rules match high severity | POST symptom scan with emergency-like text | chest pain, severe SOB | High/Critical severity; `CriticalCareAlert` created | _(fill)_ | Not Run | P1 |
| TC-023 | Performance | Health endpoint | Server up | GET `/health` | — | JSON `status: ok` when DB connected | _(fill)_ | Not Run | P3 |
| TC-024 | Performance | Symptom scan under RPM limit | `AI_GEMINI_RPM` set | 5 rapid scans in 1 min | 5 requests | Some may 429 if limit exceeded; graceful message | _(fill)_ | Not Run | P3 |
| TC-025 | Video | Slow network audio fallback | Throttle DevTools to Slow 3G | Join consult; observe tier | — | Video degrades; audio-only option works | _(fill)_ | Not Run | P2 |
| TC-026 | AI Reports | PDF lab report analysis | Cloudinary + Gemini configured | Upload CBC PDF | valid lab PDF | `MedicalReport` with extracted values, charts, severity | _(fill)_ | Not Run | P1 |
| TC-027 | Doc Assistant | RAG chat on uploaded doc | Document uploaded | POST `/ai/document-chat` | question about doc content | Answer references document; localized if `hi` | _(fill)_ | Not Run | P2 |
| TC-028 | i18n | Hindi UI switch | App loaded | Switch language to Hindi | — | Nav/landing strings in Hindi | _(fill)_ | Not Run | P2 |
| TC-029 | Forgot Password | OTP reset flow | SMTP configured | Request OTP → reset password → login | email, OTP, new password | Password updated; old password fails | _(fill)_ | Not Run | P2 |
| TC-030 | Doctor | Update weekly availability | Doctor JWT | PUT `/doctors/me/availability` | schedule JSON | Slots reflect new hours on next `GET slots` | _(fill)_ | Not Run | P2 |
| TC-031 | Notifications | Mark all read | Unread notifications exist | PATCH `/notifications/read-all` | — | All marked read in UI | _(fill)_ | Not Run | P3 |
| TC-032 | Admin | AI monitoring dashboard | Admin JWT | GET `/dashboard/admin/ai-monitoring` | — | 200 with AI stats payload | _(fill)_ | Not Run | P3 |

---

## Scenario Descriptions (Selected)

### SC-01: End-to-End Teleconsult (TC-006 – TC-008)
Validates core hackathon demo path from booking through completed visit and optional review.

### SC-02: Doctor Onboarding Governance (TC-002 – TC-003)
Ensures only admin-verified doctors appear in patient booking.

### SC-03: AI Safety (TC-022, TC-026)
Confirms rule-based escalation and structured report output—not unverified LLM-only diagnosis.

### SC-04: Security Boundary (TC-016 – TC-019)
Validates JWT RBAC and file proxy hardening.

---

## Execution Notes

1. Set `frontend/.env`: `VITE_API_URL=http://localhost:4000/api/v1`
2. Set `backend/.env`: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, Cloudinary vars for uploads
3. Create seed users: 1 admin, 2 doctors (1 pending), 2 patients
4. For **Actual Result**, paste HTTP status + key JSON fields or screenshot reference

---

*End of Document 4 — 32 test cases defined*
