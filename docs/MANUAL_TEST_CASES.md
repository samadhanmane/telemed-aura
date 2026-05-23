# Telemed Aura — Manual Test Cases (MERN Full-Stack)

**Application:** Telemed Aura (Patient / Doctor / Admin telehealth platform)  
**Stack:** React (TanStack Router) + Express API + MongoDB + Cloudinary + Socket.IO video  
**API base:** `/api/v1`  
**Roles:** `patient`, `doctor`, `admin`  
**Payments:** Not implemented in current build — section omitted.

**Legend — Status:** Leave blank during execution; mark `Pass` / `Fail` / `Blocked` / `N/A`  
**Actual Result:** Tester fills during execution

---

## Test Case Index (Summary)

| Module | ID Range | Count (approx.) |
|--------|----------|-----------------|
| Public & Landing | TC_PUB_001–010 | 10 |
| Patient Registration | TC_REG_PAT_001–020 | 20 |
| Doctor Registration | TC_REG_DOC_001–025 | 25 |
| Login / Logout / Session | TC_AUTH_001–030 | 30 |
| Forgot Password / OTP | TC_FP_001–020 | 20 |
| RBAC & Routes | TC_RBAC_001–015 | 15 |
| Appointments & Slots | TC_APT_001–035 | 35 |
| Video Consultation | TC_VID_001–025 | 25 |
| Find Doctors / Search / Filters | TC_DOCFIND_001–020 | 20 |
| Doc Assistant (Upload/OCR/RAG) | TC_DOCA_001–030 | 30 |
| AI Symptom Scanner | TC_AI_001–025 | 25 |
| File Download | TC_DL_001–012 | 12 |
| EMR & Clinical Records | TC_EMR_001–020 | 20 |
| Prescriptions | TC_RX_001–015 | 15 |
| Doctor Availability | TC_AVAIL_001–012 | 12 |
| Admin — Doctors | TC_ADM_DOC_001–015 | 15 |
| Admin — Platform | TC_ADM_001–015 | 15 |
| Notifications | TC_NOTIF_001–010 | 10 |
| Profile & Settings | TC_SET_001–010 | 10 |
| i18n (EN/HI) | TC_I18N_001–008 | 8 |
| Security | TC_SEC_001–025 | 25 |
| API / Network / Errors | TC_API_001–020 | 20 |
| UI / UX / Responsive | TC_UI_001–020 | 20 |
| Healthcare / Privacy | TC_HC_001–030 | 30 |
| **Total** | | **~400+** |

---

## 1. Public & Landing

---

**Test Case ID:** TC_PUB_001  
**Module:** Public  
**Feature:** Landing page load  
**Scenario:** Unauthenticated user opens home page  
**Priority:** High  
**Type:** Positive  

**Preconditions:** None  

**Test Steps:**
1. Open `/` in browser (not logged in)
2. Observe hero, navigation, CTA buttons

**Test Data:** N/A  

**Expected Result:**
- Landing page loads without errors
- Links to Login and Register visible
- No dashboard content exposed

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_PUB_002  
**Module:** Public  
**Feature:** Language switcher (landing)  
**Scenario:** Switch site language EN ↔ HI on public header  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** On `/` or `/login`  

**Test Steps:**
1. Click language switcher → select Hindi
2. Verify labels change (nav, buttons)
3. Switch back to English

**Test Data:** Language: `hi`, then `en`  

**Expected Result:**
- UI text updates without full page break
- Preference persists on reload (theme store)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_PUB_003  
**Module:** Public  
**Feature:** Invalid route  
**Scenario:** Navigate to non-existent route  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** None  

**Test Steps:**
1. Open `/this-route-does-not-exist`

**Test Data:** URL: `/this-route-does-not-exist`  

**Expected Result:**
- Friendly 404 / not-found handling (no white screen)
- Link or button to return home

**Actual Result:**  
**Status:**  

---

## 2. Patient Registration

---

**Test Case ID:** TC_REG_PAT_001  
**Module:** Authentication  
**Feature:** Patient registration — valid  
**Scenario:** Register new patient with valid data  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Email not already registered  

**Test Steps:**
1. Open `/register`
2. Select **Patient** role → Continue
3. Fill name, email, password (≥6 chars), optional phone/location
4. Submit

**Test Data:**
- Name: `Test Patient`
- Email: `patient.qa+001@test.com`
- Password: `Test@123`
- Phone: `9876543210`

**Expected Result:**
- Account created; auto-login OR redirect to patient dashboard
- JWT stored in `localStorage` (`telemed-auth-token`)
- Toast: welcome message
- User role = patient

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_PAT_002  
**Module:** Authentication  
**Feature:** Patient registration — invalid email  
**Scenario:** Submit invalid email format  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On patient registration form  

**Test Steps:**
1. Enter email `not-an-email`
2. Tab out / submit

**Test Data:** Email: `not-an-email`  

**Expected Result:**
- Frontend: `Enter a valid email` (Zod)
- No API call until valid
- No account created

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_PAT_003  
**Module:** Authentication  
**Feature:** Patient registration — short password  
**Scenario:** Password fewer than 6 characters  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On patient registration form  

**Test Steps:**
1. Enter password `12345`
2. Submit

**Test Data:** Password: `12345`  

**Expected Result:**
- Frontend: `At least 6 characters`
- Submit blocked

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_PAT_004  
**Module:** Authentication  
**Feature:** Patient registration — duplicate email  
**Scenario:** Register with email already in use  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Patient `existing@test.com` exists  

**Test Steps:**
1. Register as patient with same email
2. Submit

**Test Data:** Email: `existing@test.com`  

**Expected Result:**
- API 400: `Email already registered`
- Toast shows API error
- User remains on register page; no session

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_PAT_005  
**Module:** Authentication  
**Feature:** Registration — role not selected  
**Scenario:** Continue without choosing Patient or Doctor  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** On `/register` step 1  

**Test Steps:**
1. Click Continue without selecting role

**Test Data:** N/A  

