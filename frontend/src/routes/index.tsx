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
import { AuthGatedButton } from "@/components/auth/AuthGatedButton";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-telehealth.jpg";
import { APP_NAME, APP_DESCRIPTION, pageTitle } from "@/lib/brand";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: pageTitle() },
      { name: "description", content: APP_DESCRIPTION },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESCRIPTION },
    ],
  }),
  component: Landing,
});

const stats = [
  { value: "120k+", labelKey: "landing.stats.consultations" },
  { value: "850+", labelKey: "landing.stats.specialists" },
  { value: "320", labelKey: "landing.stats.villages" },
  { value: "98%", labelKey: "landing.stats.satisfaction" },
] as const;

const features = [
  { icon: Video, titleKey: "landing.features.videoTitle", descKey: "landing.features.videoDesc" },
  { icon: Sparkles, titleKey: "landing.features.scannerTitle", descKey: "landing.features.scannerDesc" },
  { icon: FileText, titleKey: "landing.features.docTitle", descKey: "landing.features.docDesc" },
  { icon: CalendarCheck, titleKey: "landing.features.schedulingTitle", descKey: "landing.features.schedulingDesc" },
  { icon: ShieldCheck, titleKey: "landing.features.privacyTitle", descKey: "landing.features.privacyDesc" },
  {
    icon: Languages,
    titleKey: "landing.features.multilingualTitle",
    descKey: "landing.multilingualFeature",
  },
] as const;

const stepKeys = ["1", "2", "3", "4"] as const;

const faqKeys = ["1", "2", "3", "4"] as const;

const testimonialKeys = ["1", "2", "3"] as const;

const specialists = [
  "General Physician", "Cardiology", "Pediatrics", "Gynecology",
  "Dermatology", "Neurology", "Orthopedics", "Psychiatry",
];

function Landing() {
  const { t } = useTranslation();

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
              {t("landing.badge")}
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              {t("landing.heroTitle1")}
              <br />
              <span className="text-gradient-primary">{t("landing.heroTitle2")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              {t("landing.heroDesc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AuthGatedButton
                intent="getStarted"
                size="lg"
                className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
              >
                {t("landing.getStartedFree")} <ChevronRight className="ml-1 h-4 w-4" />
              </AuthGatedButton>
              <AuthGatedButton intent="aiScanner" size="lg" variant="outline">
                {t("landing.tryAiScanner")}
              </AuthGatedButton>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.labelKey}>
                  <div className="text-2xl font-semibold tracking-tight md:text-3xl">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{t(s.labelKey)}</div>
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
                alt={t("landing.heroImageAlt")}
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
                  <div className="text-xs text-muted-foreground">{t("landing.heartRate")}</div>
                  <div className="text-lg font-semibold">72 bpm <span className="text-xs font-normal text-success">{t("landing.normal")}</span></div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -right-2 top-8 w-60 rounded-2xl glass p-4 shadow-elevated"
            >
              <div className="text-xs text-muted-foreground">{t("landing.nextAppointment")}</div>
              <div className="mt-1 text-sm font-semibold">Dr. Meera Iyer — Cardiology</div>
              <div className="mt-1 text-xs text-muted-foreground">Today · 5:30 PM</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("landing.platform")}</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.featuresTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="group h-full rounded-3xl border-border/60 p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(f.descKey)}</p>
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
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("landing.specialtiesLabel")}</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.specialtiesTitle")}</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/patient/appointments">
                {t("landing.browseDoctors")} <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("landing.howLabel")}</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.howTitle")}</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {stepKeys.map((n) => (
            <Card key={n} className="rounded-3xl border-border/60 p-6 shadow-soft">
              <div className="text-xs font-semibold tracking-[0.18em] text-primary">0{n}</div>
              <div className="mt-2 text-base font-semibold">{t(`landing.steps.${n}title`)}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t(`landing.steps.${n}desc`)}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface">
        <div className="container mx-auto grid gap-5 px-4 py-20 md:grid-cols-3 md:px-8">
          {testimonialKeys.map((n) => (
            <Card key={n} className="rounded-3xl border-border/60 p-6 shadow-soft">
              <p className="text-sm leading-relaxed">“{t(`landing.testimonials.${n}q`)}”</p>
              <div className="mt-4 text-xs text-muted-foreground">— {t(`landing.testimonials.${n}a`)}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 md:max-w-3xl md:px-8 md:py-28">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("landing.faqLabel")}</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.faqTitle")}</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          {faqKeys.map((n) => (
            <AccordionItem key={n} value={n}>
              <AccordionTrigger className="text-left">{t(`landing.faq.${n}q`)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t(`landing.faq.${n}a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-primary-foreground shadow-elevated md:p-16">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("landing.ctaTitle")}</h2>
            <p className="mt-3 text-primary-foreground/85">{t("landing.ctaDesc")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">{t("auth.register")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login">{t("auth.signIn")}</Link>
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
