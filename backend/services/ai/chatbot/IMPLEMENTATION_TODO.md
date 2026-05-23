# RAG chatbot — implementation checklist

## Phase 1 — Extraction & limits ✅
- [x] `extraction/document-extractor.ts` — PDF per-page (`pdf-parse` v2), OCR sparse pages
- [x] Upload limit 20MB (reports & prescriptions)
- [x] Frontend copy: max 20MB only

## Phase 2 — Indexing ✅
- [x] `DocumentChunk` MongoDB model
- [x] Semantic chunker with page numbers
- [x] Gemini embeddings + hash fallback
- [x] Ingest on report + prescription upload

## Phase 3 — Chat API ✅
- [x] `POST /api/v1/ai/document-chat`
- [x] RAG pipeline: rewrite → retrieve → completeness → answer → audit
- [x] Concise prompts (short answers)

## Phase 4 — Analytics ✅
- [x] Patient analytics BP/sugar from `VitalRecord` + report `extractedVitals`

## Phase 5 — UI ✅
- [x] Report chat panel on patient reports
- [x] Nav link to health assistant chat

## Optional later
- [ ] Python sidecar (PyMuPDF + PaddleOCR) for harder scans
- [ ] MongoDB Atlas Vector Search index
- [ ] Streaming chat responses
- [ ] Doctor-facing document Q&A on patient chart
- [ ] Cache embeddings per `cloudinaryPublicId`
