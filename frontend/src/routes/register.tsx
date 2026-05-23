import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APP_NAME, pageTitle } from "@/lib/brand";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ArrowLeft, HeartPulse, User, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { register as registerApi, registerDoctor, fetchSpecialties, type Specialty } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath, redirectIfAuthenticated } from "@/lib/auth/guards";
import { resolveRedirectAfterLogin } from "@/lib/auth/require-login";
import type { UserRole } from "@/types/healthcare";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: pageTitle("Create account") }] }),
  validateSearch: registerSearchSchema,
  beforeLoad: ({ search }) => redirectIfAuthenticated(search),
  component: RegisterPage,
});

type SignupRole = Extract<UserRole, "patient" | "doctor">;

const patientSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
  location: z.string().optional(),
});

const doctorSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
  specialty: z.string().min(1, "Select your specialty"),
  licenseNumber: z.string().min(3, "Medical license is required"),
  experienceYears: z.coerce.number().min(0, "Enter years of experience"),
  bio: z.string().optional(),
});

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roleOptions: {
    id: SignupRole;
    label: string;
    desc: string;
    icon: typeof User;
  }[] = [
    { id: "patient", label: t("auth.patientRole"), desc: t("auth.patientRoleDesc"), icon: User },
    { id: "doctor", label: t("auth.doctorRole"), desc: t("auth.doctorRoleDesc"), icon: Stethoscope },
  ];
  const { redirect: redirectTo } = Route.useSearch();
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<SignupRole | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [doctorSubmitted, setDoctorSubmitted] = useState(false);

  useEffect(() => {
    fetchSpecialties().then(setSpecialties).catch(() => {});
  }, []);

  const patientForm = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", location: "" },
  });

  const doctorForm = useForm({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      experienceYears: 0,
      bio: "",
    },
  });

  const selectRole = (next: SignupRole) => {
    setRole(next);
    patientForm.reset();
    doctorForm.reset();
  };

  const goToDetails = () => {
    if (!role) {
      toast.error(t("auth.selectRoleError"));
      return;
    }
    setStep("details");
  };

  const onSubmitPatient = patientForm.handleSubmit(async (data) => {
    try {
      const { user, token } = await registerApi({
        role: "patient",
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        location: data.location,
      });
      setSession(user, token);
      toast.success(t("auth.welcomeNew", { name: user.name.split(" ")[0] }));
      navigate({
        to: resolveRedirectAfterLogin(redirectTo, user.role as UserRole),
      });
    } catch (err: unknown) {
      toast.error(getApiError(err));
    }
  });

  const onSubmitDoctor = doctorForm.handleSubmit(async (data) => {
    if (!certificate) {
      toast.error(t("auth.certificateRequired"));
      return;
    }
    try {
      const form = new FormData();
      form.append("certificate", certificate);
      form.append("name", data.name);
      form.append("email", data.email);
      form.append("password", data.password);
      if (data.phone) form.append("phone", data.phone);
      form.append("specialty", data.specialty);
      form.append("licenseNumber", data.licenseNumber);
      form.append("experienceYears", String(data.experienceYears));
      if (data.bio) form.append("bio", data.bio);

      const result = await registerDoctor(form);
      setDoctorSubmitted(true);
      toast.success(result.message);
    } catch (err: unknown) {
      toast.error(getApiError(err));
    }
  });

  const selectedRoleMeta = roleOptions.find((r) => r.id === role);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center px-4 py-12 md:px-12">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </Link>

          {step === "role" ? (
            <>
              <h1 className="mt-8 text-3xl font-semibold tracking-tight">{t("auth.registerTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("auth.registerStep1")}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {roleOptions.map((r) => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRole(r.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        active ? "border-primary bg-primary-soft ring-1 ring-primary/30" : "border-border hover:border-primary/40",
                      )}
                    >
                      <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
                      <div className="mt-3 text-sm font-semibold">{r.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={goToDetails}
                disabled={!role}
                className="mt-6 h-11 w-full bg-gradient-primary text-primary-foreground"
              >
                {t("common.continue")}
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("role")}
                className="mt-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.changeRole")}
              </button>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                {role === "doctor" ? t("auth.doctorRegistration") : t("auth.patientRegistration")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.registerStep2", { desc: selectedRoleMeta?.desc ?? "" })}
              </p>

              {role === "patient" ? (
                <form onSubmit={onSubmitPatient} className="mt-6 space-y-4">
                  <AccountFields form={patientForm} t={t} />
                  <div className="space-y-2">
                    <Label>{t("auth.location")}</Label>
                    <Input placeholder={t("auth.locationPlaceholder")} {...patientForm.register("location")} />
                  </div>
                  <SubmitButton submitting={patientForm.formState.isSubmitting} t={t} />
                </form>
              ) : doctorSubmitted ? (
                <Card className="mt-6 rounded-2xl border-primary/30 bg-primary/5 p-6">
                  <h2 className="font-semibold text-primary">{t("auth.applicationSubmitted")}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t("auth.applicationSubmittedDesc")}</p>
                  <Button className="mt-4" asChild>
                    <Link to="/login">{t("auth.goToSignIn")}</Link>
                  </Button>
                </Card>
              ) : (
                <form onSubmit={onSubmitDoctor} className="mt-6 space-y-4">
                  <AccountFields form={doctorForm} t={t} />
                  <div className="space-y-2">
                    <Label>{t("auth.specialty")}</Label>
                    <Select onValueChange={(v) => doctorForm.setValue("specialty", v, { shouldValidate: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auth.specialtyPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {doctorForm.formState.errors.specialty && (
                      <p className="text-xs text-destructive">{doctorForm.formState.errors.specialty.message}</p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("auth.licenseNumber")}</Label>
                      <Input {...doctorForm.register("licenseNumber")} />
                      {doctorForm.formState.errors.licenseNumber && (
                        <p className="text-xs text-destructive">{doctorForm.formState.errors.licenseNumber.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("auth.experienceYears")}</Label>
                      <Input type="number" {...doctorForm.register("experienceYears")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.bio")}</Label>
                    <Textarea placeholder={t("auth.bioPlaceholder")} {...doctorForm.register("bio")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.certificate")}</Label>
                    <Input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => setCertificate(e.target.files?.[0] ?? null)}
                    />
                    <p className="text-[11px] text-muted-foreground">{t("auth.certificateHint")}</p>
                  </div>
                  <SubmitButton
                    submitting={doctorForm.formState.isSubmitting}
                    label={t("auth.submitForReview")}
                    t={t}
                  />
                </form>
              )}
            </>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.alreadyRegistered")}{" "}
            <Link to="/login" search={{}} className="text-primary hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t("auth.sameSignInNote")}</p>
        </div>
      </div>
      <div className="relative hidden bg-gradient-primary lg:block" />
    </div>
  );
}

function AccountFields({
  form,
  t,
}: {
  form: ReturnType<typeof useForm>;
  t: (key: string) => string;
}) {
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  return (
    <>
      <div className="space-y-2">
        <Label>{t("auth.fullName")}</Label>
        <Input {...form.register("name")} />
        {errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("auth.email")}</Label>
          <Input type="email" {...form.register("email")} />
          {errors.email?.message && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("auth.phone")}</Label>
          <Input {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("auth.password")}</Label>
        <Input type="password" {...form.register("password")} />
        {errors.password?.message && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
    </>
  );
}

function SubmitButton({
  submitting,
  label,
  t,
}: {
  submitting: boolean;
  label?: string;
  t: (key: string) => string;
}) {
  return (
    <Button
      type="submit"
      disabled={submitting}
      className="h-11 w-full bg-gradient-primary text-primary-foreground"
    >
      {submitting ? t("auth.submitting") : label ?? t("auth.register")}
    </Button>
  );
}

function getApiError(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Registration failed";
  }
  return "Registration failed";
}
