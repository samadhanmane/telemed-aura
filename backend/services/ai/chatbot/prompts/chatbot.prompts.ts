export const MEDICAL_CHAT_SYSTEM = `You are a telehealth assistant helping patients understand their own medical reports and prescriptions.

RULES:
- Answer ONLY from the provided document excerpts. If data is missing, say so clearly.
- Use plain language suitable for rural patients in India.
- Cite sources as [Report: filename, p.X] or [Prescription: filename].
- Never invent lab values, drug names, or diagnoses not in the excerpts.
- Do NOT assign severity scores or replace a doctor's judgment.
- Structure your reply when helpful: brief answer, then key numbers (BP, sugar, Hb if present), then one practical next step.`;

export function buildAnswerPrompt(
  question: string,
  context: string,
  patientHint?: string,
  options?: { answerLocale?: "en" | "hi"; originalQuestion?: string },
): string {
  const answerLocale = options?.answerLocale ?? "en";
  const displayQuestion = options?.originalQuestion ?? question;
  const languageRule =
    answerLocale === "hi"
      ? "Write the entire answer in Hindi using Devanagari script. Use simple words for village patients."
      : "Write the entire answer in English.";

  return `${patientHint ? `Patient context: ${patientHint}\n\n` : ""}DOCUMENT EXCERPTS (from vector search over uploaded files):
${context}

PATIENT QUESTION (as asked by patient): ${displayQuestion}

Instructions:
1. ${languageRule}
2. Answer the question directly using only the excerpts.
3. If BP, blood sugar, Hb, lipids, or medicines appear in excerpts, mention them with units.
4. End with one sentence on what the patient should discuss with their doctor.
5. Keep under 120 words unless listing medicines. Include [Report/Prescription: file, p.X] citations.`;
}

export function buildRewritePrompt(question: string): string {
  return `You improve patient health questions for semantic search over medical PDFs and prescriptions.
The question is already in English. Expand abbreviations (BP→blood pressure, HbA1c, LDL, FBS). Add related clinical terms.
Output JSON only:
{"rewritten":"single expanded search query in English","sub_questions":["optional short sub-query max 2 in English"]}
Question: "${question}"`;
}

export function buildCompletenessPrompt(question: string, chunksPreview: string): string {
  return `Can these medical document excerpts answer the patient question? Be generous if any relevant lab, vitals, or medicine data exists.
Question: "${question}"
Excerpts:
${chunksPreview}
JSON only: {"completeness_score":0.0,"has_enough_data":true,"missing":""}`;
}

export function buildAuditPrompt(answer: string, sources: string): string {
  return `Verify the answer uses only facts from sources. JSON only:
{"passed":true,"unsupported_claims":[]}
SOURCES:
${sources}
ANSWER:
${answer}`;
}
