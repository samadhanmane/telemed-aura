import { getAiConfig } from "../../config/ai.config.js";
import { isGeminiQuotaBlocked } from "../../models/gemini-quota.js";
import {
  isRagRewriteEnabled,
  isRagAuditEnabled,
  isRagCompletenessEnabled,
} from "../../models/gemini-rate-manager.js";
import { generateGeminiContent, generateGeminiJson } from "../../models/gemini.client.js";
import { hybridRetrieve } from "../retrieval/hybrid-retriever.js";
import {
  MEDICAL_CHAT_SYSTEM,
  buildAnswerPrompt,
  buildRewritePrompt,
  buildCompletenessPrompt,
  buildAuditPrompt,
} from "../prompts/chatbot.prompts.js";
import type { AppLocale } from "../../i18n/locale.js";
import {
  translateToEnglishForRetrieval,
  localizeMedicalAnswer,
  RAG_EMPTY_MESSAGES,
  RAG_NOT_ENOUGH_MESSAGES,
} from "../../i18n/translator.js";

export type RagPipelineInput = {
  patientId: string;
  question: string;
  reportIds?: string[];
  patientContext?: string;
  locale?: AppLocale;
};

export type RagPipelineResult = {
  answer: string;
  sources: { file: string; page: number; score: number; sourceType: string }[];
  hasEnoughData: boolean;
  completenessScore: number;
  steps: { name: string; status: string; summary: string }[];
  tokensSaved?: string[];
};

const MAX_CHUNK_CHARS = 550;
const SHORT_QUERY_LEN = 48;

function compactContext(chunks: { text: string; metadata: Record<string, unknown>; score: number }[]): string {
  return chunks
    .map((c) => {
      const fn = c.metadata.filename as string;
      const pg = c.metadata.page_number as number;
      const st = c.metadata.source_type as string;
      return `[${st}: ${fn}, p.${pg}]\n${c.text.slice(0, MAX_CHUNK_CHARS)}`;
    })
    .join("\n---\n");
}

