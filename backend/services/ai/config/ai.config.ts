export type AiConfig = {
  provider: string;
  apiKey: string;
  model: string;
  visionModel: string;
  maxOcrChars: number;
  maxVisionOcrPreview: number;
  maxSynthesisChars: number;
  maxOutputTokensVision: number;
  maxOutputTokensSynthesis: number;
  maxOutputTokensPrescription: number;
  skipSynthesisIfLowRisk: boolean;
  embeddingModel: string;
};

export function getAiConfig(): AiConfig {
  return {
    provider: process.env.AI_PROVIDER ?? "gemini",
    apiKey: process.env.AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "gemini-2.0-flash-lite",
    visionModel:
      process.env.AI_VISION_MODEL ??
      process.env.AI_MODEL ??
      "gemini-2.0-flash-lite",
    maxOcrChars: Number(process.env.AI_MAX_OCR_CHARS ?? 2800),
    maxVisionOcrPreview: Number(process.env.AI_MAX_VISION_PREVIEW ?? 900),
    maxSynthesisChars: Number(process.env.AI_MAX_SYNTHESIS_CHARS ?? 1200),
    maxOutputTokensVision: Number(process.env.AI_MAX_TOKENS_VISION ?? 512),
    maxOutputTokensSynthesis: Number(process.env.AI_MAX_TOKENS_SYNTHESIS ?? 384),
    maxOutputTokensPrescription: Number(process.env.AI_MAX_TOKENS_RX ?? 512),
    skipSynthesisIfLowRisk: process.env.AI_SKIP_SYNTHESIS_LOW_RISK !== "false",
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-004",
  };
}
