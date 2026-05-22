import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "text-primary bg-primary-soft",
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tone?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="group rounded-2xl border-border/60 p-5 shadow-soft transition-shadow hover:shadow-elevated">
        <div className="flex items-center justify-between">
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tone)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        {sub && <div className="mt-3 text-[11px] text-muted-foreground">{sub}</div>}
      </Card>
    </motion.div>
  );
}