export async function runMedicalRagPipeline(input: RagPipelineInput): Promise<RagPipelineResult> {
  const steps: RagPipelineResult["steps"] = [];
  const tokensSaved: string[] = [];
  const t0 = Date.now();
  const locale = input.locale ?? "en";
  const originalQuestion = input.question.trim();
  const qEnglish = await translateToEnglishForRetrieval(originalQuestion, locale);

  let rewritten = qEnglish;
  const subQuestions: string[] = [];

  if (
    isRagRewriteEnabled() &&
    qEnglish.length > SHORT_QUERY_LEN &&
    getAiConfig().apiKey &&
    !isGeminiQuotaBlocked()
  ) {
    const rewriteJson = await generateGeminiJson<{ rewritten?: string; sub_questions?: string[] }>(
      [{ text: buildRewritePrompt(qEnglish) }],
      { maxOutputTokens: 180, slotKind: "chat" },
    );
    if (rewriteJson?.rewritten) {
      rewritten = rewriteJson.rewritten;
      if (rewriteJson.sub_questions?.length) subQuestions.push(...rewriteJson.sub_questions.slice(0, 2));
    }
  } else {
    tokensSaved.push("skipped_query_rewrite");
  }

  steps.push({
    name: "rewrite_query",
    status: "completed",
    summary: `${locale === "hi" ? "hi→en " : ""}${rewritten.slice(0, 80)}`,
  });

  const queries = [rewritten, qEnglish, ...subQuestions];
  const top = await hybridRetrieve(input.patientId, queries, {
    topK: 10,
    documentIds: input.reportIds,
  });

  steps.push({
    name: "retrieve",
    status: "completed",
    summary: `${top.length} chunks, top=${top[0]?.score?.toFixed(2) ?? 0}`,
  });

  if (!top.length) {
    return {
      answer: RAG_EMPTY_MESSAGES[locale],
      sources: [],
      hasEnoughData: false,
      completenessScore: 0,
      steps: [...steps, { name: "complete", status: "needs_data", summary: "empty index" }],
      tokensSaved,
    };
  }

  const topScore = top[0]?.score ?? 0;
  let completenessScore = Math.min(1, topScore + 0.25);
  let hasEnoughData = completenessScore >= 0.32;

  if (
    isRagCompletenessEnabled() &&
    topScore < 0.55 &&
    qEnglish.length > 30 &&
    getAiConfig().apiKey &&
    !isGeminiQuotaBlocked()
  ) {
    const preview = top.map((c) => c.text.slice(0, 280)).join("\n");
    const comp = await generateGeminiJson<{
      completeness_score?: number;
      has_enough_data?: boolean;
    }>([{ text: buildCompletenessPrompt(qEnglish, preview) }], { maxOutputTokens: 120, slotKind: "chat" });
    if (comp) {
      completenessScore = Number(comp.completeness_score ?? completenessScore);
      hasEnoughData = comp.has_enough_data ?? hasEnoughData;
    }
  } else {
    tokensSaved.push("skipped_completeness_llm");
    if (topScore >= 0.35) hasEnoughData = true;
  }

  steps.push({
    name: "check_completeness",
    status: "completed",
    summary: `${completenessScore.toFixed(2)} ok=${hasEnoughData}`,
  });

  if (!hasEnoughData) {
    return {
      answer: RAG_NOT_ENOUGH_MESSAGES[locale],
      sources: top.slice(0, 3).map((c) => ({
        file: c.metadata.filename,
        page: c.metadata.page_number,
        score: c.score,
        sourceType: c.metadata.source_type,
      })),
      hasEnoughData: false,
      completenessScore,
      steps,
      tokensSaved,
    };
  }

  const context = compactContext(top);
  if (isGeminiQuotaBlocked()) {
    const snippet = top
      .slice(0, 3)
      .map((c) => `${c.metadata.filename} (p.${c.metadata.page_number}): ${c.text.slice(0, 200)}`)
      .join("\n");
    return {
      answer: `Gemini API quota is exceeded right now. From your documents:\n${snippet}\n\nEnable billing or set AI_MODEL=gemini-2.0-flash-lite in backend/.env, then retry.`,
      sources: top.slice(0, 5).map((c) => ({
        file: c.metadata.filename,
        page: c.metadata.page_number,
        score: c.score,
        sourceType: c.metadata.source_type,
      })),
      hasEnoughData: true,
      completenessScore,
      steps: [...steps, { name: "complete", status: "quota_limited", summary: "no gemini answer" }],
      tokensSaved: [...tokensSaved, "gemini_quota_fallback"],
    };
  }

  const answerEn =
    (await generateGeminiContent(
      [
        { text: MEDICAL_CHAT_SYSTEM },
        {
          text: buildAnswerPrompt(qEnglish, context, input.patientContext, {
            answerLocale: "en",
            originalQuestion,
          }),
        },
      ],
      { maxOutputTokens: 480, slotKind: "chat" },
    )) ?? "Could not answer now. Try again.";

  steps.push({ name: "think", status: "completed", summary: `${answerEn.length}ch` });

  let finalAnswer =
    locale === "hi"
      ? await localizeMedicalAnswer(answerEn.trim(), locale, originalQuestion)
      : answerEn.trim();
  if (isRagAuditEnabled() && topScore < 0.72 && getAiConfig().apiKey && !isGeminiQuotaBlocked()) {
    const audit = await generateGeminiJson<{ passed?: boolean }>(
      [{ text: buildAuditPrompt(finalAnswer, context.slice(0, 2000)) }],
      { maxOutputTokens: 80, slotKind: "chat" },
    );
    if (audit?.passed === false) {
      finalAnswer += "\n\n(Some details could not be verified in your documents.)";
    }
    steps.push({ name: "audit", status: audit?.passed === false ? "warning" : "completed", summary: "checked" });
  } else {
    tokensSaved.push("skipped_audit_high_confidence");
    steps.push({ name: "audit", status: "skipped", summary: "high retrieval score" });
  }

  steps.push({ name: "complete", status: "completed", summary: `${Date.now() - t0}ms` });

  return {
    answer: finalAnswer,
    sources: top.slice(0, 5).map((c) => ({
      file: c.metadata.filename,
      page: c.metadata.page_number,
      score: c.score,
      sourceType: c.metadata.source_type,
    })),
    hasEnoughData: true,
    completenessScore,
    steps,
    tokensSaved,
  };
}
