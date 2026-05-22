import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Star, Video, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { patientNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchDoctors, fetchDoctorSlots, type Doctor } from "@/lib/api/doctors";
import { fetchSpecialties } from "@/lib/api/auth";
import { useBookAppointment } from "@/lib/api/hooks/use-appointments";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/doctors")({
  beforeLoad: () => requireRole("patient"),
  head: () => ({ meta: [{ title: "Book by category — Patient" }] }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [booking, setBooking] = useState<Doctor | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const book = useBookAppointment();

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: fetchSpecialties,
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", category],
    queryFn: () => fetchDoctors(category === "all" ? undefined : category),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", booking?.id, date],
    queryFn: () => (booking ? fetchDoctorSlots(booking.id, date) : []),
    enabled: !!booking,
  });

  const filtered = doctors.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialtyLabel.toLowerCase().includes(search.toLowerCase()),
  );

  const confirmBook = async () => {
    if (!booking || !time) return;
    try {
      await book.mutateAsync({
        doctorId: booking.id,
        date,
        time,
        specialty: booking.specialty,
      });
      toast.success("Appointment booked! Check your email for confirmation.");
      setBooking(null);
      setTime("");
    } catch {
      toast.error("Could not book this slot");
    }
  };

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Book by category"
          description="Psychology, dermatology, physiotherapy, and more."
        />

        <Card className="mt-6 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search doctors…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="cursor-pointer" variant={category === "all" ? "default" : "secondary"} onClick={() => setCategory("all")}>
              All
            </Badge>
            {specialties.map((s) => (
              <Badge
                key={s.id}
                className="cursor-pointer"
                variant={category === s.id ? "default" : "secondary"}
                onClick={() => setCategory(s.id)}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </Card>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading doctors…</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="rounded-2xl p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-accent font-semibold text-accent-foreground">
                  {d.name.split(" ")[1]?.[0] ?? "D"}
                </div>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.specialtyLabel} · {d.experienceYears} yrs</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {d.rating}
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <span className="font-semibold">₹{d.consultationFee}</span>
                <Button className="bg-gradient-primary text-primary-foreground" onClick={() => setBooking(d)}>
                  <Video className="mr-1 h-4 w-4" /> Book
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!booking} onOpenChange={() => setBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {booking?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time slot</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!time || book.isPending} onClick={confirmBook}>
              <Calendar className="mr-2 h-4 w-4" />
              Confirm booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
