import i18n from "@/i18n";
import { useThemeStore } from "@/stores/theme-store";

/** Current UI language for API (Accept-Language + body.locale). */
export function getApiLanguage(): "en" | "hi" {
  const fromStore = useThemeStore.getState().language;
  const fromI18n = i18n.language === "hi" ? "hi" : "en";
  return fromStore === "hi" || fromI18n === "hi" ? "hi" : "en";
}

export function getAcceptLanguageHeader(): string {
  return getApiLanguage() === "hi" ? "hi-IN,hi;q=0.9,en;q=0.8" : "en-US,en;q=0.9";
}
