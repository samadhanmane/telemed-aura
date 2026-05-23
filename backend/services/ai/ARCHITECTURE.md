# TeleMed Aura — AI Services Architecture

## Pipeline order (every document upload)

```
Upload → Cloudinary
    → Layer 1: Text extraction (pdf-parse / Tesseract)
    → Layer 2: Rules (lab values, disease keywords, vitals regex, chart data from numbers)
    → Layer 3: ML risk scorer (optional weighted model on structured features)
    → Layer 4: Gemini Vision (images / X-Ray / Radiology / low OCR confidence only)
    → Layer 5: Gemini synthesis (optional — narrative only)
    → Layer 6: Severity engine (RULES ONLY — OCR + vision flags + synthesis text via `remark-severity.rules`)
    → Store in MongoDB + notify if High/Critical
    → Doctor review can add remarks → severity re-adjusted (still rule-based)
```

## Modules

| Path | Role |
|------|------|
| `extraction/` | PDF + OCR text |
| `rules/` | Lab parser, disease list, severity, remark-severity, report heuristics |
| `ml/` | Lightweight risk score adjustment |
| `vision/` | Gemini multimodal for scans/images |
| `synthesis/` | Gemini text merge for final report wording |
| `pipeline/` | Orchestrators for reports & prescriptions |
| `models/` | Shared Gemini client |

## Severity policy

- `severity` and `riskScore` are computed only in `rules/severity-engine.ts`.
- Gemini may suggest concerns in `insights` but cannot lower rule-based severity.
- Severe disease keywords in OCR text → automatic High/Critical.
- Vision `clinicalFlags` + `visibleFindings` + synthesis bullets scanned by `severityFromRemarks()` — not LLM scores.
- Doctor remarks on reports (`PATCH /clinical/reports/:id/review`) bump severity via same remark rules; optional severity override.

## Main API integrations

| Feature | Route |
|---------|--------|
| Report upload + AI | `POST /api/v1/clinical/reports` (file required) |
| Doctor report review | `PATCH /api/v1/clinical/reports/:reportId/review` |
| Digital Rx | `POST /api/v1/clinical/patients/:patientId/prescriptions` |
| Consultation rating | `POST /api/v1/reviews` (after `completed` appointment) |
| EMR | `/api/v1/emr/*` |
| Video ICE | `GET /api/v1/video/ice-servers` |

## Cost optimization (`prompts/` + `pipeline/cost-guard.ts`)

- Truncate OCR before LLM (`AI_MAX_OCR_CHARS`).
- Vision only for images / radiology / thin OCR (`shouldRunGeminiVision`).
- Synthesis skipped on low-risk short reports (`AI_SKIP_SYNTHESIS_LOW_RISK`).
- Compact JSON prompts (`maxOutputTokens` caps per call).
- Rule-only summary fallback when Gemini synthesis not needed.

## Charts

- Built from **extracted numeric lab values** (rule layer), not Gemini hallucination.
- Types: `bar`, `line`, `comparison` (value vs reference), `vitals` (BP, glucose).
