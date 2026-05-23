# Medical document RAG chatbot

Pipeline for patient Q&A over uploaded **reports** and **prescriptions**.

## Flow

```
Upload (≤20MB, multi-page PDF)
  → extraction/document-extractor.ts (per-page text + OCR)
  → analyze-document.pipeline.ts (rules → ML → Gemini)
  → indexing/ingest-document.ts (semantic chunks → MongoDB vectors)
  → patient views charts on Reports page

Chat POST /api/v1/ai/document-chat
  → rewrite query (Gemini)
  → mongo-vector-store search (cosine on embeddings)
  → completeness check
  → concise Gemini answer + citations
  → light audit
```

## Folders

| Path | Role |
|------|------|
| `chunking/` | Semantic splits with page metadata |
| `embeddings/` | Gemini `text-embedding-004` (+ hash fallback) |
| `store/` | MongoDB `DocumentChunk` CRUD + search |
| `pipeline/` | `runMedicalRagPipeline` |
| `indexing/` | Ingest after upload |
| `prompts/` | Short, citation-focused prompts |

## Env

```bash
GEMINI_API_KEY=...
AI_EMBEDDING_MODEL=text-embedding-004
```

See `IMPLEMENTATION_TODO.md` for phase checklist.
