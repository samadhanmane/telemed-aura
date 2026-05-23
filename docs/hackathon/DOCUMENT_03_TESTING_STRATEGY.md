# DOCUMENT 3 — Testing Strategy (15 Marks)

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System  
**Companion:** `DOCUMENT_04_TEST_CASES.md` (executable cases), `docs/MANUAL_TEST_CASES.md` (extended QA catalog)

---

## 1. Testing Objectives

1. Verify **role-based access** (patient, doctor, admin) on UI routes and API endpoints.
2. Validate **end-to-end clinical flows**: register → book → consult → complete → review.
3. Confirm **AI pipelines** apply rules-first severity and safe patient-facing language.
4. Test **video lifecycle**: join only when confirmed/in_progress; leave/rejoin; doctor-only complete.
5. Verify **standard API contract** (`success`, `message`, `data`) and friendly error messages.
6. Assess **security**: JWT, IDOR, file download allowlist, rate limits, mongo sanitize.
7. Support **hackathon demonstration** with repeatable manual scripts.

---

## 2. Testing Approach

| Principle | Application |
|-----------|-------------|
| **Risk-based** | Prioritize auth, EMR access, appointments, AI severity, video authorization |
| **Black-box + gray-box** | UI tests without code; developers use MongoDB Compass + API logs |
| **Manual-first** | No Jest/Vitest/Playwright in `package.json` today |
| **Implementation-based** | Cases map to real routes in `backend/src/modules/*/routes.ts` |
| **Data isolation** | Use `MONGODB_DB_NAME=telemed_test` for QA |

---

## 3. Testing Levels

### 3.1 Unit Testing

| Target | Examples | Status |
|--------|----------|--------|
| Pure functions | `buildAppointmentSlotTimes`, `filterBookableSlots`, `symptom-triage.rules` | Recommended (not automated) |
| Zod schemas | `auth.schemas.ts`, `appointment.schemas.ts` | Manual invalid payloads |
| Severity engine | `severity-engine.ts`, lab parser | Matrix of lab inputs |

### 3.2 Integration Testing

| Target | Examples |
|--------|----------|
| API + DB | `POST /appointments` + unique index conflict |
| Auth | JWT middleware, expired token → 401 |
| Upload | Doctor cert → Cloudinary; report → pipeline |
| Email | Booking notification (if SMTP configured) |

**Tool:** Postman, curl, or browser DevTools Network tab.

### 3.3 System Testing

Full journeys in browser (Chrome/Edge):

1. Patient registers → books → doctor confirms → video → doctor completes → patient rates.
2. Patient symptom scan (High) → critical alert → doctor triage.
3. Admin approves doctor → doctor appears in directory.

### 3.4 Acceptance Testing

| Stakeholder | Pass criteria |
|-------------|---------------|
| Patient | Book, consult, EMR, reports, Doc Assistant |
| Doctor | Availability, consult, prescribe, review reports |
| Admin | Approve/reject doctors, view monitoring |
| Judges | All rubric documents demonstrable live |

---

## 4. Testing Types

### 4.1 Functional
All modules in Document 2; every `*.routes.ts` endpoint.

### 4.2 Non-Functional
- Performance: AI upload 30–120s; list APIs &lt; 2s typical.
- Reliability: `GET /health` when DB disconnected → `degraded`.

### 4.3 Security
- JWT tampering, role escalation, IDOR on appointments/EMR.
- `GET /files/download` blocks external URLs.
- Auth rate limit (`authRateLimiter`: 30 / 15 min).
- `express-mongo-sanitize` on JSON body.

### 4.4 Performance
- Throttle network (Slow 3G) during video.
- Rapid `POST /ai/symptom-scan` vs `AI_GEMINI_RPM`.

### 4.5 Usability
- Hindi switch; empty states on doctors list; toast on API errors.

### 4.6 API Testing
- Validate `{ success: true, message, data }` on auth, appointments, clinical, ai, emr, dashboard.
- Legacy plain JSON only on `/video/ice-servers`, `/video/media-config`, `/health`.

### 4.7 Database Testing
- Unique index `doctorId+date+time` prevents double booking.
- Doctor `verificationStatus` gates listing.

### 4.8 AI Model Testing
- Mild vs emergency symptom text → severity tiers.
- PDF with known abnormal labs → High/Critical from rules.
- `POST /ai/document-chat` answers only from uploaded doc.
- Missing `GEMINI_API_KEY` → graceful error message.

---

## 5. Testing Tools Used

| Tool | Category | Usage |
|------|----------|-------|
| Chrome DevTools | E2E / network | Throttle, inspect API responses |
| Postman / curl | API | Contract and auth header tests |
| MongoDB Compass | DB | Verify documents after actions |
| ESLint | Static | `npm run lint` (frontend/backend) |
| Sonner (UI) | UX | Toast verification |
| Git | VCS | Branch `testcase` for QA snapshot |

**Not in repo:** Jest, Playwright, k6, OWASP ZAP.

---

## 6. Testing Workflow

```
1. Environment   → backend/.env + frontend/.env (VITE_API_URL)
2. Seed users    → 1 admin, 2 doctors (1 pending), 2 patients
3. Execute cases → DOCUMENT_04 table (mark Actual Result / Status)
4. Log defects   → ID, severity, steps, API response body
5. Fix & retest  → Same case + smoke on auth + booking
6. Sign-off      → Module owner approves PASS
```

---

## 7. Bug Handling Process

| Severity | Definition | Action |
|----------|------------|--------|
| S1 | Auth bypass, data leak, consult broken | Block release |
| S2 | Booking/AI wrong severity on emergency | Fix same day |
| S3 | UI/i18n gap | Next iteration |
| S4 | Cosmetic | Backlog |

**Template:** BUG-### | Module | Steps | Expected | Actual | Env | Screenshot/JSON

---

## 8. Expected Results

| Area | Pass |
|------|------|
| Auth | Zod validation messages; pending doctor cannot practice |
| API | `success: false` never exposes Mongo stack traces |
| Booking | No double-book; past slots unavailable |
| Video | Rejoin works until doctor completes |
| AI | Severity from rules; disclaimers visible |
| EMR | Doctor sees only linked patients |

---

## 9. Edge Case Testing Strategy

| Domain | Cases |
|--------|-------|
| Slots | Midnight, blocked date, full day, today past times |
| Auth | Duplicate email, weak password, expired OTP |
| Video | Disconnect mid-call; complete while patient in lobby |
| AI | Empty symptoms, corrupt PDF, 20MB boundary |
| Triage | Two doctors accept same critical case |
| i18n | Switch to Hindi mid-session |

---

## 10. Sample Test Execution Report

**Cycle:** Hackathon QA — Telemed Aura  
**Branch:** `testcase`  
**Build:** commit `c8bf318` or later

| Module | Planned | Pass | Fail | Blocked |
|--------|---------|------|------|---------|
| Auth & validation | 12 | — | — | — |
| Doctors & slots | 8 | — | — | — |
| Appointments | 10 | — | — | — |
| Video | 8 | — | — | — |
| AI / Reports | 12 | — | — | — |
| EMR / Clinical | 10 | — | — | — |
| Admin / Dashboard | 8 | — | — | — |
| Security / API | 10 | — | — | — |
| **Total** | **78** | — | — | — |

*Fill Pass/Fail during live QA.*

---

*End of Document 3*
