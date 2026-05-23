# DOCUMENT 5 — Tools Used (10 Marks)

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System

---

## 1. Executive Summary

Telemed Aura is built as a **TypeScript monorepo** with a React/Vite frontend, Express/MongoDB backend, Google Gemini for AI, Cloudinary for media, and Socket.IO for WebRTC signaling. Tool choices prioritize rapid hackathon delivery, rural-network video performance, and **rules-first** clinical safety for AI outputs.

---

## 2. Complete Tool Inventory

| Category | Tools |
|----------|-------|
| **Frontend** | React 19, Vite 7, TanStack Router/Start, Tailwind CSS 4, shadcn/ui, Radix UI, Axios, Socket.IO Client, Zustand, TanStack Query, react-hook-form, Zod, i18next, Recharts, Framer Motion, Sonner |
| **Backend** | Node.js, Express 4, TypeScript, Mongoose, Socket.IO, Zod, Helmet, CORS, Multer, bcryptjs, JWT, express-rate-limit, express-mongo-sanitize |
| **Database** | MongoDB (Atlas or local) |
| **AI** | @google/generative-ai, Tesseract.js, pdf-parse, mammoth, custom rules/ML in `services/ai/` |
| **Cloud** | Cloudinary |
| **Email** | Nodemailer (Gmail SMTP) |
| **Auth** | jsonwebtoken, bcryptjs |
| **Deployment** | Vercel (frontend), Render (API) per `.env.example`; Cloudflare Wrangler optional |
| **Quality** | ESLint, Prettier, TypeScript compiler |
| **VCS** | Git, GitHub |

---

## 3. Detailed Tool Analysis

### 3.1 Frontend

#### React 19
| Field | Detail |
|-------|--------|
| **Category** | UI library |
| **Purpose** | Component-based SPA |
| **Why selected** | Industry standard; hooks; large ecosystem |
| **Usage** | All `frontend/src/routes/*`, components |
| **Advantages** | Reusable UI; concurrent features |
| **Limitations** | Requires discipline for state split |

#### Vite 7
| Field | Detail |
|-------|--------|
| **Category** | Build tool / dev server |
| **Purpose** | Fast HMR and production bundles |
| **Why selected** | Speed vs webpack; TanStack Start integration |
| **Usage** | `npm run dev`, `vite build` |
| **Advantages** | ESM-native dev experience |
| **Limitations** | SSR/edge config complexity |

#### TanStack Router + React Start
| Field | Detail |
|-------|--------|
| **Category** | Routing / meta-framework |
| **Purpose** | File-based routes (`routeTree.gen.ts`), typed navigation |
| **Usage** | 41 route files under `frontend/src/routes/` |
| **Advantages** | Type-safe params; code splitting |
| **Limitations** | Learning curve |

#### Tailwind CSS 4 + shadcn/ui
| Field | Detail |
|-------|--------|
| **Category** | Styling / components |
| **Purpose** | Healthcare dashboard UI |
| **Usage** | `components/ui/*`, dashboards |
| **Advantages** | Accessible Radix primitives; rapid styling |
| **Limitations** | Verbose utility classes |

#### Axios + custom client
| Field | Detail |
|-------|--------|
| **Category** | HTTP |
| **Purpose** | REST with JWT, `Accept-Language`, `unwrapApiData` |
| **Usage** | `frontend/src/lib/api/client.ts` |
| **Advantages** | Interceptors for 401 logout |
| **Limitations** | Manual typing per endpoint |

#### Socket.IO Client
| Field | Detail |
|-------|--------|
| **Category** | Real-time |
| **Purpose** | WebRTC signaling |
| **Usage** | `useVideoCall.ts` |
| **Advantages** | Reconnection handling |
| **Limitations** | Must match server version |

#### react-i18next
| Field | Detail |
|-------|--------|
| **Category** | i18n |
| **Purpose** | English/Hindi for rural users |
| **Usage** | `i18n/locales/en.json`, `hi.json` |
| **Advantages** | JSON-driven translations |
| **Limitations** | Partial coverage on some admin screens |

#### Sonner
| Field | Detail |
|-------|--------|
| **Category** | UX / notifications |
| **Purpose** | Toast success/error (no `alert()`) |
| **Usage** | `__root.tsx` Toaster, `lib/api/toast.ts` |

#### Zustand + TanStack Query
| Field | Detail |
|-------|--------|
| **Category** | State |
| **Purpose** | Auth persist vs server cache |
| **Usage** | `auth-store.ts`, appointment/report hooks |

---

### 3.2 Backend

#### Node.js + Express 4
| Field | Detail |
|-------|--------|
| **Category** | Runtime / API |
| **Purpose** | REST + middleware pipeline |
| **Usage** | `backend/src/app.ts`, `modules/*` |
| **Advantages** | Mature middleware (helmet, cors, rate-limit) |
| **Limitations** | Single-threaded CPU |

#### TypeScript 5.8
| Field | Detail |
|-------|--------|
| **Category** | Language |
| **Purpose** | Shared typing frontend/backend |
| **Advantages** | Compile-time API safety |
| **Limitations** | Build step required |

