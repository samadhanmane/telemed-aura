import { Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuthStore } from "@/stores/auth-store";
import {
  destinationForLoggedInUser,
  isAuthenticated,
  loginSearchFor,
} from "@/lib/auth/require-login";
import { getDashboardPath } from "@/lib/auth/guards";
import { APP_NAME } from "@/lib/brand";
import type { UserRole } from "@/types/healthcare";

const linkKeys = [
  { to: "/", key: "nav.home" },
  { to: "/#features", key: "nav.features" },
  { to: "/#how", key: "nav.howItWorks" },
  { to: "/#faq", key: "nav.faq" },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const loggedIn = isAuthenticated();

  const goGetStarted = () => {
    if (loggedIn && user && token) {
      navigate({ to: destinationForLoggedInUser("getStarted", user.role as UserRole) });
    } else {
      navigate({ to: "/login", search: loginSearchFor("/patient") });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{t("common.appName")}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("common.tagline")}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {linkKeys.map((l) => (
            <a key={l.to} href={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t(l.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher className="gap-1" />
          {loggedIn && user ? (
            <Button variant="ghost" asChild>
              <Link to={getDashboardPath(user.role as UserRole)}>{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/login" search={{}}>
                {t("nav.login")}
              </Link>
            </Button>
          )}
          <Button
            type="button"
            className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            onClick={goGetStarted}
          >
            {t("nav.getStarted")}
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher className="gap-1" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-3">
            {linkKeys.map((l) => (
              <a key={l.to} href={l.to} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {t(l.key)}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              {loggedIn && user ? (
                <Button asChild className="flex-1 bg-gradient-primary text-primary-foreground">
                  <Link to={getDashboardPath(user.role as UserRole)}>{t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                    onClick={() => {
                      goGetStarted();
                      setOpen(false);
                    }}
                  >
                    {t("nav.getStarted")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