**Expected Result:**
- Toast: role selection required
- Stays on step 1

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_PAT_006  
**Module:** Authentication  
**Feature:** XSS in registration name  
**Scenario:** Enter script tag in name field  
**Priority:** High  
**Type:** Security  

**Preconditions:** None  

**Test Steps:**
1. Register patient with name `<script>alert(1)</script>`
2. Complete registration
3. View name on dashboard/profile

**Test Data:** Name: `<script>alert(1)</script>`  

**Expected Result:**
- No script execution in UI (escaped rendering)
- Stored value does not break layout
- API accepts or sanitizes; no stored XSS on display

**Actual Result:**  
**Status:**  

---

## 3. Doctor Registration

---

**Test Case ID:** TC_REG_DOC_001  
**Module:** Authentication  
**Feature:** Doctor registration — valid with certificate  
**Scenario:** Submit complete doctor application  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Cloudinary configured in `backend/.env`; email unused  

**Test Steps:**
1. `/register` → Doctor → Continue
2. Fill all fields; select specialty via category sidebar
3. Upload PDF certificate (valid, &lt;20MB)
4. Submit for review

**Test Data:**
- License: `MH-123456`
- Specialty: `general_physician`
- Certificate: valid PDF

**Expected Result:**
- API 201; pending approval message
- No login token (pending doctor)
- Redirect/message to sign in after approval
- Admin sees doctor in Pending list

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_002  
**Module:** Authentication  
**Feature:** Doctor registration — missing certificate  
**Scenario:** Submit without uploading certificate  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On doctor registration form  

**Test Steps:**
1. Fill all text fields; do not attach file
2. Submit

**Test Data:** Certificate: none  

**Expected Result:**
- Frontend toast: certificate required
- OR API 400: `Medical certificate PDF or image is required`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_003  
**Module:** Authentication  
**Feature:** Doctor registration — invalid file type  
**Scenario:** Upload unsupported file (e.g. `.exe`, `.txt`)  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On doctor registration  

**Test Steps:**
1. Attach `.exe` or `.txt` as certificate
2. Submit

**Test Data:** File: `virus.exe`  

**Expected Result:**
- Multer/file filter error: invalid file type (PDF/PNG/JPG/DOCX)
- Registration not completed

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_004  
**Module:** Authentication  
**Feature:** Doctor registration — file over 20MB  
**Scenario:** Upload certificate &gt; 20MB  
**Priority:** High  
**Type:** Boundary  

**Preconditions:** Large PDF available  

**Test Steps:**
1. Upload file &gt; 20MB
2. Submit

**Test Data:** File size: &gt; 20MB  

**Expected Result:**
- API 413 or 400: file too large (max 20MB)
- User-friendly error message

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_005  
**Module:** Authentication  
**Feature:** Doctor registration — Cloudinary not configured  
**Scenario:** Backend missing Cloudinary env on new machine  
**Priority:** High  
**Type:** Negative  

**Preconditions:** `CLOUDINARY_*` empty in backend `.env`  

**Test Steps:**
1. Submit valid doctor registration with certificate

**Test Data:** Valid form + PDF  

**Expected Result:**
- API 400: `File storage is not configured — cannot upload certificate`
- Toast displays error to user

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_006  
**Module:** Authentication  
**Feature:** Doctor registration — no specialty selected  
**Scenario:** Submit without choosing specialty  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On doctor form  

**Test Steps:**
1. Leave specialty empty
2. Submit

**Test Data:** Specialty: empty  

**Expected Result:**
- Frontend Zod: specialty required
- API 400 if bypassed: `All doctor fields and certificate are required` or `Invalid specialty`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_007  
**Module:** Authentication  
**Feature:** Doctor registration — duplicate pending email  
**Scenario:** Re-register while pending approval  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** Doctor email pending admin review  

**Test Steps:**
1. Submit registration again with same email

**Test Data:** Same email as pending doctor  

**Expected Result:**
- API 400: `Registration already submitted — wait for admin approval or contact support`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_REG_DOC_008  
**Module:** Authentication  
**Feature:** Doctor registration via wrong endpoint  
**Scenario:** POST `/auth/register` with role doctor (no multipart)  
**Priority:** Medium  
**Type:** API / Negative  

**Preconditions:** API client (Postman)  

**Test Steps:**
1. POST `/api/v1/auth/register` JSON body `role: doctor`

**Test Data:** JSON registration  

**Expected Result:**
- API 400: directs to `POST /auth/register/doctor` with multipart

**Actual Result:**  
**Status:**  

---

## 4. Login / Logout / Session

---

**Test Case ID:** TC_AUTH_001  
**Module:** Authentication  
**Feature:** Patient login — valid  
**Scenario:** Login with correct credentials  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Approved patient account exists  

**Test Steps:**
1. Open `/login`
2. Enter valid email/password
3. Click Login

**Test Data:** Valid patient credentials  

**Expected Result:**
- Redirect to `/patient`
- Token + user in auth store/localStorage
- Welcome toast

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_002  
**Module:** Authentication  
**Feature:** Login — invalid password  
**Scenario:** Wrong password  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Account exists  

**Test Steps:**
1. Enter valid email, wrong password
2. Login

**Test Data:** Password: `wrong123`  

**Expected Result:**
- API 401: `Invalid email or password`
- No token stored
- Password field remains masked
- Show/hide password toggle works

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_003  
**Module:** Authentication  
**Feature:** Login — pending doctor  
**Scenario:** Doctor not yet approved tries to login  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Doctor `verificationStatus: pending`  

**Test Steps:**
1. Login as pending doctor

**Test Data:** Pending doctor credentials  

**Expected Result:**
- API 403 with code `REGISTRATION_PENDING`
- Message: pending admin review; cannot access dashboard

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_004  
**Module:** Authentication  
**Feature:** Login — rejected doctor  
**Scenario:** Rejected doctor attempts login  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Doctor was rejected by admin  

**Test Steps:**
1. Login as rejected doctor

**Test Data:** Rejected doctor account  

