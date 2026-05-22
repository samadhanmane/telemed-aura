import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Video,
  FileText,
  CalendarCheck,
  Languages,
  ChevronRight,
  HeartPulse,
  Activity,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-telehealth.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Rural Telehealth — Specialist care for every village" },
      {
        name: "description",
        content:
          "Book video consults with specialists, scan symptoms with AI, and keep every medical record in one secure place — built for rural communities.",
      },
      { property: "og:title", content: "AI Rural Telehealth" },
      {
        property: "og:description",
        content: "Specialist telemedicine, AI triage, and unified records for rural communities.",
      },
    ],
  }),
  component: Landing,
});

const stats = [
  { value: "120k+", label: "Consultations" },
  { value: "850+", label: "Specialists" },
  { value: "320", label: "Villages served" },
  { value: "98%", label: "Patient satisfaction" },
];

const features = [
  { icon: Video, title: "Secure video consults", desc: "HD video with specialists, optimized for low bandwidth." },
  { icon: Sparkles, title: "AI Symptom Scanner", desc: "Triage in seconds with explainable risk scoring." },
  { icon: FileText, title: "Unified medical record", desc: "Prescriptions, reports and history — one timeline." },
  { icon: CalendarCheck, title: "Smart scheduling", desc: "Find the right doctor and slot in under a minute." },
  { icon: ShieldCheck, title: "Privacy by design", desc: "End-to-end encryption and consent-first sharing." },
  { icon: Languages, title: "Multilingual UI", desc: "English, हिन्दी and मराठी out of the box." },
];

const specialists = [
  "General Physician", "Cardiology", "Pediatrics", "Gynecology",
  "Dermatology", "Neurology", "Orthopedics", "Psychiatry",
];

const steps = [
  { n: "01", t: "Describe symptoms", d: "Use the AI scanner or pick a specialty." },
  { n: "02", t: "Pick a doctor & slot", d: "Browse verified specialists with ratings and fees." },
  { n: "03", t: "Consult on video", d: "Join from any device — even on 3G connections." },
  { n: "04", t: "Get prescription", d: "Digital prescription saved to your records instantly." },
];

const testimonials = [
  { q: "I got a cardiologist consult from my village in 20 minutes. This is life-changing.", a: "Sunita, Ratnagiri" },
  { q: "The AI scanner caught early signs of pneumonia in my son. Forever grateful.", a: "Ramesh, Jharkhand" },
  { q: "All my reports in one place. No more carrying paper files to every doctor.", a: "Asha, Bihar" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 md:items-center md:gap-8 md:px-8 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Activity className="h-3.5 w-3.5 text-accent" />
              AI-powered rural healthcare
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Specialist care,
              <br />
              <span className="text-gradient-primary">delivered to every village.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Book video consults with top doctors, triage symptoms with AI, and keep your
              medical history secure — all in one beautiful, multilingual app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
                <Link to="/register">
                  Get started free <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/patient/ai-scanner">Try AI Scanner</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-semibold tracking-tight md:text-3xl">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-elevated">
              <img
                src={heroImg}
                alt="Rural patient connecting with a specialist over telehealth"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -left-4 bottom-6 w-64 rounded-2xl glass p-4 shadow-elevated"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Heart rate</div>
                  <div className="text-lg font-semibold">72 bpm <span className="text-xs font-normal text-success">Normal</span></div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -right-2 top-8 w-60 rounded-2xl glass p-4 shadow-elevated"
            >
              <div className="text-xs text-muted-foreground">Next appointment</div>
              <div className="mt-1 text-sm font-semibold">Dr. Meera Iyer — Cardiology</div>
              <div className="mt-1 text-xs text-muted-foreground">Today · 5:30 PM</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Platform</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to deliver care
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete telehealth toolkit for patients, doctors and clinics.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="group h-full rounded-3xl border-border/60 p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="bg-surface">
        <div className="container mx-auto px-4 py-20 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Specialties</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Care across every specialty
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/patient/appointments">Browse doctors <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {specialists.map((s) => (
              <div
                key={s}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container mx-auto px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">From symptom to prescription</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n} className="rounded-3xl border-border/60 p-6 shadow-soft">
              <div className="text-xs font-semibold tracking-[0.18em] text-primary">{s.n}</div>
              <div className="mt-2 text-base font-semibold">{s.t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.d}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface">
        <div className="container mx-auto grid gap-5 px-4 py-20 md:grid-cols-3 md:px-8">
          {testimonials.map((t) => (
            <Card key={t.a} className="rounded-3xl border-border/60 p-6 shadow-soft">
              <p className="text-sm leading-relaxed">“{t.q}”</p>
              <div className="mt-4 text-xs text-muted-foreground">— {t.a}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 md:max-w-3xl md:px-8 md:py-28">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FAQ</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Common questions</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          {[
            { q: "Is the platform free for patients?", a: "Sign-up is free. You only pay the doctor's consultation fee, transparently displayed before booking." },
            { q: "Does it work on slow internet?", a: "Yes. Video is optimized for 2G/3G, and you can fall back to audio-only with a single tap." },
            { q: "Are my records private?", a: "All data is encrypted in transit and at rest. You control who sees what, with consent-first sharing." },
            { q: "Which languages are supported?", a: "English, हिन्दी and मराठी today, with more Indian languages on the roadmap." },
          ].map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-primary-foreground shadow-elevated md:p-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Bring world-class care to your community.
            </h2>
            <p className="mt-3 text-primary-foreground/85">
              Create your account in under a minute — patients, doctors and clinics welcome.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Create account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary-foreground/15 blur-3xl" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
