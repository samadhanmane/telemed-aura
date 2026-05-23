import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncI18nLanguage } from "@/i18n";

type Theme = "light" | "dark";
export type Language = "en" | "hi";

interface ThemeState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      language: "en",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        applyTheme(next);
        set({ theme: next });
      },
      setLanguage: (language) => {
        syncI18nLanguage(language);
        set({ language });
      },
    }),
    {
      name: "telemed-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          syncI18nLanguage(state.language);
        }
      },
    },
  ),
);
