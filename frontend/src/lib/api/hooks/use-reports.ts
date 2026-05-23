import { useQuery } from "@tanstack/react-query";
import { fetchMyReports } from "@/lib/api/clinical";

export function useReports() {
  return useQuery({
    queryKey: ["my-reports"],
    queryFn: fetchMyReports,
  });
}
