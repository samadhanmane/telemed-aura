import { getAiConfig } from "../config/ai.config.js";
import { generateGeminiJson } from "../models/gemini.client.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { buildPrescriptionVisionPrompt } from "../prompts/prescription.prompts.js";

export type PrescriptionMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

export type PrescriptionGeminiRead = {
  medicines: PrescriptionMedicine[];
  notes: string;
  rawText: string;
  modelUsed?: string;
};

type RxJson = {
  medicines?: { name?: string; dosage?: string; frequency?: string; duration?: string }[];
  notes?: string;
  fullText?: string;
};

const RX_MODELS = [
  process.env.AI_MODEL,
  process.env.AI_VISION_MODEL,
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
].filter(Boolean) as string[];

function normalizeMedicines(
  raw: RxJson["medicines"],
): PrescriptionMedicine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m?.name?.trim())
    .slice(0, 20)
    .map((m) => ({
      name: String(m.name).trim(),
      dosage: String(m.dosage ?? "").trim() || "—",
      frequency: String(m.frequency ?? "").trim() || "—",
      duration: String(m.duration ?? "").trim() || "—",
    }));
}

/**
 * Read prescription from image/PDF using Gemini vision (primary for handwriting).
 * OCR text is only an optional hint — not used for final parsing.
 */
export async function readPrescriptionWithGemini(input: {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
  ocrHint?: string;
}): Promise<PrescriptionGeminiRead | null> {
  if (process.env.AI_DISABLE_GEMINI === "true") return null;
  if (!getAiConfig().apiKey) return null;
  if (isGeminiQuotaBlocked()) {
    console.warn("[rx] Gemini quota blocked — prescription vision skipped");
    return null;
  }

  const prompt = buildPrescriptionVisionPrompt(input.ocrHint ?? "", input.filename);
  const mime = input.mimeType.startsWith("image/")
    ? input.mimeType
    : input.mimeType === "application/pdf"
      ? "application/pdf"
      : "image/jpeg";

  const imagePart = {
    inlineData: {
      mimeType: mime,
      data: input.buffer.toString("base64"),
    },
  };

  const uniqueModels = [...new Set(RX_MODELS)];

  for (const modelId of uniqueModels) {
    if (isGeminiQuotaBlocked()) break;

    const json = await generateGeminiJson<RxJson>(
      [{ text: prompt }, imagePart],
      {
        modelId,
        maxOutputTokens: Math.max(getAiConfig().maxOutputTokensPrescription, 768),
        slotKind: "vision",
        waitForSlot: true,
      },
    );

    const medicines = normalizeMedicines(json?.medicines);
    if (medicines.length > 0) {
      const rawText = [
        json?.fullText,
        json?.notes,
        ...medicines.map(
          (m) => `${m.name} ${m.dosage} ${m.frequency} ${m.duration}`,
        ),
      ]
        .filter(Boolean)
        .join("\n");

      console.info(`[rx] Gemini read ${medicines.length} medicine(s) (${modelId}): ${input.filename ?? "rx"}`);
      return {
        medicines,
        notes: String(json?.notes ?? "").trim(),
        rawText: rawText.slice(0, 4000),
        modelUsed: modelId,
      };
    }
  }

  console.warn(`[rx] Gemini could not extract medicines from ${input.filename ?? "prescription"}`);
  return null;
}
