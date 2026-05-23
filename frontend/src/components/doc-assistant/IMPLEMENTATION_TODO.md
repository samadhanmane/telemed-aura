# Doc Assistant UI — checklist

## Done

- [x] Single route `/patient/doc-assistant` with 4 tabs
- [x] Upload: medical report + prescription (PDF/PNG/JPG/DOCX, 20MB)
- [x] Scan progress + AI analysis for reports
- [x] Prescription: OCR + Gemini vision for handwriting
- [x] My documents library (reports + uploads merged)
- [x] Ask AI (RAG chat, all documents)
- [x] Doctor Rx tab (digital prescriptions from consultations)
- [x] Nav: one **Doc Assistant** item
- [x] Redirects: `/patient/reports`, `/patient/report-chat`, `/patient/prescriptions`

## API

- `GET /api/v1/ai/documents`
- `POST /api/v1/ai/documents/upload`
- `POST /api/v1/ai/document-chat`
