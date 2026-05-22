export type AiConfig = {
  provider: string;
  apiKey: string;
  model: string;
};

export function getAiConfig(): AiConfig {
  return {
    provider: process.env.AI_PROVIDER ?? "",
    apiKey: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "",
  };
}
