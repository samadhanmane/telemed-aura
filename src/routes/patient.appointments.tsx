import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Star, Video } from "lucide-react";

export const Route = createFileRoute("/patient/appointments")({
  head: () => ({ meta: [{ title: "Appointments — Patient" }] }),
  component: AppointmentsPage,
});

const specs = ["All", "General", "Cardiology", "Pediatrics", "Dermatology", "Neurology"];

const doctors = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  name: ["Dr. Meera Iyer", "Dr. Rohan Verma", "Dr. Priya Shah", "Dr. Karan Sethi", "Dr. Anjali Mehta", "Dr. Leena Joshi"][i],
  spec: ["Cardiology", "Dermatology", "General", "Neurology", "Pediatrics", "Gynecology"][i],
  exp: `${8 + i} yrs`,
  rating: (4.6 + (i % 4) * 0.1).toFixed(1),
  fee: ["₹599", "₹449", "₹299", "₹699", "₹399", "₹549"][i],
  next: ["Today 5:30 PM", "Tomorrow 10:00 AM", "Today 7:00 PM", "Fri 11:00 AM", "Sat 9:30 AM", "Today 6:15 PM"][i],
}));

function AppointmentsPage() {
  return (
    <DashboardShell nav={patientNav} title="Patient">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Book an appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find a specialist and pick a slot that works for you.</p>

        <Card className="mt-6 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search doctors by name or specialty" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {specs.map((s, i) => (
                <Badge
                  key={s}
                  variant={i === 0 ? "default" : "secondary"}
                  className={i === 0 ? "bg-gradient-primary text-primary-foreground" : ""}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <Card key={d.id} className="group flex flex-col rounded-2xl border-border/60 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-accent font-semibold text-accent-foreground">
                  {d.name.split(" ")[1][0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.spec} · {d.exp}</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {d.rating}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs">
                <div className="text-muted-foreground">Next available</div>
                <div className="mt-1 font-semibold">{d.next}</div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">Consultation fee</div>
                  <div className="text-base font-semibold">{d.fee}</div>
                </div>
                <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                  <Video className="mr-1 h-4 w-4" /> Book
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
