import { chunkDocument } from "../chunking/semantic-chunker.js";
import { upsertChunks } from "../store/mongo-vector-store.js";
import type { DocumentExtractionResult } from "../../extraction/types.js";

export async function ingestExtractedDocument(input: {
  patientId: string;
  documentId: string;
  filename: string;
  sourceType: "report" | "prescription";
  extraction: DocumentExtractionResult;
}): Promise<{ chunkCount: number }> {
  let chunks = chunkDocument(
    input.extraction.full_text,
    input.extraction.pages,
    input.documentId,
    input.filename,
    input.sourceType,
  );

  const maxChunks = Number(process.env.AI_MAX_EMBED_CHUNKS_PER_DOC ?? 12);
  if (chunks.length > maxChunks) {
    chunks = chunks.slice(0, maxChunks);
    console.info(
      `[rag] Capped chunks ${chunks.length}/${maxChunks} for doc ${input.documentId} (set AI_MAX_EMBED_CHUNKS_PER_DOC)`,
    );
  }

  const count = await upsertChunks(input.patientId, input.documentId, chunks);
  console.info(`[rag] Indexed ${count} chunk(s) for chat (${input.sourceType})`);
  return { chunkCount: count };
}
