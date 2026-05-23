import { HeartPulse } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{t("common.appName")}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("landing.footerTagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("landing.footerProduct")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("landing.footerTelehealth")}</li>
            <li>{t("landing.footerAiScanner")}</li>
            <li>{t("landing.footerRecords")}</li>
            <li>{t("landing.footerForDoctors")}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("landing.footerCompany")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("landing.footerAbout")}</li>
            <li>{t("landing.footerPrivacy")}</li>
            <li>{t("landing.footerTerms")}</li>
            <li>{t("landing.footerContact")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:px-8">
          <span>
            © {new Date().getFullYear()} {t("common.appName")}. {t("common.allRights")}
          </span>
          <span>{t("common.madeFor")}</span>
        </div>
      </div>
    </footer>
  );
}
