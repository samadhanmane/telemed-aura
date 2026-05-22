import { useQuery } from "@tanstack/react-query";
import { mockPrescriptions } from "@/data/mock/healthcare";

export function usePrescriptions(patientId?: string) {
  return useQuery({
    queryKey: ["prescriptions", patientId],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      if (!patientId) return mockPrescriptions;
      return mockPrescriptions.filter((p) => p.patientId === patientId);
    },
  });
}
