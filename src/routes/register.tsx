import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HeartPulse, User, Stethoscope, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — AI Rural Telehealth" }] }),
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
});

const roles = [
  { id: "patient", label: "Patient", desc: "Book consults & manage records", icon: User },
  { id: "doctor", label: "Doctor", desc: "Treat patients online", icon: Stethoscope },
  { id: "admin", label: "Admin", desc: "Manage a clinic or network", icon: ShieldCheck },
] as const;

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("patient");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Account created for ${data.name}`);
    navigate({ to: role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/patient" });
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 md:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">AI Rural Telehealth</span>
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have one?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary-soft shadow-soft"
                      : "border-border hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="mt-2 text-sm font-semibold">{r.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Doe" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 bg-hero opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Join 850+ specialists<br /> bringing care home.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            A single platform for appointments, AI triage, prescriptions and records.
          </p>
        </div>
        <div className="pointer-events-none absolute -left-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
      </div>
    </div>
  );
}
