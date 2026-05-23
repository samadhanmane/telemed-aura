/**
 * Semantic chunker — section → paragraph → sentence splits with overlap.
 */
import crypto from "crypto";
import type { ExtractionPage } from "../../extraction/types.js";

export type SemanticChunk = {
  chunk_id: string;
  text: string;
  metadata: {
    document_id: string;
    filename: string;
    page_number: number;
    chunk_index: number;
    char_count: number;
    source_type: "report" | "prescription";
  };
};

function splitSections(text: string): string[] {
  const pat = /\n(?=[A-Z][A-Z\s]{3,}\n|(?:\d+\.)+\s+[A-Z]|#{1,3}\s|={3,}|-{3,})/;
  const parts = text.split(pat);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function sentSplit(text: string, maxSize: number, overlap: number): string[] {
  const sents = text.split(/(?<=[.!?;])\s+/);
  const chunks: string[] = [];
  let buf = "";
  for (const s of sents) {
    if (buf.length + s.length + 1 <= maxSize) {
      buf = buf ? `${buf} ${s}` : s;
    } else {
      if (buf) chunks.push(buf);
      const tail = buf.length > overlap ? buf.slice(-overlap) : buf;
      buf = tail ? `${tail} ${s}` : s;
    }
  }
  if (buf.trim()) chunks.push(buf);
  return chunks;
}

function buildPageMap(pages: ExtractionPage[]): { pos: number; page_num: number }[] {
  const offsets: { pos: number; page_num: number }[] = [];
  let pos = 0;
  for (const p of pages) {
    offsets.push({ pos, page_num: p.page_num });
    pos += p.text.length + 2;
  }
  return offsets;
}

function findPage(full: string, fragment: string, pageMap: { pos: number; page_num: number }[]): number {
  const pos = fragment ? full.indexOf(fragment.slice(0, 60)) : 0;
  if (pos < 0) return 1;
  for (let i = pageMap.length - 1; i >= 0; i--) {
    if (pos >= pageMap[i]!.pos) return pageMap[i]!.page_num;
  }
  return 1;
}

function mkChunk(
  text: string,
  documentId: string,
  filename: string,
  page: number,
  idx: number,
  sourceType: "report" | "prescription",
): SemanticChunk {
  const chunk_id = crypto.createHash("md5").update(`${documentId}:${idx}`).digest("hex");
  return {
    chunk_id,
    text: text.trim(),
    metadata: {
      document_id: documentId,
      filename,
      page_number: page,
      chunk_index: idx,
      char_count: text.trim().length,
      source_type: sourceType,
    },
  };
}

export function chunkDocument(
  fullText: string,
  pages: ExtractionPage[],
  documentId: string,
  filename: string,
  sourceType: "report" | "prescription",
  maxChunk = 1000,
  overlap = 120,
): SemanticChunk[] {
  const isImaging = /x-?ray|radiology|mri|ct\s*scan|ultrasound/i.test(filename);
  if (isImaging) {
    maxChunk = 750;
    overlap = 80;
  }
  if (!fullText.trim()) return [];

  const pageMap = buildPageMap(pages);
  const sections = splitSections(fullText);
  const chunks: SemanticChunk[] = [];
  let idx = 0;

  for (const section of sections) {
    if (!section.trim()) continue;

    if (section.length <= maxChunk) {
      const pg = findPage(fullText, section, pageMap);
      chunks.push(mkChunk(section, documentId, filename, pg, idx++, sourceType));
      continue;
    }

    const paras = section.split("\n\n").map((p) => p.trim()).filter(Boolean);
    let buf = "";
    for (const para of paras) {
      if (buf.length + para.length + 2 <= maxChunk) {
        buf = buf ? `${buf}\n\n${para}` : para;
      } else {
        if (buf) {
          chunks.push(
            mkChunk(buf, documentId, filename, findPage(fullText, buf, pageMap), idx++, sourceType),
          );
        }
        if (para.length <= maxChunk) {
          buf = para;
        } else {
          for (const sc of sentSplit(para, maxChunk, overlap)) {
            chunks.push(
              mkChunk(sc, documentId, filename, findPage(fullText, sc, pageMap), idx++, sourceType),
            );
          }
          buf = "";
        }
      }
    }
    if (buf.trim()) {
      chunks.push(mkChunk(buf, documentId, filename, findPage(fullText, buf, pageMap), idx++, sourceType));
    }
  }

  return chunks;
}
