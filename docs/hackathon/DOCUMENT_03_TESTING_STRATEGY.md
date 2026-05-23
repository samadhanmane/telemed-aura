# DOCUMENT 3 — Testing Strategy (15 Marks)

**Project:** Telemed Aura  
**Related:** `docs/MANUAL_TEST_CASES.md` (400+ detailed cases for QA execution)

---

## 1. Testing Objectives

1. Verify **role-based access** (patient, doctor, admin) across all API routes and UI routes.
2. Validate **end-to-end clinical workflows**: register → book → consult → complete → review.
3. Confirm **AI pipelines** produce consistent severity (rules-first) and safe disclaimers.
4. Ensure **video consultation** supports leave/rejoin and doctor-only completion.
5. Test **security controls**: JWT expiry, unauthorized access, file URL allowlist.
6. Assess **usability** for rural scenarios: Hindi UI, low-bandwidth video modes.
7. Document defects with reproducible steps and severity.

---

## 2. Testing Approach

| Principle | Application |
|-----------|-------------|
| Risk-based | Prioritize auth, EMR access, AI severity, video session authorization |
| Black-box + gray-box | UI/API tests without source; developers use logs and MongoDB for gray-box |
| Manual-first | No automated test suite in repo (`package.json` has no Jest/Vitest/Playwright) |
| Environment parity | Local: MongoDB + `backend/.env` + `frontend/.env`; staging: Render + Vercel |
| Data isolation | Separate test DB (`MONGODB_DB_NAME=telemed_test`) recommended |

**Current state (from codebase):** Testing is **primarily manual** via browser and API clients (curl/Postman). Lint (`eslint`) provides static checks only.

---

## 3. Testing Levels

### 3.1 Unit Testing

| Scope | Examples | Status |
|-------|----------|--------|
| Pure functions | `buildAppointmentSlotTimes`, `filterBookableSlots`, `symptom-triage.rules` | Recommended; not fully automated in repo |
| Validators | Zod schemas in controllers | Manual via invalid payloads |
| Severity engine | `severity-engine.ts`, `remark-severity.rules.ts` | Manual matrix of lab values |

**Recommendation:** Add Vitest for `backend/services/ai/rules/*` and `frontend/src/lib/appointment-slots.ts`.

### 3.2 Integration Testing

| Scope | Examples |
|-------|----------|
| API + DB | `POST /appointments` creates doc; unique index prevents double-book |
| Auth middleware | Missing token → 401; wrong role → 403 |
| Upload + Cloudinary | Doctor register with certificate |
| AI pipeline | Upload PDF → `MedicalReport` with `severity` field |
| Email | Booking triggers Nodemailer (mock SMTP in dev) |

**Tools:** Postman/Newman, or `supertest` (future).

### 3.3 System Testing

Full user journeys in browser:

1. Patient books slot → doctor confirms → both join video → doctor marks completed → patient rates.
2. Patient symptom scan → critical alert → doctor triage accept.
3. Admin approves doctor → doctor appears in patient directory.

**Environment:** Chrome/Edge latest; test on throttled network (DevTools) for video.

### 3.4 Acceptance Testing

| Stakeholder | Criteria |
|-------------|----------|
| Patient | Can book, consult, view EMR, download reports |
| Doctor | Can manage schedule, consult, prescribe, review reports |
| Admin | Can approve/reject doctors |
| Hackathon judges | Objectives in Document 1 demonstrable in live demo |

---

## 4. Testing Types

### 4.1 Functional Testing

- All routes in `backend/src/api/routes/index.ts`
- All TanStack routes under `frontend/src/routes/`
- Form validation on register, booking, symptom scan

### 4.2 Non-Functional Testing

| Type | Focus |
|------|-------|
| Performance | API response &lt; 2s for lists; AI uploads may take 30–120s |
| Reliability | `/health` when DB down shows `degraded` |
| Compatibility | Modern evergreen browsers; WebRTC requires HTTPS in prod |

### 4.3 Security Testing

- JWT tampering, expired token, role escalation
- IDOR: patient A cannot `GET /emr/patients/:otherPatientId`
- File download only allows Cloudinary/upload paths
- CORS: reject unknown origins
- Helmet headers present

### 4.4 Performance Testing

- Concurrent symptom scans (Gemini RPM limit `AI_GEMINI_RPM`)
- Large PDF upload (near 20MB limit)
- Video on **Slow 3G** throttling — verify audio-only fallback

### 4.5 Usability Testing

- Hindi language switch persists
- Mobile viewport for patient booking
- Error toasts on API failure
- Empty states on appointments/reports

### 4.6 API Testing

- Contract: JSON shapes from controllers
- Status codes: 400 validation, 401 auth, 403 role, 404 not found, 409 conflict (slot taken)

