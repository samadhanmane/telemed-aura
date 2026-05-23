import { z } from "zod";

export const symptomScanSchema = z
  .object({
    symptoms: z.array(z.string()).optional(),
    description: z.string().trim().optional(),
    bodyArea: z.string().optional(),
    age: z.coerce.number().optional(),
    vitals: z
      .object({
        bloodPressureSystolic: z.number().optional(),
        bloodPressureDiastolic: z.number().optional(),
        sugarLevel: z.number().optional(),
        oxygenLevel: z.number().optional(),
      })
      .optional(),
    locale: z.string().optional(),
  })
  .refine((d) => (d.symptoms?.length ?? 0) > 0 || !!d.description?.trim(), {
    message: "Add at least one symptom or description",
  });

export const prescriptionOcrTextSchema = z.object({
  text: z.string().min(1, "Prescription text is required"),
});

export const documentChatSchema = z.object({
  question: z.string().trim().min(2, "question required (min 2 characters)"),
  reportIds: z.array(z.string()).optional(),
  documentIds: z.array(z.string()).optional(),
  locale: z.string().optional(),
});
