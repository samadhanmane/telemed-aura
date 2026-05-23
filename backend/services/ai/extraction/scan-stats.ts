import type { DocumentExtractionResult, ExtractionPage, PageScanStatus, ScanSummary } from "./types.js";

const MIN_SUCCESS_CHARS = 50;
const PARTIAL_CHARS = 15;

function pageStatus(page: ExtractionPage): PageScanStatus {
  const len = page.char_count ?? page.text.length;
  if (page.method === "failed" || page.method === "no_ocr") return "failed";
  if (len >= MIN_SUCCESS_CHARS) return "success";
  if (len >= PARTIAL_CHARS || page.method === "tesseract" || page.method === "gemini_vision")
    return "partial";
  if (page.text.includes("[No text") || page.text.includes("[OCR")) return "failed";
  return "partial";
}

/** Build scan progress metrics for UI and EMR. */
export function computeScanSummary(extraction: DocumentExtractionResult): ScanSummary {
  const pageDetails = extraction.pages.map((p) => {
    const status = pageStatus(p);
    const charCount = p.char_count ?? p.text.length;
    return {
      page_num: p.page_num,
      status,
      method: p.method,
      char_count: charCount,
      image_count: p.image_count ?? 0,
    };
  });

  const totalPages = extraction.page_count || pageDetails.length;
  const pagesScanned = pageDetails.filter((p) => p.status === "success" || p.status === "partial").length;
  const pagesFailed = pageDetails.filter((p) => p.status === "failed").length;
  const pagesRemaining = pageDetails.filter((p) => p.status === "failed").map((p) => p.page_num);

  const imagesDetected = extraction.images_detected ?? pageDetails.reduce((s, p) => s + p.image_count, 0);
  const imagesOcred = pageDetails.filter(
    (p) => (p.image_count > 0 || p.method === "tesseract") && p.status !== "failed",
  ).length;

  const scanSuccessPercent =
    totalPages > 0 ? Math.round((pagesScanned / totalPages) * 100) : 0;

  const totalChars = pageDetails.reduce((s, p) => s + p.char_count, 0);
  const retrievedChars = pageDetails
    .filter((p) => p.status !== "failed")
    .reduce((s, p) => s + p.char_count, 0);
  const dataRetrievalPercent =
    totalChars > 0 ? Math.round((retrievedChars / totalChars) * 100) : scanSuccessPercent;

  const summaryShort =
    totalPages === 0
      ? "No pages extracted."
      : `${pagesScanned}/${totalPages} pages read (${scanSuccessPercent}%). ` +
        `${imagesDetected} image(s) in file. ` +
        (pagesRemaining.length
          ? `Pages not fully scanned: ${pagesRemaining.join(", ")}.`
          : "All pages processed.");

  return {
    totalPages,
    pagesScanned,
    pagesFailed,
    pagesRemaining,
    imagesDetected,
    imagesOcred,
    scanSuccessPercent,
    dataRetrievalPercent,
    pageDetails,
    summaryShort,
    primaryMethod: extraction.primary_method,
  };
}
