import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

export type AppLanguage = "en" | "hi";

const STORAGE_KEY = "telemed-theme";

function readPersistedLanguage(): AppLanguage {
  if (typeof localStorage === "undefined") return "en";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "en";
    const parsed = JSON.parse(raw) as { state?: { language?: string } };
    return parsed?.state?.language === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: readPersistedLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "hi"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function syncI18nLanguage(lang: AppLanguage) {
  if (i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }
}

export default i18n;
