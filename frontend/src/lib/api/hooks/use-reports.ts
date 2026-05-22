import { useQuery } from "@tanstack/react-query";
import { useReportStore } from "@/stores/report-store";

export function useReports() {
  const reports = useReportStore((s) => s.reports);
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 250));
      return reports;
    },
    initialData: reports,
  });
}
