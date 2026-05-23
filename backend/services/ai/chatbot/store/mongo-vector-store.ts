import { DocumentChunk } from "../../../../src/database/models/DocumentChunk.model.js";
import type { SemanticChunk } from "../chunking/semantic-chunker.js";
import { embedTexts, embedSingle, cosineSimilarity } from "../embeddings/gemini-embedder.js";

export type RetrievedChunk = {
  chunk_id: string;
  text: string;
  score: number;
  metadata: {
    document_id: string;
    filename: string;
    page_number: number;
    chunk_index: number;
    source_type: string;
  };
};

export async function deleteDocumentChunks(patientId: string, documentId: string): Promise<void> {
  await DocumentChunk.deleteMany({ patientId, documentId });
}

export async function upsertChunks(
  patientId: string,
  documentId: string,
  chunks: SemanticChunk[],
): Promise<number> {
  if (!chunks.length) return 0;

  await deleteDocumentChunks(patientId, documentId);

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  const docs = chunks.map((chunk, i) => ({
    patientId,
    documentId,
    sourceType: chunk.metadata.source_type,
    chunkId: chunk.chunk_id,
    text: chunk.text.slice(0, 4000),
    embedding: embeddings[i]!,
    filename: chunk.metadata.filename,
    pageNumber: chunk.metadata.page_number,
    chunkIndex: chunk.metadata.chunk_index,
  }));

  await DocumentChunk.insertMany(docs);
  console.info(`[rag] indexed ${docs.length} chunks for patient=${patientId} doc=${documentId}`);
  return docs.length;
}

function keywordBoost(query: string, text: string): number {
  const qTerms = new Set(
    query
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2),
  );
  if (!qTerms.size) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const t of qTerms) {
    if (lower.includes(t)) hits++;
  }
  return Math.min(0.12, (hits / qTerms.size) * 0.1);
}

/** Single DB load + one query embedding; optional keyword boost from extra query strings. */
export async function searchChunksHybrid(
  patientId: string,
  primaryQuery: string,
  extraQueries: string[] = [],
  opts?: { topK?: number; minScore?: number; documentIds?: string[] },
): Promise<RetrievedChunk[]> {
  const topK = opts?.topK ?? 12;
  const minScore = opts?.minScore ?? 0.22;

  const filter: Record<string, unknown> = { patientId };
  if (opts?.documentIds?.length) {
    filter.documentId = { $in: opts.documentIds };
  }

  const all = await DocumentChunk.find(filter).lean();
  if (!all.length) return [];

  const qEmb = await embedSingle(primaryQuery);
  const queries = [primaryQuery, ...extraQueries.filter((q) => q && q !== primaryQuery)];

  const scored = all.map((row) => {
    let score = cosineSimilarity(qEmb, row.embedding);
    for (const q of queries) {
      score = Math.min(1, score + keywordBoost(q, row.text));
    }
    return {
      chunk_id: row.chunkId,
      text: row.text,
      score,
      metadata: {
        document_id: row.documentId,
        filename: row.filename,
        page_number: row.pageNumber,
        chunk_index: row.chunkIndex,
        source_type: row.sourceType,
      },
    };
  });

  return scored
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => ({ ...r, score: Math.round(r.score * 10000) / 10000 }));
}

/** Legacy per-query search (one embed per call). */
export async function searchChunks(
  patientId: string,
  query: string,
  opts?: { topK?: number; minScore?: number; documentIds?: string[] },
): Promise<RetrievedChunk[]> {
  return searchChunksHybrid(patientId, query, [], opts);
}
