import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAdminUsers } from "@/data/mock/healthcare";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const filtered = mockAdminUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="User management" description="Roles, verification, and account status." />
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Card className="mt-6 overflow-hidden rounded-2xl shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4 hidden md:table-cell">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Verified</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 hidden text-muted-foreground md:table-cell">{u.email}</td>
                  <td className="p-4 capitalize">{u.role}</td>
                  <td className="p-4">
                    <Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge>
                  </td>
                  <td className="p-4">{u.verified ? "Yes" : "No"}</td>
                  <td className="p-4">
                    {u.status === "active" ? (
                      <Button size="sm" variant="destructive" onClick={() => toast.success(`Suspended ${u.name}`)}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toast.success(`Activated ${u.name}`)}>
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardShell>
  );
}
