export type AppLocale = "en" | "hi";

export function parseLocale(value: unknown): AppLocale {
  if (value === "hi" || value === "hin" || value === "hi-IN") return "hi";
  if (typeof value === "string" && value.toLowerCase().startsWith("hi")) return "hi";
  return "en";
}

export function localeFromRequest(headers: {
  "accept-language"?: string;
}, body?: { locale?: unknown }): AppLocale {
  if (body?.locale) return parseLocale(body.locale);
  const al = headers["accept-language"];
  if (al?.toLowerCase().includes("hi")) return "hi";
  return "en";
}
