# DOCUMENT 5 — Tools Used (10 Marks)

**Project:** Telemed Aura — AI-Enabled Telehealth & Patient Data System

---

## 1. Tool Inventory Summary

| Category | Tools |
|----------|-------|
| Frontend | React, Vite, TanStack Router/Start, Tailwind CSS, shadcn/ui, Radix UI, Axios, Socket.IO Client, Zustand, React Query, i18next, Recharts, Framer Motion |
| Backend | Node.js, Express, TypeScript, Mongoose, Socket.IO, Zod, Helmet, CORS, Multer, bcryptjs, JWT |
| Database | MongoDB (Atlas or local) |
| AI / ML | Google Generative AI SDK, Tesseract.js, pdf-parse, mammoth, custom rules engines |
| Cloud / Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Deployment | Vercel (frontend), Render (API per `.env.example`), Cloudflare Workers plugin (wrangler.jsonc) |
| DevOps / VCS | Git, GitHub |
| Quality | ESLint, Prettier, TypeScript compiler |
| Real-time | WebRTC, Socket.IO signaling |

---

## 2. Detailed Tool Justifications

### 2.1 Frontend Stack

#### React 19
| Attribute | Detail |
|-----------|--------|
| **Category** | UI framework |
| **Purpose** | Component-based SPA/SSR UI |
| **Why selected** | Ecosystem maturity, team familiarity, rich component libraries |
| **Usage** | All `frontend/src/routes/*`, features, layouts |
| **Advantages** | Hooks, concurrent features, large community |
| **Limitations** | Requires discipline for state; no built-in routing |

#### Vite 7
| Category | Build tool / dev server |
| Purpose | Fast HMR, production bundling |
| Why selected | Faster than CRA/webpack for TanStack Start |
| Usage | `npm run dev`, `vite build` |
| Advantages | ESM-native, plugin ecosystem (`@vitejs/plugin-react`) |
| Limitations | SSR/edge config complexity with TanStack Start |

#### TanStack Router + React Start
| Category | Routing / meta-framework |
| Purpose | File-based routes, type-safe navigation, SSR option |
| Why selected | Matches `routeTree.gen.ts` pattern; integrated with Vite |
| Usage | `frontend/src/routes/`, `router.tsx` |
| Advantages | Type-safe params, code splitting |
| Limitations | Learning curve vs React Router |

#### Tailwind CSS 4 + shadcn/ui + Radix
| Category | Styling / components |
| Purpose | Accessible, consistent healthcare UI |
| Why selected | Rapid hackathon UI; WCAG-friendly primitives |
| Usage | `components/ui/*`, dashboard cards |
| Advantages | Customizable, no runtime CSS-in-JS cost |
| Limitations | Verbose class names; theme migration effort |

#### Axios
| Category | HTTP client |
| Purpose | REST calls with interceptors for JWT + `Accept-Language` |
| Usage | `frontend/src/lib/api/*` |
| Advantages | Interceptors, wide adoption |
| Limitations | Heavier than fetch; manual typing |

#### Socket.IO Client
| Category | Real-time |
| Purpose | WebRTC signaling (offer/answer/ICE) |
| Usage | `useVideoCall.ts`, `signaling-client.ts` |
| Advantages | Reconnection, room semantics |
| Limitations | Requires compatible server; not pure WebSocket |

#### react-i18next
| Category | Internationalization |
| Purpose | English/Hindi for rural users |
| Usage | `i18n/`, `LanguageSwitcher.tsx` |
| Advantages | JSON locale files, React hooks |
| Limitations | Incomplete coverage on some doctor/admin pages |

#### Zustand + TanStack Query
| Category | State management |
| Purpose | Client UI state vs server cache |
| Usage | Auth store, appointment/report hooks |
| Advantages | Minimal boilerplate (Zustand); caching (Query) |
| Limitations | Two patterns to learn |

---

### 2.2 Backend Stack

#### Node.js + Express 4
| Category | Runtime / API framework |
| Purpose | REST API, middleware pipeline |
| Why selected | Simple module layout, vast middleware ecosystem |
| Usage | `backend/src/app.ts`, all `modules/*` |
| Advantages | Fast to prototype; `helmet`, `cors` integration |
| Limitations | Single-threaded CPU; manual structure discipline |

#### TypeScript 5.8
| Category | Language |
| Purpose | Type safety across frontend and backend |
| Usage | Entire monorepo `.ts`/`.tsx` |
| Advantages | Catches API contract errors at compile time |
| Limitations | Build step; occasional `@types` gaps |

#### Mongoose 9
| Category | ODM |
| Purpose | MongoDB schemas, indexes, population |
| Usage | `backend/src/database/models/*` |
| Advantages | Schema validation, middleware hooks |
| Limitations | Not relational; migration tooling manual |

#### Zod
| Category | Validation |
| Purpose | Request body validation in controllers |
| Usage | Auth, appointments, AI controllers |
| Advantages | Runtime + inferred types |
| Limitations | Duplicate schemas if not shared with frontend |

#### Socket.IO (server)
| Category | Signaling |
| Purpose | WebRTC negotiation on same port as API |
| Usage | `signaling/socket.server.ts` |
| Advantages | Unified deployment (no separate video port required locally) |
| Limitations | Sticky sessions needed if horizontally scaled |

#### Multer
| Category | File upload |
| Purpose | Multipart handling (reports, doctor certs) |
| Usage | `upload.middleware.ts` (20MB limit) |
| Advantages | Express-native |
| Limitations | Memory/disk storage config must be monitored |

---

### 2.3 Database

