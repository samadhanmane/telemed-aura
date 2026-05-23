import { getAiConfig } from "../config/ai.config.js";

export async function tryGeminiReportAnalysis(
  reportName: string,
  reportText: string,
): Promise<{ summary?: string; insights?: string[] } | null> {
  const { apiKey } = getAiConfig();
  if (!apiKey) return null;

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
    });

    const prompt = `You are a rural telehealth assistant. Summarize this medical report in 3-4 plain sentences for a patient. List 2-3 key insights as bullet points. Report name: ${reportName}. Text:\n${reportText.slice(0, 4000)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text() ?? "";
    const insights = text
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    return {
      summary: text.split("\n")[0]?.slice(0, 500) ?? text.slice(0, 500),
      insights: insights.length ? insights : undefined,
    };
  } catch (err) {
    console.error("[ai] Gemini report analysis failed:", err);
    return null;
  }
}
