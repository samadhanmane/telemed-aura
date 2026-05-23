import { getAiConfig } from "../config/ai.config.js";
import { isGeminiQuotaBlocked } from "../models/gemini-quota.js";
import { generateGeminiJson, generateGeminiContent } from "../models/gemini.client.js";
import type { AppLocale } from "./locale.js";

/** Hindi → English for vector / embedding search (documents indexed in English). */
export async function translateToEnglishForRetrieval(
  text: string,
  locale: AppLocale,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || locale === "en") return trimmed;
  if (!getAiConfig().apiKey || isGeminiQuotaBlocked()) return trimmed;

  const json = await generateGeminiJson<{ english?: string }>(
    [
      {
        text: `Translate this patient health question to English for medical document search. Keep medical terms accurate (BP, HbA1c, sugar, etc.). Output JSON only: {"english":"..."}
Question: ${trimmed}`,
      },
    ],
    { maxOutputTokens: 200, slotKind: "chat" },
  );
  return json?.english?.trim() || trimmed;
}

/** Localize an English RAG answer to Hindi (or pass through English). */
export async function localizeMedicalAnswer(
  englishAnswer: string,
  locale: AppLocale,
  originalQuestion: string,
): Promise<string> {
  const trimmed = englishAnswer.trim();
  if (!trimmed || locale === "en") return trimmed;
  if (!getAiConfig().apiKey || isGeminiQuotaBlocked()) return trimmed;

  const out =
    (await generateGeminiContent(
      [
        {
          text: `You are a medical translator for rural Indian patients.
Translate the following English answer into simple Hindi (Devanagari script).
Keep numbers, units, drug names, and [Report/Prescription: file, p.X] citations unchanged.
Do not add new medical facts. Patient's original question was: ${originalQuestion}

ENGLISH ANSWER:
${trimmed}

HINDI ANSWER:`,
        },
      ],
      { maxOutputTokens: 520, slotKind: "chat" },
    )) ?? trimmed;

  return out.trim();
}

export const RAG_EMPTY_MESSAGES: Record<AppLocale, string> = {
  en: "No text found in your uploads. Add a lab report, X-ray, or prescription (PDF/image, max 20MB).",
  hi: "आपकी अपलोड की फ़ाइलों में पाठ नहीं मिला। लैब रिपोर्ट, एक्स-रे या प्रिस्क्रिप्शन (PDF/छवि, अधिकतम 20MB) जोड़ें।",
};

export const RAG_NOT_ENOUGH_MESSAGES: Record<AppLocale, string> = {
  en: "Not enough readable content in your files for a safe answer. Re-upload a clearer scan.",
  hi: "सुरक्षित उत्तर के लिए आपकी फ़ाइलों में पर्याप्त पठनीय सामग्री नहीं है। साफ़ स्कैन फिर से अपलोड करें।",
};
