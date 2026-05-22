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
import { toast } from "sonner";

export function SettingsForm() {
  const user = useAuthStore((s) => s.user);
  const { theme, language, setLanguage } = useThemeStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="rounded-2xl border-border/60 p-6 shadow-soft">
        <h2 className="text-base font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Full name</Label>
            <Input defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue={user?.phone} />
          </div>
        </div>
        <Button
          className="mt-4 bg-gradient-primary text-primary-foreground"
          onClick={() => toast.success("Profile saved")}
        >
          Save profile
        </Button>
      </Card>

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
        <Button variant="outline" className="mt-4" onClick={() => toast.success("Password updated")}>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Large text</p>
              <p className="text-xs text-muted-foreground">Accessibility — easier reading</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>
    </div>
  );
}