**Expected Result:**
- API 403 `REGISTRATION_REJECTED`
- Message to register again with new certificate

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_005  
**Module:** Authentication  
**Feature:** Admin login via env credentials  
**Scenario:** Login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from backend `.env`  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Admin env configured on server  

**Test Steps:**
1. Login with admin credentials from `.env`

**Test Data:** From `backend/.env`  

**Expected Result:**
- Login succeeds; role `admin`
- Redirect to `/admin`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_006  
**Module:** Authentication  
**Feature:** Logout / session clear  
**Scenario:** User logs out or clears session  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Logged in as patient  

**Test Steps:**
1. Logout (or clear `telemed-auth-token` in DevTools)
2. Navigate to `/patient`

**Test Data:** N/A  

**Expected Result:**
- Redirect to `/login`
- Protected routes inaccessible

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_007  
**Module:** Authentication  
**Feature:** Expired / invalid JWT  
**Scenario:** API call with tampered or expired token  
**Priority:** High  
**Type:** Security  

**Preconditions:** Logged in once  

**Test Steps:**
1. Modify `telemed-auth-token` in localStorage
2. Call `GET /api/v1/auth/me`

**Test Data:** Token: `invalid.jwt.token`  

**Expected Result:**
- API 401 `Invalid or expired token` or `Unauthorized`
- Frontend should redirect to login on protected fetch

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_008  
**Module:** Authentication  
**Feature:** Login form validation — empty fields  
**Scenario:** Submit empty login form  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** `/login`  

**Test Steps:**
1. Click Login without entering data

**Test Data:** Empty  

**Expected Result:**
- Email and password validation messages
- No API call

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_009  
**Module:** Authentication  
**Feature:** SQL injection in login  
**Scenario:** Email field SQL injection string  
**Priority:** High  
**Type:** Security  

**Preconditions:** `/login`  

**Test Steps:**
1. Email: `' OR '1'='1`
2. Any password → Login

**Test Data:** Classic SQLi string  

**Expected Result:**
- Login fails safely
- 401 invalid credentials
- No DB error exposed to client

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AUTH_010  
**Module:** Authentication  
**Feature:** Redirect after login  
**Scenario:** Login with `?redirect=/patient/ai-scanner`  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Patient account  

**Test Steps:**
1. Open `/login?redirect=/patient/ai-scanner`
2. Login successfully

**Test Data:** redirect param  

**Expected Result:**
- Lands on AI scanner (safe redirect only)
- Open redirect to external URL blocked

**Actual Result:**  
**Status:**  

---

## 5. Forgot Password / OTP / Reset

---

**Test Case ID:** TC_FP_001  
**Module:** Authentication  
**Feature:** Request OTP — valid email  
**Scenario:** Request password reset for registered user  
**Priority:** High  
**Type:** Positive  

**Preconditions:** SMTP configured; user exists  

**Test Steps:**
1. Open `/forgot-password`
2. Enter registered email → Send code
3. Check email inbox

**Test Data:** Registered patient email  

**Expected Result:**
- Success toast; move to OTP step
- 6-digit OTP received (expires ~2 min per UI)
- Timer countdown visible

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_002  
**Module:** Authentication  
**Feature:** Reset password — valid OTP  
**Scenario:** Complete reset with correct OTP and new password  
**Priority:** High  
**Type:** Positive  

**Preconditions:** OTP received  

**Test Steps:**
1. Enter OTP, new password, confirm password (match)
2. Submit reset
3. Login with new password

**Test Data:**
- OTP: from email
- New password: `NewPass@456`

**Expected Result:**
- Success; redirect to login
- Old password no longer works
- New password works

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_003  
**Module:** Authentication  
**Feature:** Invalid OTP  
**Scenario:** Enter wrong 6-digit code  
**Priority:** High  
**Type:** Negative  

**Preconditions:** OTP requested  

**Test Steps:**
1. Enter wrong OTP `000000`
2. Submit

**Test Data:** OTP: `000000`  

**Expected Result:**
- API 400: `Invalid verification code. Only the latest code from your email works.`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_004  
**Module:** Authentication  
**Feature:** Expired OTP  
**Scenario:** Use OTP after 2+ minutes  
**Priority:** High  
**Type:** Boundary  

**Preconditions:** OTP requested; wait &gt; 120s  

**Test Steps:**
1. Wait for expiry
2. Submit OTP

**Test Data:** Expired OTP  

**Expected Result:**
- API 400: `Verification code expired. Request a new code.`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_005  
**Module:** Authentication  
**Feature:** Password mismatch on reset  
**Scenario:** New password ≠ confirm password  
**Priority:** High  
**Type:** Validation  

**Preconditions:** On reset step  

**Test Steps:**
1. Enter mismatched passwords
2. Submit

**Test Data:** New: `Abc123`, Confirm: `Abc124`  

**Expected Result:**
- Frontend: password mismatch message (i18n)
- No API call

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_006  
**Module:** Authentication  
**Feature:** OTP length validation  
**Scenario:** Enter 5-digit OTP  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** Reset step  

**Test Steps:**
1. Enter 5 digits only

**Test Data:** OTP: `12345`  

**Expected Result:**
- Frontend: OTP must be 6 digits

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_FP_007  
**Module:** Authentication  
**Feature:** SMTP not configured  
**Scenario:** Request OTP when email service down  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** Email env missing on server  

**Test Steps:**
1. Request OTP

**Test Data:** Any email  

**Expected Result:**
- API 503/400: email service not configured / could not send

**Actual Result:**  
**Status:**  

---

## 6. Role-Based Access Control (RBAC)

---

**Test Case ID:** TC_RBAC_001  
**Module:** Security  
**Feature:** Patient cannot access doctor routes  
**Scenario:** Logged-in patient opens `/doctor`  
**Priority:** High  
**Type:** Security  

**Preconditions:** Logged in as patient  

**Test Steps:**
1. Navigate to `/doctor/appointments`

**Test Data:** Patient session  

**Expected Result:**
- Redirect to `/patient` (role guard)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_RBAC_002  
**Module:** Security  
**Feature:** Doctor cannot access admin  
**Scenario:** Doctor opens `/admin/doctors`  
**Priority:** High  
**Type:** Security  

