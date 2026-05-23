import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, HeartPulse, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/client";
import { loginSchema } from "@/lib/validation/forms";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath, redirectIfAuthenticated } from "@/lib/auth/guards";
import { resolveRedirectAfterLogin } from "@/lib/auth/require-login";
import type { UserRole } from "@/types/healthcare";
import { APP_NAME, pageTitle } from "@/lib/brand";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: pageTitle("Log in") }] }),
  validateSearch: loginSearchSchema,
  beforeLoad: ({ search }) => redirectIfAuthenticated(search),
  component: LoginPage,
});

const schema = loginSchema;

function LoginPage() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const setSession = useAuthStore((s) => s.setSession);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { user, token } = await login(data.email, data.password);
      setSession(user, token);
      toast.success("Login successful", {
        description: t("auth.welcomeToast", { name: user.name.split(" ")[0] }),
      });
      navigate({ to: getDashboardPath(user.role as UserRole) });
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "REGISTRATION_PENDING") {
        toast.message("Application under review", {
          description: getApiErrorMessage(err, "Admin has not approved your doctor account yet."),
        });
        return;
      }
      if (code === "REGISTRATION_REJECTED") {
        toast.error(getApiErrorMessage(err, "Registration was rejected — please register again."));
        navigate({ to: "/register", search: {} });
        return;
      }
      toast.error(getApiErrorMessage(err, "Invalid email or password"));
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 bg-hero opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </Link>
          <div>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">{t("auth.loginHero")}</h2>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-12 md:px-12">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">{t("auth.welcomeBack")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.loginSubtitle")} {t("auth.adminNote")}
          </p>
          {redirectTo && (
            <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              {redirectTo.includes("ai-scanner")
                ? t("auth.redirectScanner")
                : t("auth.redirectAccount")}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              search={redirectTo ? { redirect: redirectTo } : {}}
              className="font-medium text-primary hover:underline"
            >
              {t("auth.createOne")}
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={show ? "text" : "password"} className="pl-9 pr-9" {...register("password")} />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow">
              {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
