# AI implementation checklist

## Done in this release

- [x] Layered pipeline: extract → rules → ML → Gemini vision → rule severity → Gemini synthesis
- [x] Lab value regex (BP, glucose, Hb, lipids, SpO₂)
- [x] Severe disease keyword elevation (rule-only severity)
- [x] Gemini vision for X-Ray / Radiology / images / low OCR text
- [x] Gemini synthesis for patient-friendly summary (no severity from Gemini)
- [x] Prescription: Tesseract + Gemini vision fallback
- [x] Multi-chart API (`bar`, `line`, `comparison`, `vitals`, `risk` pie)
- [x] `ReportAnalysisPanel` on patient reports page
- [x] Digital prescriptions with date+time on dashboard

## RAG chatbot (see `chatbot/`)

- [x] Page-wise extraction, 20MB uploads, MongoDB chunk index
- [x] `POST /api/v1/ai/document-chat`
- [x] Patient Doc Assistant UI
- [x] Hybrid retrieval + token-saving pipeline (skip rewrite/audit when confident)
- [x] Scan progress UI (pages, images, % success, remaining pages)
- [x] EMR documents section for doctors/patients with full report analysis
- [x] Video village mode stats (kbps, loss, RTT, downgrade counter)

## Optional next steps

- [ ] Python sidecar (PyMuPDF + PaddleOCR) behind `POST /ai/extract`
- [ ] Symptom scan optional body image → Gemini vision
- [ ] Doctor report review UI with “confirm AI flags”
- [ ] Hindi OCR language pack for Tesseract
- [ ] Cache Gemini results per `cloudinaryPublicId` to save API cost
- [ ] Admin AI monitoring wired to pipeline stats

## Env

```bash
GEMINI_API_KEY=your_key
AI_MODEL=gemini-2.0-flash
```