### 4.7 Database Testing

- Unique index on `doctorId+date+time`
- Referential integrity via Mongoose `ref`
- Cascade behavior on user delete (manual verification)

### 4.8 AI Model Testing

| Area | Method |
|------|--------|
| Symptom triage | Fixed inputs: mild headache vs chest pain + dyspnea |
| Severity rules | Known lab outliers → expect High/Critical |
| Vision skip | Text-only PDF should not always invoke vision |
| RAG | Question answerable only from uploaded doc |
| Fallback | `GEMINI_API_KEY` unset → graceful error message |
| i18n | `Accept-Language: hi` → Hindi answer where implemented |

---

## 5. Testing Tools Used

| Tool | Category | Usage in Project |
|------|----------|------------------|
| **Manual browser** | E2E | Primary QA |
| **Chrome DevTools** | Network/perf | Throttle bandwidth, inspect WebRTC |
| **Postman / curl** | API | Endpoint verification |
| **MongoDB Compass** | DB | Inspect documents after tests |
| **ESLint** | Static analysis | `npm run lint` frontend/backend |
| **Prettier** | Formatting | `npm run format` (frontend) |
| **tsx** | Dev runtime | Backend hot reload |
| **Vite** | Dev server | Frontend HMR |
| **Git** | Version control | Regression tracking |

**Not present in repo:** Jest, Vitest, Cypress, Playwright, k6, OWASP ZAP.

---

## 6. Testing Workflow

```
1. Plan        → Select module + test cases from DOCUMENT_04 / MANUAL_TEST_CASES.md
2. Setup       → Seed DB, configure .env, approve test doctor
3. Execute     → Record steps, screenshots, API responses
4. Log defect  → ID, severity, repro steps, expected vs actual
5. Fix         → Developer patch + code review
6. Retest      → Same case + regression smoke on auth/booking/video
7. Sign-off    → Module owner marks PASS in test matrix
```

---

## 7. Bug Handling Process

| Severity | Definition | SLA (suggested) |
|----------|------------|-----------------|
| S1 Critical | Data leak, auth bypass, consult cannot complete | Fix immediately |
| S2 High | Booking broken, AI wrong severity on emergency | Same day |
| S3 Medium | UI glitch, non-blocking i18n gap | Next sprint |
| S4 Low | Cosmetic, copy | Backlog |

**Template:**

- **ID:** BUG-###
- **Module:** e.g. M4 Video
- **Steps to reproduce**
- **Expected / Actual**
- **Environment:** OS, browser, API URL
- **Logs:** API console, browser console
- **Status:** Open → In Progress → Fixed → Verified

---

## 8. Expected Results

| Area | Pass Criteria |
|------|---------------|
| Auth | Valid login returns JWT; pending doctor cannot practice |
| Booking | No double-book; past slots hidden |
| Video | Both peers connect; leave allows rejoin; complete locks session |
| AI | Severity from rules; disclaimers visible; no diagnosis claims as final |
| EMR | Patient sees own data only |
| Files | Download works for owned Cloudinary URLs |
| i18n | Hindi strings render on switched locale |

---

## 9. Edge Case Testing Strategy

| Domain | Edge Cases |
|--------|------------|
| Slots | Midnight boundary, blocked date, full day booked |
| Auth | Duplicate email, weak password, expired OTP |
| Video | One peer disconnects mid-call; doctor completes while patient in lobby |
| AI | Empty symptom text, corrupted PDF, image-only scan |
| EMR | New patient with no history |
| Admin | Reject then re-apply doctor |

---

## 10. Professional Testing Report (Sample Summary)

**Test Cycle:** Hackathon QA — Telemed Aura v0.1.0  
**Date:** 2026-05-22  
**Tester:** QA Team  
**Build:** `main` branch, local + staging

| Module | Cases Executed | Pass | Fail | Blocked |
|--------|----------------|------|------|---------|
| Auth | 24 | 22 | 2 | 0 |
| Appointments | 18 | 17 | 1 | 0 |
| Video | 12 | 11 | 1 | 0 |
| AI Symptom | 10 | 10 | 0 | 0 |
| Reports/Clinical | 15 | 14 | 1 | 0 |
| EMR | 8 | 8 | 0 | 0 |
| Admin | 6 | 6 | 0 | 0 |
| **Total** | **93** | **88** | **5** | **0** |

**Pass rate:** 94.6%

**Critical findings (example placeholders for live run):**

1. Missing `VITE_API_URL` → frontend calls wrong port (documented fix in `env.ts` fallback).
2. Cloudinary unset → doctor registration 400 (expected; env required).

**Recommendation:** Add Vitest unit tests for slot/triage rules; Playwright smoke for login → book → consult path.

---

*End of Document 3*
