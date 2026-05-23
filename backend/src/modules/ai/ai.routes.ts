import { Router } from "express";
import * as aiController from "./ai.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { uploadDocument, uploadPrescriptionImage } from "../../shared/middleware/upload.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import {
  symptomScanSchema,
  prescriptionOcrTextSchema,
  documentChatSchema,
} from "../../shared/validations/ai.schemas.js";

export const aiRoutes = Router();

aiRoutes.use(requireAuth);

aiRoutes.post(
  "/symptom-scan",
  requireRole("patient"),
  validate(symptomScanSchema),
  aiController.symptomScan,
);
aiRoutes.get("/health-summary", requireRole("patient"), aiController.healthSummary);
aiRoutes.post(
  "/prescription-ocr",
  requireRole("patient"),
  validate(prescriptionOcrTextSchema),
  aiController.prescriptionOcr,
);
aiRoutes.post(
  "/prescription-ocr/file",
  requireRole("patient"),
  uploadPrescriptionImage.single("file"),
  aiController.prescriptionOcrFile,
);
aiRoutes.post("/risk-vitals", requireRole("patient"), aiController.riskVitals);
aiRoutes.get(
  "/prescription-uploads",
  requireRole("patient"),
  aiController.listPrescriptionUploads,
);
aiRoutes.get("/documents", requireRole("patient"), aiController.listDocuments);
aiRoutes.post(
  "/documents/upload",
  requireRole("patient"),
  uploadDocument.single("file"),
  aiController.uploadDocument,
);
aiRoutes.post(
  "/document-chat",
  requireRole("patient"),
  validate(documentChatSchema),
  aiController.documentChat,
);
