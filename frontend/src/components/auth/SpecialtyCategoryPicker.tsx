import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Specialty } from "@/lib/api/auth";
import {
  SPECIALTY_CATEGORIES,
  SPECIALTY_CATEGORY_MAP,
  getCategoryForSpecialty,
  type SpecialtyCategoryId,
} from "@/lib/specialty-categories";

type Props = {
  specialties: Specialty[];
  value: string;
  onChange: (specialtyId: string) => void;
  error?: string;
  label?: string;
};

export function SpecialtyCategoryPicker({ specialties, value, onChange, error, label }: Props) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<SpecialtyCategoryId>(() =>
    value ? getCategoryForSpecialty(value) : "primary",
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (value) setActiveCategory(getCategoryForSpecialty(value));
  }, [value]);

  const grouped = useMemo(() => {
    const map = new Map<SpecialtyCategoryId, Specialty[]>();
    for (const cat of SPECIALTY_CATEGORIES) map.set(cat.id, []);
    for (const s of specialties) {
      const catId = SPECIALTY_CATEGORY_MAP[s.id] ?? "specialist";
      map.get(catId)?.push(s);
    }
    return map;
  }, [specialties]);

  const categoriesWithItems = useMemo(
    () => SPECIALTY_CATEGORIES.filter((c) => (grouped.get(c.id)?.length ?? 0) > 0),
    [grouped],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredInCategory = useMemo(() => {
    const list = grouped.get(activeCategory) ?? [];
    if (!normalizedQuery) return list;
    return list.filter((s) => s.label.toLowerCase().includes(normalizedQuery));
  }, [activeCategory, grouped, normalizedQuery]);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return null;
    return specialties.filter((s) => s.label.toLowerCase().includes(normalizedQuery));
  }, [specialties, normalizedQuery]);

  const selectedLabel = specialties.find((s) => s.id === value)?.label;
  const visibleList = searchResults ?? filteredInCategory;

  return (
    <div className="space-y-2">
      <Label>{label ?? t("auth.specialty")}</Label>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border/60 px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("auth.specialtySearchPlaceholder")}
              className="h-9 border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex min-h-[240px] flex-col sm:min-h-[260px] sm:flex-row">
          {!normalizedQuery && (
            <nav
              className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 bg-muted/30 p-2 sm:w-44 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r md:w-48"
              aria-label={t("auth.specialtyCategoryNav")}
            >
              {categoriesWithItems.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                const count = grouped.get(cat.id)?.length ?? 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors sm:w-full sm:text-sm",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 font-medium leading-tight">{t(cat.labelKey)}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active ? "bg-primary-foreground/20" : "bg-muted-foreground/15",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {normalizedQuery
                ? t("auth.specialtySearchResults", { count: searchResults?.length ?? 0 })
                : t("auth.specialtyPickOne")}
            </p>
            <div className="grid gap-2">
              {visibleList.map((s) => {
                const selected = value === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange(s.id);
                      if (!normalizedQuery) setActiveCategory(getCategoryForSpecialty(s.id));
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary-soft ring-1 ring-primary/25"
                        : "border-border/60 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <span className="font-medium">{s.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
            {visibleList.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("auth.specialtyNoMatch")}</p>
            )}
          </div>
        </div>
      </div>

      {selectedLabel && (
        <p className="text-xs text-muted-foreground">
          {t("auth.specialtySelected")}: <span className="font-medium text-foreground">{selectedLabel}</span>
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
