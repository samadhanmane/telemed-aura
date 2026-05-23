import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchMyEmr, updateMyHealthProfile } from "@/lib/api/emr";
import { updateAuthProfile } from "@/lib/api/auth";
import { Loader2 } from "lucide-react";

export function SettingsForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);
  const { theme, language, setLanguage } = useThemeStore();
  const isPatient = user?.role === "patient";
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [chronicText, setChronicText] = useState("");

  const { data: emrData, isLoading: emrLoading } = useQuery({
    queryKey: ["my-emr"],
    queryFn: fetchMyEmr,
    enabled: isPatient,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user?.id, user?.name, user?.phone]);

  useEffect(() => {
    const p = emrData?.emr.profile;
    if (!p) return;
    setLocation(p.location ?? "");
    setAge(p.age != null ? String(p.age) : "");
    setGender(p.gender ?? "");
    setAllergiesText(p.allergies.join(", "));
    setChronicText(p.chronicDiseases.join(", "));
    setPhone(p.phone ?? phone);
    setName(p.name);
  }, [emrData?.emr.profile]);

  const savePatient = useMutation({
    mutationFn: async () => {
      const allergies = allergiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const chronicDiseases = chronicText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const profile = await updateMyHealthProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        allergies,
        chronicDiseases,
      });
      return profile;
    },
    onSuccess: (profile) => {
      if (user && token) {
        setSession(
          {
            ...user,
            name: profile.name,
            phone: profile.phone,
          },
          token,
        );
      }
      qc.invalidateQueries({ queryKey: ["my-emr"] });
      toast.success("Health record and profile saved to EMR");
    },
    onError: () => toast.error("Could not save — check your connection"),
  });

  const saveDoctor = useMutation({
    mutationFn: () => updateAuthProfile({ name: name.trim(), phone: phone.trim() || undefined }),
    onSuccess: (updated) => {
      if (token) setSession(updated, token);
      toast.success("Profile saved");
    },
    onError: () => toast.error("Could not save profile"),
  });

  const handleSaveProfile = () => {
    if (isPatient) savePatient.mutate();
    else saveDoctor.mutate();
  };

  const saving = savePatient.isPending || saveDoctor.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
        <h2 className="text-base font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {isPatient && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Location (village / district)</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          )}
        </div>
        <Button
          className="mt-4 bg-gradient-primary text-primary-foreground"
          onClick={handleSaveProfile}
          disabled={saving || (isPatient && emrLoading)}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </Card>

      {isPatient && (
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
          <h2 className="text-base font-semibold">Health record (EMR)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Used in consultations, AI scans, and your digital health record.
          </p>
          {emrLoading ? (
            <div className="mt-4 flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender || "unset"} onValueChange={(v) => setGender(v === "unset" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">—</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Allergies (comma-separated)</Label>
                <Textarea
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                  rows={2}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Chronic conditions (comma-separated)</Label>
                <Textarea
                  value={chronicText}
                  onChange={(e) => setChronicText(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension"
                  rows={2}
                />
              </div>
            </div>
          )}
          <Button
            className="mt-4"
            variant="outline"
            onClick={handleSaveProfile}
            disabled={saving || emrLoading}
          >
            Save health record
          </Button>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
        <h2 className="text-base font-semibold">Security</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" />
          </div>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => toast.info("Password change coming soon")}>
          Change password
        </Button>
      </Card>

      <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
        <h2 className="text-base font-semibold">Preferences</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Easier on eyes at night</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(c) => useThemeStore.getState().setTheme(c ? "dark" : "light")}
            />
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Appointments & prescriptions</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}
