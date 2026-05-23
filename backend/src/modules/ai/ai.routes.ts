import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import * as aiController from "./ai.controller.js";
import { requireAuth, requireRole } from "../../shared/middleware/auth.middleware.js";
import { uploadDocument, uploadPrescriptionImage } from "../../shared/middleware/upload.middleware.js";

function handleUploadErrors(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Maximum size is 20MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof Error && err.message.startsWith("Invalid file type")) {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
}

export const aiRoutes = Router();

aiRoutes.use(requireAuth);

aiRoutes.post("/symptom-scan", requireRole("patient"), aiController.symptomScan);
aiRoutes.get("/health-summary", requireRole("patient"), aiController.healthSummary);
aiRoutes.post("/prescription-ocr", requireRole("patient"), aiController.prescriptionOcr);
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
  handleUploadErrors,
  aiController.uploadDocument,
);
aiRoutes.post("/document-chat", requireRole("patient"), aiController.documentChat);
