import { useQuery } from "@tanstack/react-query";
import { fetchMyPrescriptions } from "@/lib/api/clinical";

export function usePrescriptions() {
  return useQuery({
    queryKey: ["prescriptions"],
    queryFn: fetchMyPrescriptions,
  });
}