**Preconditions:** Logged in as approved doctor  

**Test Steps:**
1. Navigate to `/admin`

**Test Data:** Doctor session  

**Expected Result:**
- Redirect to `/doctor`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_RBAC_003  
**Module:** Security  
**Feature:** API without Bearer token  
**Scenario:** `GET /appointments` without Authorization header  
**Priority:** High  
**Type:** Security  

**Preconditions:** Postman  

**Test Steps:**
1. Call protected endpoint without token

**Test Data:** No header  

**Expected Result:**
- API 401: `Unauthorized`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_RBAC_004  
**Module:** Security  
**Feature:** Patient cannot access another patient's EMR  
**Scenario:** Patient A tries patient B's EMR API  
**Priority:** High  
**Type:** Security  

**Preconditions:** Two patient accounts; know patient B id  

**Test Steps:**
1. As Patient A, call EMR endpoint for Patient B's id (if exposed)

**Test Data:** Patient B userId  

**Expected Result:**
- API 403 Forbidden or 404
- No PHI leaked

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_RBAC_005  
**Module:** Security  
**Feature:** Only doctor marks consultation completed  
**Scenario:** Patient PATCH appointment status `completed`  
**Priority:** High  
**Type:** Security  

**Preconditions:** Appointment `in_progress`  

**Test Steps:**
1. As patient, API PATCH status to `completed`

**Test Data:** status: completed  

**Expected Result:**
- API 400: `Only the doctor can mark a consultation as completed`

**Actual Result:**  
**Status:**  

---

## 7. Appointments & Time Slots

---

**Test Case ID:** TC_APT_001  
**Module:** Appointments  
**Feature:** Book video consultation — valid slot  
**Scenario:** Patient books available 30-min slot  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Approved doctor with availability; free slot today/future  

**Test Steps:**
1. `/patient/doctors` → Book doctor
2. Confirm **Video consultation** label (no follow-up/emergency dropdown)
3. Pick future date, available time
4. Confirm booking

**Test Data:** Date: tomorrow; Time: any listed slot  

**Expected Result:**
- Toast: video consultation booked
- Appointment `pending` in DB
- Doctor receives notification
- Slot removed from available list for that date

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_002  
**Module:** Appointments  
**Feature:** Past date booking blocked  
**Scenario:** Select yesterday in date picker  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Booking dialog open  

**Test Steps:**
1. Attempt to select past date (manual entry if needed)

**Test Data:** Yesterday's date  

**Expected Result:**
- Date picker `min` = today (local)
- API returns no slots or booking rejected if bypassed

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_003  
**Module:** Appointments  
**Feature:** Past time slots hidden today  
**Scenario:** Book for today — only future 30-min slots shown  
**Priority:** High  
**Type:** Boundary  

**Preconditions:** Doctor full-day availability; current time 2:00 PM  

**Test Steps:**
1. Book for today
2. Open time dropdown

**Test Data:** Date: today  

**Expected Result:**
- Slots before ~now+15min buffer not listed
- Later slots (e.g. 3:00 PM, 3:30 PM) visible

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_004  
**Module:** Appointments  
**Feature:** Double-book same slot  
**Scenario:** Two patients book same doctor/date/time  
**Priority:** High  
**Type:** Negative  

**Preconditions:** One slot left  

**Test Steps:**
1. Patient A books slot X
2. Patient B immediately books same slot X

**Test Data:** Same doctor, date, time  

**Expected Result:**
- Second booking fails: `This time is not available — choose a free slot`
- Only one appointment in DB for that slot

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_005  
**Module:** Appointments  
**Feature:** Book without selecting time  
**Scenario:** Confirm with empty time  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** Booking dialog  

**Test Steps:**
1. Select date but not time
2. Click Confirm

**Test Data:** Time: empty  

**Expected Result:**
- Confirm button disabled OR validation message
- No API call

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_006  
**Module:** Appointments  
**Feature:** Doctor confirms appointment  
**Scenario:** Doctor changes pending → confirmed  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Pending appointment exists  

**Test Steps:**
1. Doctor → Appointments → Confirm

**Test Data:** Appointment id  

**Expected Result:**
- Status `confirmed`
- Patient notified (email/in-app if configured)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_007  
**Module:** Appointments  
**Feature:** Doctor marks consultation completed  
**Scenario:** After video visit, doctor marks completed from appointments  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Appointment `in_progress`  

**Test Steps:**
1. Doctor → Appointments → Mark completed
2. Optional: enter conclusion/vitals → confirm

**Test Data:** Conclusion text  

**Expected Result:**
- Status `completed`
- EMR consultation record created
- Patient cannot rejoin video for same appointment
- `createVideoSession` rejects completed appointment

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_008  
**Module:** Appointments  
**Feature:** 48 slots per day generation  
**Scenario:** Verify API returns 30-min slots across 24h (within doctor hours)  
**Priority:** Medium  
**Type:** Boundary  

**Preconditions:** Doctor availability 00:00–23:30  

**Test Steps:**
1. `GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD`

**Test Data:** Future date  

**Expected Result:**
- Up to 48 slot labels (minus booked/past)
- Includes AM and PM times (e.g. 12:00 AM … 11:30 PM)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_009  
**Module:** Appointments  
**Feature:** Blocked date  
**Scenario:** Doctor blocks date — no slots  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** Doctor added date to blocked list  

**Test Steps:**
1. Patient tries to book on blocked date

**Test Data:** Blocked date  

**Expected Result:**
- Empty slot list
- Message: no bookable times

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_APT_010  
**Module:** Appointments  
**Feature:** Doctor not accepting appointments  
**Scenario:** `acceptingAppointments: false`  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** Doctor toggled off accepting  

**Test Steps:**
1. Fetch slots for that doctor

**Test Data:** Any date  

**Expected Result:**
- Empty slots array from API

**Actual Result:**  
**Status:**  

---

## 8. Video Consultation

---

**Test Case ID:** TC_VID_001  
**Module:** Video  
**Feature:** Join video — patient  
**Scenario:** Patient joins confirmed/in_progress consultation  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Appointment joinable; backend + signaling running  

