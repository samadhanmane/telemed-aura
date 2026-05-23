import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Star, Video, Calendar, MapPin, Languages, Building2 } from "lucide-react";
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
import { getApiErrorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/patient/doctors")({
  beforeLoad: () => requireRole("patient"),
  validateSearch: (s: Record<string, unknown>) => ({
    specialty: (s.specialty as string) || undefined,
  }),
  head: () => ({ meta: [{ title: "Find Doctors — Patient" }] }),
  component: DoctorsPage,
});

const CONSULT_TYPES = [
  { id: "video", label: "Video consultation" },
  { id: "follow-up", label: "Follow-up visit" },
  { id: "emergency", label: "Emergency consultation" },
];

const LANGUAGES = ["All", "English", "Hindi", "Marathi"];

function DoctorsPage() {
  const { specialty: searchSpecialty } = Route.useSearch();
  const [category, setCategory] = useState(searchSpecialty ?? "all");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [booking, setBooking] = useState<Doctor | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [consultType, setConsultType] = useState("video");
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

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialtyLabel.toLowerCase().includes(search.toLowerCase());
      const matchLang =
        langFilter === "All" || d.languages?.some((l) => l.includes(langFilter));
      const matchRating = d.rating >= minRating;
      return matchSearch && matchLang && matchRating;
    });
  }, [doctors, search, langFilter, minRating]);

  const confirmBook = async () => {
    if (!booking || !time) return;
    try {
      await book.mutateAsync({
        doctorId: booking.id,
        date,
        time,
        specialty: booking.specialty,
      });
      toast.success(
        consultType === "emergency"
          ? "Emergency slot requested — doctor will confirm shortly"
          : "Appointment booked! Check email for confirmation.",
      );
      setBooking(null);
      setTime("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not book this slot"));
    }
  };

  return (
    <DashboardShell nav={patientNav} title="Patient" role="patient">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Find your doctor"
          description="Filter by specialty, language, rating, and book video or emergency consults."
        />

        <Card className="mt-6 rounded-2xl border-border/60 p-4 shadow-soft">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className="cursor-pointer"
              variant={category === "all" ? "default" : "secondary"}
              onClick={() => setCategory("all")}
            >
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
          <div className="mt-3 flex flex-wrap gap-3">
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="w-[140px]">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <Star className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="4.5">4.5+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading doctors…</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="rounded-2xl p-5 shadow-soft transition hover:shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-accent text-lg font-semibold text-accent-foreground">
                  {d.name.replace("Dr. ", "").split(" ")[0]?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.specialtyLabel} · {d.experienceYears} yrs
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {d.rating}
                </div>
              </div>
              {d.location && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {d.location}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setProfile(d)}>
                  Profile
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                  onClick={() => setBooking(d)}
                >
                  <Video className="mr-1 h-4 w-4" /> Book
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!profile} onOpenChange={() => setProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{profile?.name}</DialogTitle>
          </DialogHeader>
          {profile && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-semibold">{profile.rating}</span>
                <span className="text-muted-foreground">
                  ({profile.reviewCount ?? 0} reviews)
                </span>
              </div>
              <p>
                <Building2 className="mr-1 inline h-4 w-4" />
                {profile.hospital}
              </p>
              <p>{profile.bio ?? "Experienced telehealth specialist serving rural communities."}</p>
              <p>
                <strong>Languages:</strong> {profile.languages?.join(", ")}
              </p>
              <ul className="list-inside list-disc text-muted-foreground">
                {profile.qualifications?.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-primary text-primary-foreground"
                onClick={() => {
                  setBooking(profile);
                  setProfile(null);
                }}
              >
                Book appointment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!booking} onOpenChange={() => setBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {booking?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Consultation type</Label>
              <Select value={consultType} onValueChange={setConsultType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSULT_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time slot</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {slots.length === 0 && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No bookable slots — choose today or a future date with free times.
                    </p>
                  )}
                  {slots.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              After the doctor confirms, both of you can join the video call at the date and time you
              select.
            </p>
            <Button className="w-full" disabled={!time || book.isPending} onClick={confirmBook}>
              <Calendar className="mr-2 h-4 w-4" />
              {book.isPending ? "Booking…" : "Confirm booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
