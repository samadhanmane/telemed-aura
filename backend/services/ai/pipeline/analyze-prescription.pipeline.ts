import { parsePrescriptionText } from "../core/prescription-parser.js";
import type { PrescriptionOcrResult } from "../core/types.js";
import { readPrescriptionWithGemini } from "../prescription/prescription-gemini-reader.js";

/** Prescriptions: Gemini vision first (handwriting); OCR/rules only as fallback. */
export async function runPrescriptionAnalysisPipeline(input: {
  extractedText: string;
  extractionMethod: string;
  mimeType: string;
  imageBuffer?: Buffer;
  filename?: string;
}): Promise<PrescriptionOcrResult> {
  const canUseVision =
    Boolean(input.imageBuffer) &&
    (input.mimeType.startsWith("image/") || input.mimeType === "application/pdf");

  if (canUseVision && input.imageBuffer) {
    const gemini = await readPrescriptionWithGemini({
      buffer: input.imageBuffer,
      mimeType: input.mimeType,
      filename: input.filename,
      ocrHint: input.extractedText,
    });

    if (gemini && gemini.medicines.length > 0) {
      return {
        text: gemini.rawText || gemini.notes || input.extractedText,
        confidence: 0.92,
        medicines: gemini.medicines,
        extractionMethod: `gemini-vision${gemini.modelUsed ? `:${gemini.modelUsed}` : ""}`,
        visionUsed: true,
      };
    }
  }

  const parsed = parsePrescriptionText(input.extractedText);
  return {
    ...parsed,
    text: parsed.text || input.extractedText,
    extractionMethod:
      canUseVision && !parsed.medicines.length
        ? `${input.extractionMethod}+ocr-fallback`
        : input.extractionMethod,
    visionUsed: false,
  };
}
