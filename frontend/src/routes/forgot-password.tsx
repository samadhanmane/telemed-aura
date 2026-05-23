import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, HeartPulse, Lock, Mail, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { toast } from "sonner";
import { requestForgotPasswordOtp, resetPasswordWithOtp } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { pageTitle } from "@/lib/brand";

const OTP_VALID_SECONDS = 120;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: pageTitle("Reset password") }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const emailSchema = z.object({
    email: z.string().email(t("auth.validation.email")),
  });

  const resetSchema = z
    .object({
      otp: z.string().length(6, t("auth.validation.otpLength")),
      newPassword: z.string().min(6, t("auth.validation.passwordMin")),
      confirmPassword: z.string().min(6, t("auth.validation.confirmPassword")),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const sendOtp = async (targetEmail: string) => {
    setSending(true);
    try {
      const res = await requestForgotPasswordOtp(targetEmail);
      setEmail(targetEmail);
      setStep("reset");
      setSecondsLeft(OTP_VALID_SECONDS);
      resetForm.setValue("otp", "");
      toast.success(res.message);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not send verification code"));
    } finally {
      setSending(false);
    }
  };

  const onEmailSubmit = emailForm.handleSubmit(async (data) => {
    await sendOtp(data.email.trim().toLowerCase());
  });

  const onResetSubmit = resetForm.handleSubmit(async (data) => {
    setResetting(true);
    try {
      const res = await resetPasswordWithOtp({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success(res.message);
      setStep("done");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not reset password"));
    } finally {
      setResetting(false);
    }
  });

  const formatCountdown = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 bg-hero opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{t("common.appName")}</span>
          </Link>
          <div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">{t("auth.forgotHero")}</h2>
            <p className="mt-3 text-sm text-primary-foreground/80">{t("auth.forgotHeroDesc")}</p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-12 md:px-12">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/login" search={{}}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("auth.backToSignIn")}
            </Link>
          </Button>

          {step === "email" && (
            <>
              <h1 className="text-3xl font-semibold tracking-tight">{t("auth.forgotTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("auth.forgotEmailDesc")}</p>
              <form onSubmit={onEmailSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-9" {...emailForm.register("email")} />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  {sending ? t("auth.sendingCode") : t("auth.sendCode")}
                </Button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-3xl font-semibold tracking-tight">{t("auth.resetStepTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.codeSentTo")} <strong className="text-foreground">{email}</strong>
                {secondsLeft > 0 ? (
                  <>
                    {" "}
                    · {t("auth.expiresIn")} <strong>{formatCountdown()}</strong>
                  </>
                ) : (
                  <>
                    {" "}
                    · <span className="text-destructive">{t("auth.expired")}</span>
                  </>
                )}
              </p>
              <form onSubmit={onResetSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label>{t("auth.verificationCode")}</Label>
                  <InputOTP
                    maxLength={6}
                    value={resetForm.watch("otp")}
                    onChange={(v) => resetForm.setValue("otp", v, { shouldValidate: true })}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {resetForm.formState.errors.otp && (
                    <p className="text-xs text-destructive">{resetForm.formState.errors.otp.message}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    disabled={sending}
                    onClick={() => sendOtp(email)}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    {sending ? t("auth.sending") : t("auth.resendCode")}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-9"
                      {...resetForm.register("newPassword")}
                    />
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">
                      {resetForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" {...resetForm.register("confirmPassword")} />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={resetting || secondsLeft === 0}
                  className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  {resetting ? t("auth.updating") : t("auth.resetPassword")}
                </Button>
                {secondsLeft === 0 && (
                  <p className="text-center text-xs text-muted-foreground">{t("auth.codeExpiredHint")}</p>
                )}
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold">{t("auth.passwordUpdated")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("auth.passwordUpdatedDesc")}</p>
              <Button
                className="mt-8 h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow"
                onClick={() => navigate({ to: "/login", search: {} })}
              >
                {t("auth.goToSignIn")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