**Test Steps:**
1. Patient → Appointments → Join video
2. Allow camera/mic
3. Click Join consultation

**Test Data:** Valid appointment id  

**Expected Result:**
- WebRTC connects (status live or waiting)
- Local preview visible
- Remote audio/video when doctor joins

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_VID_002  
**Module:** Video  
**Feature:** Leave call without completing  
**Scenario:** Doctor/patient leaves — visit stays in_progress  
**Priority:** High  
**Type:** Positive  

**Preconditions:** In active call  

**Test Steps:**
1. Click Leave call
2. Return to appointments
3. Rejoin same appointment

**Test Data:** N/A  

**Expected Result:**
- Appointment still `in_progress`
- Rejoin works for both parties
- No EMR finalize on leave alone

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_VID_003  
**Module:** Video  
**Feature:** Completed appointment cannot rejoin  
**Scenario:** After doctor marks completed, patient tries join  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Appointment `completed`  

**Test Steps:**
1. Patient open consult URL / Join video

**Test Data:** Completed appointment id  

**Expected Result:**
- API error: consultation completed
- UI message; no video session

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_VID_004  
**Module:** Video  
**Feature:** Unauthorized video session  
**Scenario:** Wrong user tries another patient's appointment room  
**Priority:** High  
**Type:** Security  

**Preconditions:** Two users; appointment for patient A  

**Test Steps:**
1. Patient B requests video session token for A's appointment

**Test Data:** Patient B token  

**Expected Result:**
- API 403 / Not authorized for this consultation

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_VID_005  
**Module:** Video  
**Feature:** Mic/camera toggle  
**Scenario:** Mute mic and turn off camera during call  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** In live call  

**Test Steps:**
1. Toggle mic off
2. Toggle camera off
3. Verify peer sees muted/camera off indicators

**Test Data:** N/A  

**Expected Result:**
- Local tracks disabled; camera stays off (no auto re-enable)
- Peer badge shows muted / camera off

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_VID_006  
**Module:** Video  
**Feature:** Polling when doctor completes during call  
**Scenario:** Doctor marks completed while patient still in UI  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Both were in call; doctor completes from appointments page  

**Test Steps:**
1. Doctor marks completed
2. Wait ~12s on patient video page

**Test Data:** N/A  

**Expected Result:**
- Patient session ends with completed message
- Cannot continue call

**Actual Result:**  
**Status:**  

---

## 9. Find Doctors — Search & Filters

---

**Test Case ID:** TC_DOCFIND_001  
**Module:** Patient — Doctors  
**Feature:** Search by name  
**Scenario:** Filter doctors by partial name  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Multiple approved doctors  

**Test Steps:**
1. `/patient/doctors`
2. Search box: partial doctor name

**Test Data:** Search: `Sharma`  

**Expected Result:**
- List filters client-side to matching doctors only

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCFIND_002  
**Module:** Patient — Doctors  
**Feature:** Specialty category filter  
**Scenario:** Click specialty badge  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Doctors in multiple specialties  

**Test Steps:**
1. Click specialty badge (e.g. Cardiology)
2. Verify list

**Test Data:** Specialty filter  

**Expected Result:**
- API refetch with specialty param
- Only matching doctors shown

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCFIND_003  
**Module:** Patient — Doctors  
**Feature:** Language filter  
**Scenario:** Filter by Hindi  
**Priority:** Low  
**Type:** UI  

**Preconditions:** Doctors with language metadata  

**Test Steps:**
1. Set language filter Hindi

**Test Data:** Language: Hindi  

**Expected Result:**
- Doctors listing Hindi in profile shown

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCFIND_004  
**Module:** Patient — Doctors  
**Feature:** Empty search results  
**Scenario:** Search nonsense string  
**Priority:** Low  
**Type:** UI  

**Preconditions:** Doctor list loaded  

**Test Steps:**
1. Search `zzzznonexistent`

**Test Data:** N/A  

**Expected Result:**
- Empty state — no doctors (no crash)

**Actual Result:**  
**Status:**  

---

## 10. Doc Assistant — Upload / OCR / Chat

---

**Test Case ID:** TC_DOCA_001  
**Module:** Doc Assistant  
**Feature:** Upload medical report PDF  
**Scenario:** Valid PDF upload and analysis  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Patient logged in; Cloudinary + AI configured  

**Test Steps:**
1. `/patient/doc-assistant` → Upload tab
2. Upload valid medical PDF (&lt;20MB)
3. Wait for processing

**Test Data:** Valid lab report PDF  

**Expected Result:**
- Progress/scan summary shown
- AI analysis panel populated
- Document in library
- **Download** button only (no Open in Doc Assistant)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_002  
**Module:** Doc Assistant  
**Feature:** Download document only (no open)  
**Scenario:** Verify Open link removed  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Document with fileUrl in library  

**Test Steps:**
1. Open document card in Doc Assistant
2. Look for Open vs Download

**Test Data:** N/A  

**Expected Result:**
- Only **Download** control present
- Download saves correct filename/format via `/files/download`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_003  
**Module:** Doc Assistant  
**Feature:** Invalid report format  
**Scenario:** Upload `.exe` or unsupported type  
**Priority:** High  
**Type:** Validation  

**Preconditions:** Upload UI  

**Test Steps:**
1. Upload unsupported file

**Test Data:** `file.exe`  

**Expected Result:**
- Error: invalid file type (PDF/PNG/JPG/DOCX)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_004  
**Module:** Doc Assistant  
**Feature:** Corrupted PDF upload  
**Scenario:** Upload corrupted/truncated PDF  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Corrupted PDF file  

**Test Steps:**
1. Upload corrupted PDF

**Test Data:** Corrupt PDF bytes  

**Expected Result:**
- Graceful failure message (OCR/extraction failed)
- No app crash; user can retry

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_005  
**Module:** Doc Assistant  
**Feature:** File too large  
**Scenario:** Upload &gt;20MB  
**Priority:** High  
**Type:** Boundary  

