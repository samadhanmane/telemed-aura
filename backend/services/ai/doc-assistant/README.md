# Doc Assistant — unified document hub

Single entry for patients: upload, scan, analyze, and chat over **all** health documents.

## Supported uploads (max 20MB)

| Type | Formats | Pipeline |
|------|---------|----------|
| Medical report | PDF, PNG, JPG, DOCX | Page OCR → rules → ML → Gemini vision (X-ray/MRI/CT) → RAG index |
| Prescription | PDF, PNG, JPG, DOCX | OCR → handwritten? → Gemini vision → medicine parse → RAG index |

## API

- `POST /api/v1/ai/documents/upload` — `file`, `documentType` (`report` \| `prescription`), optional `name`, `category`
- `GET /api/v1/ai/documents` — merged library (reports + prescription uploads)
- `POST /api/v1/ai/document-chat` — Q&A over all indexed documents

## Frontend

- Route: `/patient/doc-assistant`
- Tabs: **Upload & scan** · **My documents** · **Ask AI** · **Doctor prescriptions** (read-only)

Legacy routes redirect here: `/patient/reports`, `/patient/report-chat`.
