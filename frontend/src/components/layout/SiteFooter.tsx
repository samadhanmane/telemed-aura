import { HeartPulse } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">AI Rural Telehealth</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Bringing specialist healthcare to every village with secure video care, AI triage,
            and a unified medical record.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Telehealth</li><li>AI Scanner</li><li>Records</li><li>For doctors</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>About</li><li>Privacy</li><li>Terms</li><li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:px-8">
          <span>© {new Date().getFullYear()} AI Rural Telehealth. All rights reserved.</span>
          <span>Made with care for rural communities.</span>
        </div>
      </div>
    </footer>
  );
}
