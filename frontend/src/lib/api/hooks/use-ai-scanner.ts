import { useMutation } from "@tanstack/react-query";
import { runSymptomScan } from "@/lib/api/ai";

export function useAiScanner() {
  return useMutation({
    mutationFn: runSymptomScan,
  });
}