#### MongoDB
| Category | NoSQL database |
| Purpose | Flexible health documents (reports, scans, EMR) |
| Why selected | JSON-like documents fit varied medical payloads |
| Usage | Atlas `MONGODB_URI` or local instance |
| Advantages | Horizontal scaling, flexible schema |
| Limitations | No joins; application-level consistency; SRV DNS issues on some networks (documented in `backend/docs/ENV.md`) |

---

### 2.4 AI & Document Processing

#### Google Generative AI (`@google/generative-ai`)
| Category | LLM / multimodal |
| Purpose | Symptom enrichment, vision for scans, synthesis, RAG answers |
| Why selected | Strong multimodal; single API for text+image |
| Usage | `services/ai/models/gemini-client.ts`, vision, synthesis |
| Advantages | Cost guards (`cost-guard.ts`), model fallbacks in logs |
| Limitations | Rate limits; requires API key; non-deterministic |

#### Tesseract.js
| Category | OCR |
| Purpose | Extract text from scanned images |
| Usage | `extraction/` pipeline |
| Advantages | Runs in Node without external binary |
| Limitations | Slower than native Tesseract; accuracy on poor scans |

#### pdf-parse / mammoth
| Category | Document extraction |
| Purpose | PDF and DOCX text extraction |
| Usage | Report/prescription pipelines |
| Advantages | Pure JS integration |
| Limitations | Complex PDF layouts may parse poorly |

#### Custom Rules Engines
| Category | Domain logic |
| Purpose | Deterministic severity, lab parsing, triage |
| Usage | `rules/severity-engine.ts`, `symptom-triage.rules.ts` |
| Advantages | Auditable, hackathon-safe (not black-box ML only) |
| Limitations | Maintenance as medical rules grow |

---

### 2.5 Cloud & Integrations

#### Cloudinary
| Category | Media CDN |
| Purpose | Doctor certificates, report uploads, secure URLs |
| Usage | `cloudinary.service.ts` |
| Advantages | Transformations, CDN delivery |
| Limitations | Requires credentials; costs at scale |

#### Nodemailer
| Category | Email |
| Purpose | OTP, appointment emails, AI alerts |
| Usage | `services/email/`, `mail.service.ts` |
| Advantages | SMTP flexibility (Gmail) |
| Limitations | Gmail app-password limits; not for bulk marketing |

---

### 2.6 Authentication & Security

#### jsonwebtoken + bcryptjs
| Category | Auth |
| Purpose | Stateless sessions, password hashing |
| Usage | `auth.service.ts`, `auth.middleware.ts` |
| Advantages | Standard pattern, easy horizontal scaling |
| Limitations | Token in `localStorage` — XSS risk mitigated by CSP/Helmet but not HttpOnly cookies |

#### Helmet + CORS
| Category | Security headers |
| Purpose | HTTP hardening, origin allowlist |
| Usage | `app.ts`, `frontend-origins.ts` |

---

### 2.7 Deployment & Infrastructure

#### Vercel (documented)
| Category | Frontend hosting |
| Purpose | Deploy TanStack/Vite app |
| Usage | `frontend/.env.example` production URLs |
| Advantages | Git integration, CDN |
| Limitations | Serverless limits for long-running processes |

#### Render (documented)
| Category | Backend hosting |
| Purpose | Host Express + Socket.IO |
| Usage | `API_PUBLIC_URL`, `VITE_API_URL` examples |
| Advantages | Simple Node deploy |
| Limitations | WebSocket timeout configuration needed |

#### Cloudflare Wrangler
| Category | Edge deploy (optional) |
| Purpose | `wrangler.jsonc` for Workers compatibility |
| Usage | `frontend/wrangler.jsonc`, `@cloudflare/vite-plugin` |
| Advantages | Edge SSR potential |
| Limitations | `nodejs_compat` required; not primary doc path |

---

### 2.8 Development & Quality Tools

| Tool | Purpose | Advantages | Limitations |
|------|---------|------------|-------------|
| **tsx** | Run TS without pre-build in dev | Fast iteration | Not for production |
| **ESLint 9** | Lint TS/TSX | Catches common bugs | No runtime guarantees |
| **Prettier** | Formatting | Consistent style | Subjective rules |
| **Git / GitHub** | VCS, collaboration | Branching, PRs | Manual review quality |
| **Bun lockfile** (frontend) | Package management | Fast installs | Team must agree on package manager |

---

### 2.9 Testing Tools (Gap Analysis)

| Tool | Status | Recommendation |
|------|--------|----------------|
| Jest/Vitest | Not in repo | Add for rules/unit tests |
| Playwright | Not in repo | E2E for TC-008 consult path |
| Postman | External | API regression collection |
| k6 | Not in repo | Load test `/ai/symptom-scan` |

---

## 3. Architecture Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | `frontend/` + `backend/` | Clear separation; shared hackathon repo |
| Rules-first AI severity | Custom engines + Gemini assist | Safety, explainability for judges |
| Signaling on API port | Single `httpServer` | Simpler rural deployment (one URL) |
| MongoDB | Document store | Heterogeneous medical JSON |
| No payment gateway | Scope control | Focus on care delivery MVP |

---

## 4. Environment Configuration Tools

| File | Role |
|------|------|
| `backend/.env` | `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, Cloudinary, email |
| `frontend/.env` | `VITE_API_URL`, `VITE_VIDEO_SERVICE_URL`, signaling path |
| `backend/docs/ENV.md` | MongoDB troubleshooting |
| `docs/IMPLEMENTATION_PLAN.md` | Phase roadmap |

---

*End of Document 5*
