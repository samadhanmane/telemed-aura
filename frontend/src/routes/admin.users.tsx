import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/lib/nav";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAdminUsers } from "@/lib/api/dashboard";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => requireRole("admin"),
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  joined: string;
};

function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const filtered = (users as AdminUser[]).filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardShell nav={adminNav} title="Admin" role="admin">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="User management" description="All registered accounts from MongoDB." />
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
        <Card className="mt-6 overflow-hidden rounded-2xl shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4 hidden md:table-cell">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 hidden text-muted-foreground md:table-cell">{u.email}</td>
                  <td className="p-4 capitalize">
                    <Badge variant="secondary">{u.role}</Badge>
                  </td>
                  <td className="p-4 hidden text-muted-foreground lg:table-cell">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
