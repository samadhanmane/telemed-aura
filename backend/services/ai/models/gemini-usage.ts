/** Debug counters for why quota is consumed quickly. */
let uploadCallCount = 0;

export function resetUploadGeminiCounters(): void {
  uploadCallCount = 0;
}

export function recordGeminiApiCall(kind: string): void {
  uploadCallCount += 1;
  if (process.env.AI_LOG_GEMINI_CALLS === "true") {
    console.info(`[ai] Gemini API call #${uploadCallCount}: ${kind}`);
  }
}

export function logUploadGeminiSummary(context: string): void {
  if (uploadCallCount > 0) {
    console.info(`[ai] ${context}: ${uploadCallCount} Gemini API call(s) this upload`);
  }
  resetUploadGeminiCounters();
}
