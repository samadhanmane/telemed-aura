import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore, type Language } from "@/stores/theme-store";
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const language = useThemeStore((s) => s.language);
  const setLanguage = useThemeStore((s) => s.setLanguage);

  const pick = (lang: Language) => setLanguage(lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className ?? "gap-1"}>
          <Globe className="h-4 w-4" />
          <span className="font-medium">{language === "en" ? "EN" : "हि"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => pick("en")} className={language === "en" ? "bg-muted" : ""}>
          {t("common.english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => pick("hi")} className={language === "hi" ? "bg-muted" : ""}>
          {t("common.hindi")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