#### Mongoose 9
| Field | Detail |
|-------|--------|
| **Category** | ODM |
| **Purpose** | 16 health-related schemas |
| **Usage** | `database/models/*.model.ts` |
| **Advantages** | Flexible documents for varied reports |
| **Limitations** | App-level consistency for relations |

#### Zod
| Field | Detail |
|-------|--------|
| **Category** | Validation |
| **Purpose** | Request validation (`shared/validations/*`) |
| **Usage** | Auth, appointments, AI, clinical, reviews routes |
| **Advantages** | Clear error messages for users |
| **Limitations** | Schemas must stay synced with frontend forms |

#### Socket.IO (server)
| Field | Detail |
|-------|--------|
| **Category** | Signaling |
| **Purpose** | WebRTC on same port as API (`index.ts`) |
| **Advantages** | Single deploy URL for rural setups |
| **Limitations** | Sticky sessions if horizontally scaled |

#### express-rate-limit + express-mongo-sanitize
| Field | Detail |
|-------|--------|
| **Category** | Security |
| **Purpose** | Brute-force protection; NoSQL injection prevention |
| **Usage** | `rate-limit.middleware.ts`, `app.ts` |

---

### 3.3 Database — MongoDB

| Field | Detail |
|-------|--------|
| **Purpose** | Store users, appointments, reports, AI chunks, notifications |
| **Why selected** | JSON-like documents fit heterogeneous medical data |
| **Usage** | `MONGODB_URI`, `MONGODB_DB_NAME` in `.env` |
| **Advantages** | Flexible schema; Atlas hosting |
| **Limitations** | SRV DNS issues on some networks (documented in `backend/docs/ENV.md`) |

---

### 3.4 AI & Document Processing

#### Google Generative AI SDK
| Field | Detail |
|-------|--------|
| **Purpose** | Symptom enrichment, vision, synthesis, RAG answers |
| **Usage** | `services/ai/models/gemini-client.ts` |
| **Advantages** | Multimodal in one API |
| **Limitations** | Rate limits; requires `GEMINI_API_KEY`; non-deterministic |

#### Tesseract.js + pdf-parse + mammoth
| Field | Detail |
|-------|--------|
| **Purpose** | OCR and document text extraction |
| **Usage** | `services/ai/extraction/` |
| **Advantages** | Runs in Node without external binaries |
| **Limitations** | OCR quality on poor scans |

#### Custom rules engines
| Field | Detail |
|-------|--------|
| **Purpose** | Deterministic severity, lab parsing, triage |
| **Usage** | `severity-engine.ts`, `symptom-triage.rules.ts` |
| **Advantages** | Auditable for hackathon judges |
| **Limitations** | Manual maintenance as rules grow |

---

### 3.5 Cloud & Integrations

#### Cloudinary
| Field | Detail |
|-------|--------|
| **Purpose** | Doctor certificates, report/Rx uploads, CDN URLs |
| **Usage** | `cloudinary.service.ts` |
| **Advantages** | CDN + transforms |
| **Limitations** | Requires env credentials |

#### Nodemailer
| Field | Detail |
|-------|--------|
| **Purpose** | OTP, appointment emails, AI alerts |
| **Usage** | `mail.service.ts`, `services/email/` |
| **Limitations** | Gmail sending limits |

---

### 3.6 Authentication

#### jsonwebtoken + bcryptjs
| Field | Detail |
|-------|--------|
| **Purpose** | Stateless sessions; password hashing (10 rounds) |
| **Usage** | `auth.service.ts`, `telemed-auth-token` in localStorage |
| **Advantages** | Horizontally scalable API |
| **Limitations** | localStorage XSS risk mitigated by Helmet; not HttpOnly cookies |

---

### 3.7 Deployment

| Platform | Role |
|----------|------|
| **Vercel** | Frontend static/SSR deploy (`frontend/.env.example`) |
| **Render** | Node API + Socket.IO (`API_PUBLIC_URL`) |
| **Cloudflare Workers** | Optional via `wrangler.jsonc` + `@cloudflare/vite-plugin` |

---

### 3.8 Testing & Quality (Current vs Recommended)

| Tool | Status | Role |
|------|--------|------|
| Manual browser QA | **Active** | Primary per `DOCUMENT_04` |
| ESLint + Prettier | **Active** | Static style/lint |
| Vitest | Recommended | Unit test rules/slots |
| Playwright | Recommended | E2E login → book → consult |
| Postman | Optional | API regression collection |

---

## 4. Architecture Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | `frontend/` + `backend/` | Clear separation; single Git repo |
| Rules-first AI | Custom engines + Gemini assist | Safety; explainable severity |
| Signaling on API port | Single `httpServer` | Simpler deployment for demos |
| Standard API envelope | `{ success, message, data }` | Professional errors for hackathon |
| No payments | `fee: 0` | Focus on care delivery MVP |

---

## 5. Environment Configuration Files

| File | Purpose |
|------|---------|
| `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, Cloudinary, email |
| `frontend/.env` | `VITE_API_URL`, `VITE_VIDEO_SERVICE_URL` |
| `frontend/.env.example` | Production URL templates |
| `docs/ERROR_HANDLING.md` | API error contract |
| `docs/IMPLEMENTATION_PLAN.md` | Phase roadmap |
| `backend/services/ai/ARCHITECTURE.md` | AI pipeline design |

---

*End of Document 5*
