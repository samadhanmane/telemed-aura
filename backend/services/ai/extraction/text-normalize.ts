/** Normalize OCR/PDF text for lab table matching. */
export function normalizeMedicalReportText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[|│]/g, " ")
    .replace(/(\d)\s+(\d{1,2}\b)/g, "$1.$2")
    .replace(/\)\s*\(/g, ") (")
    .replace(/([a-zA-Z])\s*\n\s*(\d)/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
