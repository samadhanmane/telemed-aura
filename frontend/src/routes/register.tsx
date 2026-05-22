import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HeartPulse, User, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { register as registerApi, fetchSpecialties, type Specialty } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardPath } from "@/lib/auth/guards";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — AI Rural Telehealth" }] }),
  component: RegisterPage,
});

const baseSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
});

const doctorSchema = baseSchema.extend({
  specialty: z.string().min(1, "Select specialty"),
  licenseNumber: z.string().min(3, "License required"),
  experienceYears: z.coerce.number().min(0),
  consultationFee: z.coerce.number().min(0),
  bio: z.string().optional(),
});

const roles = [
  { id: "patient", label: "Patient", desc: "Book consults by category", icon: User },
  { id: "doctor", label: "Doctor", desc: "Register as specialist", icon: Stethoscope },
] as const;

function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    fetchSpecialties().then(setSpecialties).catch(() => {});
  }, []);

  const form = useForm({
    resolver: zodResolver(role === "doctor" ? doctorSchema : baseSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      specialty: "",
      licenseNumber: "",
      experienceYears: 0,
      consultationFee: 299,
      bio: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const payload =
        role === "doctor"
          ? { role, ...data }
          : { role: "patient", name: data.name, email: data.email, password: data.password, phone: data.phone };
      const { user, token } = await registerApi(payload);
      setSession(user, token);
      toast.success(`Welcome, ${user.name}`);
      navigate({ to: getDashboardPath(user.role as "patient" | "doctor" | "admin") });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Registration failed";
      toast.error(msg ?? "Registration failed");
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 md:px-12">
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">AI Rural Telehealth</span>
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your account</h1>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left",
                    active ? "border-primary bg-primary-soft" : "border-border",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  <div className="mt-2 text-sm font-semibold">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
            </div>

            {role === "doctor" && (
              <>
                <div className="space-y-2">
                  <Label>Specialty / category</Label>
                  <Select onValueChange={(v) => form.setValue("specialty", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Psychology, Dermatology, Physiotherapy…" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Medical license no.</Label>
                    <Input {...form.register("licenseNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience (years)</Label>
                    <Input type="number" {...form.register("experienceYears")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Consultation fee (₹)</Label>
                  <Input type="number" {...form.register("consultationFee")} />
                </div>
                <div className="space-y-2">
                  <Label>Bio (optional)</Label>
                  <Textarea {...form.register("bio")} />
                </div>
              </>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 w-full bg-gradient-primary text-primary-foreground">
              {form.formState.isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden bg-gradient-primary lg:block" />
    </div>
  );
}