**Preconditions:** Large file  

**Test Steps:**
1. Upload 25MB PDF

**Test Data:** 25MB  

**Expected Result:**
- API 413: `File too large. Maximum size is 20MB.`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_006  
**Module:** Doc Assistant  
**Feature:** RAG chat — valid question  
**Scenario:** Ask question about uploaded document  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Document indexed  

**Test Steps:**
1. Chat tab → ask question about report content

**Test Data:** Question: "What is my hemoglobin?"  

**Expected Result:**
- Answer returned in user language (EN/HI per setting)
- Disclaimer that not a substitute for doctor

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_007  
**Module:** Doc Assistant  
**Feature:** Chat — question too short  
**Scenario:** Submit 1-character question  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** Chat UI  

**Test Steps:**
1. Send question `?`

**Test Data:** 1 char  

**Expected Result:**
- API 400: `question required (min 2 characters)`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_008  
**Module:** Doc Assistant  
**Feature:** AI timeout / rate limit  
**Scenario:** Gemini rate limit during upload  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** Simulate API quota exceeded  

**Test Steps:**
1. Upload document when Gemini RPM exceeded

**Test Data:** N/A  

**Expected Result:**
- User-friendly message (rate limit / retry later)
- Partial results or scan-only mode if configured
- No infinite spinner

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_009  
**Module:** Doc Assistant  
**Feature:** Prescription image upload OCR  
**Scenario:** Upload prescription photo  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Clear prescription image  

**Test Steps:**
1. Upload prescription image (JPG)
2. Review extracted medicines

**Test Data:** Rx image  

**Expected Result:**
- Medicines list extracted (Tesseract/Gemini per config)
- Saved to library/EMR uploads

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DOCA_010  
**Module:** Doc Assistant  
**Feature:** Unsupported scan format  
**Scenario:** Upload BMP/TIFF medical image  
**Priority:** Medium  
**Type:** Validation  

**Preconditions:** Upload  

**Test Steps:**
1. Upload `.bmp` or `.tiff`

**Test Data:** Unsupported image  

**Expected Result:**
- Rejected at upload filter with clear message

**Actual Result:**  
**Status:**  

---

## 11. AI Symptom Scanner

---

**Test Case ID:** TC_AI_001  
**Module:** AI Symptom Scanner  
**Feature:** Symptom scan — mild symptoms  
**Scenario:** Enter mild isolated symptoms  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Patient logged in  

**Test Steps:**
1. `/patient/ai-scanner`
2. Enter mild symptoms (e.g. mild headache)
3. Run scan

**Test Data:** "mild headache for 1 day"  

**Expected Result:**
- Severity tier Low/Moderate (not Critical for mild only)
- Health score vs screening risk explained
- Recommendation text shown

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AI_002  
**Module:** AI Symptom Scanner  
**Feature:** Emergency keyword detection  
**Scenario:** Enter chest pain + unconscious keywords  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Scanner available  

**Test Steps:**
1. Enter emergency-like symptoms
2. Run scan

**Test Data:** "severe chest pain, difficulty breathing"  

**Expected Result:**
- High/Critical severity
- Urgent care messaging
- Optional book doctor CTA

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AI_003  
**Module:** AI Symptom Scanner  
**Feature:** Empty symptom submission  
**Scenario:** Submit without symptoms  
**Priority:** High  
**Type:** Validation  

**Preconditions:** Scanner form  

**Test Steps:**
1. Submit empty

**Test Data:** Empty  

**Expected Result:**
- API 400: `Add at least one symptom or description`
- Frontend validation if present

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AI_004  
**Module:** AI Symptom Scanner  
**Feature:** Hindi locale answer  
**Scenario:** UI language HI — scan returns Hindi text  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Language = Hindi  

**Test Steps:**
1. Switch to Hindi
2. Run symptom scan

**Test Data:** Hindi UI  

**Expected Result:**
- Recommendation/summary in Hindi
- Retrieval still uses EN internally (no wrong language mix in UI)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_AI_005  
**Module:** AI Symptom Scanner  
**Feature:** AI service down  
**Scenario:** Backend AI key missing  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** `GEMINI_API_KEY` empty  

**Test Steps:**
1. Run scan

**Test Data:** Any symptoms  

**Expected Result:**
- Graceful error toast
- No uncaught exception in UI

**Actual Result:**  
**Status:**  

---

## 12. File Download

---

**Test Case ID:** TC_DL_001  
**Module:** Files  
**Feature:** Download report — authenticated  
**Scenario:** Patient downloads own report from EMR  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Report with Cloudinary URL; logged in  

**Test Steps:**
1. EMR → report → Download
2. Check downloaded file

**Test Data:** Report PDF  

**Expected Result:**
- File downloads with correct name/extension
- Opens correctly locally
- API `GET /files/download?url=&filename=` with Bearer token

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DL_002  
**Module:** Files  
**Feature:** Download without login  
**Scenario:** Unauthenticated download API  
**Priority:** High  
**Type:** Security  

**Preconditions:** No token  

**Test Steps:**
1. Call `/api/v1/files/download` without Authorization

**Test Data:** Valid cloudinary URL  

**Expected Result:**
- API 401 Unauthorized

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DL_003  
**Module:** Files  
**Feature:** Open redirect blocked  
**Scenario:** Download API with evil URL  
**Priority:** High  
**Type:** Security  

**Preconditions:** Logged in  

**Test Steps:**
1. `GET /files/download?url=https://evil.com/malware.exe`

**Test Data:** Non-Cloudinary URL  

**Expected Result:**
- API 400: `File URL is not allowed`

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_DL_004  
**Module:** Files  
**Feature:** Admin download doctor certificate  
**Scenario:** Admin downloads certificate from doctor verification  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Pending doctor with certificate  

**Test Steps:**
1. Admin → Doctors → Download certificate

**Test Data:** Doctor application  

**Expected Result:**
- PDF/image downloads with meaningful filename

**Actual Result:**  
**Status:**  

---

## 13. EMR & Clinical

---

