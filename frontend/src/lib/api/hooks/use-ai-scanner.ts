import { useMutation } from "@tanstack/react-query";
import type { AiScanResult } from "@/types/healthcare";

export function useAiScanner() {
  return useMutation({
    mutationFn: async (input: {
      symptoms: string[];
      description: string;
      bodyArea?: string;
    }): Promise<AiScanResult> => {
      await new Promise((r) => setTimeout(r, 1800));
      const hasChest = input.symptoms.some((s) =>
        s.toLowerCase().includes("chest"),
      );
      return {
        risk: hasChest ? 72 : 58,
        severity: hasChest ? "Moderate" : "Low",
        suggestedSpecialist: hasChest
          ? "Cardiology"
          : input.bodyArea === "skin"
            ? "Dermatology"
            : "General Physician",
        bodyArea: input.bodyArea,
      };
    },
  });
}