**Test Case ID:** TC_EMR_001  
**Module:** EMR  
**Feature:** Patient views own EMR  
**Scenario:** Patient opens health record  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Patient with scan/appointment history  

**Test Steps:**
1. `/patient/emr`
2. Review sections

**Test Data:** Patient session  

**Expected Result:**
- Vitals, consultations, reports, scans listed
- Download available on documents; no broken PHI layout

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_EMR_002  
**Module:** EMR  
**Feature:** Doctor views patient EMR after consult  
**Scenario:** Doctor opens patient EMR from patients list  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Doctor has consulted patient  

**Test Steps:**
1. Doctor → Patients → Open EMR

**Test Data:** Linked patient  

**Expected Result:**
- Full EMR visible
- Can add clinical notes / review reports

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_EMR_003  
**Module:** EMR  
**Feature:** Doctor cannot view unlinked patient  
**Scenario:** Doctor never consulted patient X  
**Priority:** High  
**Type:** Security  

**Preconditions:** Patient X never seen by doctor  

**Test Steps:**
1. Doctor navigates to patient X EMR URL directly

**Test Data:** Patient X id  

**Expected Result:**
- Access denied message: no consultation history

**Actual Result:**  
**Status:**  

---

## 14. Admin — Doctor Verification

---

**Test Case ID:** TC_ADM_DOC_001  
**Module:** Admin  
**Feature:** Approve doctor  
**Scenario:** Admin approves pending doctor  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Pending doctor application  

**Test Steps:**
1. `/admin/doctors` → Pending tab
2. Approve & go live

**Test Data:** Pending doctor  

**Expected Result:**
- Status approved; visible on patient doctor search
- Doctor can login

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_ADM_DOC_002  
**Module:** Admin  
**Feature:** Reject doctor  
**Scenario:** Admin rejects with reason  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Pending doctor  

**Test Steps:**
1. Reject → optional reason → confirm

**Test Data:** Reason text  

**Expected Result:**
- Doctor removed or marked rejected
- Cannot login until re-register

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_ADM_DOC_003  
**Module:** Admin  
**Feature:** View certificate  
**Scenario:** Admin opens/views certificate link  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Certificate uploaded  

**Test Steps:**
1. View certificate link on pending card

**Test Data:** N/A  

**Expected Result:**
- Certificate opens in new tab OR download works

**Actual Result:**  
**Status:**  

---

## 15. Notifications

---

**Test Case ID:** TC_NOTIF_001  
**Module:** Notifications  
**Feature:** Appointment notification  
**Scenario:** Patient receives notification after booking  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Booking succeeded  

**Test Steps:**
1. Book appointment
2. Open `/patient/notifications`

**Test Data:** N/A  

**Expected Result:**
- New notification: appointment requested/pending

**Actual Result:**  
**Status:**  

---

## 16. Profile & Settings

---

**Test Case ID:** TC_SET_001  
**Module:** Settings  
**Feature:** Update profile name  
**Scenario:** User updates display name  
**Priority:** Medium  
**Type:** Positive  

**Preconditions:** Logged in  

**Test Steps:**
1. Settings → change name → save

**Test Data:** New name  

**Expected Result:**
- PATCH `/auth/me/profile` succeeds
- Navbar shows updated name

**Actual Result:**  
**Status:**  

---

## 17. API / Network Failures

---

**Test Case ID:** TC_API_001  
**Module:** Infrastructure  
**Feature:** Backend down  
**Scenario:** Stop backend; use frontend  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Backend stopped  

**Test Steps:**
1. Login or fetch appointments

**Test Data:** N/A  

**Expected Result:**
- Toast/network error (not blank screen)
- No infinite loading without message

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_API_002  
**Module:** Infrastructure  
**Feature:** Wrong VITE_API_URL  
**Scenario:** Frontend points to wrong port  
**Priority:** High  
**Type:** Negative  

**Preconditions:** `VITE_API_URL` wrong in `.env`  

**Test Steps:**
1. Open register/login

**Test Data:** Missing API URL  

**Expected Result:**
- Console warning in dev
- Specialty fallback list on register (if implemented)
- Clear failure on API actions

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_API_003  
**Module:** Infrastructure  
**Feature:** MongoDB down  
**Scenario:** Backend running, DB unreachable  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Invalid `MONGODB_URI`  

**Test Steps:**
1. Start backend
2. Any API call

**Test Data:** N/A  

**Expected Result:**
- Startup fails with clear MongoDB error OR 500 on requests
- No silent success

**Actual Result:**  
**Status:**  

---

## 18. UI / UX / Responsive

---

**Test Case ID:** TC_UI_001  
**Module:** UI  
**Feature:** Loading states  
**Scenario:** Slow network on doctor list  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Throttle network in DevTools  

**Test Steps:**
1. Open `/patient/doctors`

**Test Data:** Slow 3G  

**Expected Result:**
- Loading indicator shown
- Content appears when loaded

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_UI_002  
**Module:** UI  
**Feature:** Empty appointments  
**Scenario:** New patient with no appointments  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Fresh patient account  

**Test Steps:**
1. `/patient/appointments`

**Test Data:** N/A  

**Expected Result:**
- Empty state message (no crash)

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_UI_003  
**Module:** UI  
**Feature:** Mobile responsive — booking dialog  
**Scenario:** Book appointment on 375px width  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Mobile viewport  

**Test Steps:**
1. Book doctor flow on mobile

**Test Data:** iPhone viewport  

**Expected Result:**
- Dialog usable; date/time pickers accessible
- Buttons not clipped

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_UI_004  
**Module:** UI  
**Feature:** Specialty sidebar mobile  
**Scenario:** Doctor registration specialty picker on mobile  
**Priority:** Medium  
**Type:** UI  

**Preconditions:** Mobile viewport  

**Test Steps:**
1. Register as doctor → specialty picker

**Test Data:** Mobile  

**Expected Result:**
- Horizontal category scroll + selectable specialties

**Actual Result:**  
**Status:**  

---

## 19. Healthcare / Privacy / HIPAA-Oriented

---

**Test Case ID:** TC_HC_001  
**Module:** Healthcare Compliance  
**Feature:** PHI not in browser console  
**Scenario:** Check console during EMR view  
**Priority:** High  
**Type:** Security  

**Preconditions:** EMR with sensitive data  

**Test Steps:**
1. Open EMR
2. Inspect console logs

**Test Data:** N/A  

**Expected Result:**
- No full PHI dumped in console in production build
- `VITE_VIDEO_DEBUG` false in prod

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_002  
**Module:** Healthcare Compliance  
**Feature:** JWT not in URL  
**Scenario:** Verify token not passed in query strings  
**Priority:** High  
**Type:** Security  

**Preconditions:** Logged in  

**Test Steps:**
1. Navigate app; inspect network URLs

**Test Data:** N/A  

**Expected Result:**
- Token only in Authorization header / localStorage
- Not in shareable URL query params

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_003  
**Module:** Healthcare Compliance  
**Feature:** AI disclaimer  
**Scenario:** Symptom scanner shows non-diagnostic disclaimer  
**Priority:** High  
**Type:** UI  

**Preconditions:** After scan  

**Test Steps:**
1. Complete AI symptom scan
2. Read disclaimers

**Test Data:** N/A  

**Expected Result:**
- Clear that AI is not a diagnosis
- Advises professional care for emergencies

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_004  
**Module:** Healthcare Compliance  
**Feature:** Incorrect medical data — doctor review  
**Scenario:** Doctor reviews AI report and adds correction  
**Priority:** High  
**Type:** Positive  

**Preconditions:** Report with AI analysis  

**Test Steps:**
1. Doctor → Reports → select report
2. Submit clinical review / correction

**Test Data:** Review notes  

**Expected Result:**
- Doctor review saved
- Patient sees updated clinical context where applicable

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_005  
**Module:** Healthcare Compliance  
**Feature:** OCR extraction failure messaging  
**Scenario:** Unreadable prescription image  
**Priority:** High  
**Type:** Negative  

**Preconditions:** Blurry Rx photo  

**Test Steps:**
1. Upload blurry prescription

**Test Data:** Blurry image  

**Expected Result:**
- Message that extraction failed / low confidence
- Does not invent dangerous drug dosages silently

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_006  
**Module:** Healthcare Compliance  
**Feature:** Duplicate patient records  
**Scenario:** Same person registers twice with different emails  
**Priority:** Medium  
**Type:** Negative  

**Preconditions:** None  

**Test Steps:**
1. Register patient A with email1
2. Register patient B with email2 (same person)

**Test Data:** Two emails  

**Expected Result:**
- Two separate patient records (by design)
- Admin can see both in user list — manual merge N/A unless feature exists

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_007  
**Module:** Healthcare Compliance  
**Feature:** Sensitive fields in API response  
**Scenario:** Verify password hash never returned  
**Priority:** High  
**Type:** Security  

**Preconditions:** Login/me endpoint  

**Test Steps:**
1. Inspect `GET /auth/me` response

**Test Data:** N/A  

**Expected Result:**
- No `passwordHash` in JSON
- Only public user fields

**Actual Result:**  
**Status:**  

---

**Test Case ID:** TC_HC_008  
**Module:** Healthcare Compliance  
**Feature:** Session timeout behavior  
**Scenario:** Use expired token after 7 days (JWT_EXPIRES_IN)  
**Priority:** Medium  
**Type:** Security  

**Preconditions:** JWT expired  

**Test Steps:**
1. Use old token for API call

**Test Data:** Expired JWT  

**Expected Result:**
- 401; user prompted to re-login

**Actual Result:**  
**Status:**  

---

## 20. Browser Compatibility (Smoke)

| TC ID | Browser | Scenario | Expected | Actual | Status |
|-------|---------|----------|----------|--------|--------|
| TC_BR_001 | Chrome latest | Login + book + video | Full flow works | | |
| TC_BR_002 | Firefox latest | Login + upload report | Works | | |
| TC_BR_003 | Edge latest | Doctor approve patient | Works | | |
| TC_BR_004 | Safari (if supported) | Video consult | WebRTC works or clear unsupported msg | | |

---

## 21. Performance (Smoke)

| TC ID | Scenario | Steps | Expected | Actual | Status |
|-------|----------|-------|----------|--------|--------|
| TC_PERF_001 | Doctor list load | Open `/patient/doctors` with 50+ doctors | Loads &lt; 5s on normal network | | |
| TC_PERF_002 | Large PDF upload | Upload 15MB PDF | Progress shown; completes or clear timeout | | |
| TC_PERF_003 | Analytics charts | Open patient analytics | Charts render without freezing UI | | |

---

## 22. Rate Limiting (If Enabled)

| TC ID | Scenario | Expected | Actual | Status |
|-------|----------|----------|--------|--------|
| TC_RATE_001 | Rapid Gemini calls on upload | Queue/spacing; user message on quota | | |
| TC_RATE_002 | Rapid login attempts | No account lockout OR graceful 429 (document actual behavior) | | |

*Note: Explicit HTTP rate limiting may not be configured — verify `AI_GEMINI_RPM` behavior under load.*

---

## 23. Payments

**Not applicable** — Telemed Aura v1 does not implement payment gateway (appointments use `fee: 0`). Skip unless Stripe/Razorpay is added.

---

## Execution Notes for QA

| Item | Value |
|------|--------|
| Test environments | Local (`localhost:8080` + `localhost:4000`), Staging, Production |
| Required `.env` | `backend/.env`: MongoDB, JWT, Cloudinary, Gemini, SMTP; `frontend/.env`: `VITE_API_URL` |
| Test accounts | 1 patient, 1 approved doctor, 1 admin, 1 pending doctor |
| Video testing | Two browsers/profiles for patient + doctor |
| HIPAA | Formal HIPAA compliance requires organizational controls; these cases cover technical privacy basics |

---

*Document generated for Telemed Aura codebase audit. Expand Actual Result and Status columns during test cycles. For automated regression, map high-priority cases to E2E (Playwright/Cypress) separately.*
