import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import { localeFromRequest } from "../../../services/ai/i18n/locale.js";
import * as aiService from "./ai.service.js";

export async function symptomScan(req: AuthRequest, res: Response) {
  try {
    const { symptoms, description, bodyArea, vitals } = req.body;
    if (!symptoms?.length && !description) {
      return res.status(400).json({ error: "Add at least one symptom or description" });
    }
    const { User } = await import("../../database/models/index.js");
    const user = await User.findById(req.user!.userId);
    const locale = localeFromRequest(req.headers, req.body);
    const result = await aiService.runSymptomScan(req.user!.userId, {
      symptoms: symptoms ?? [],
      description,
      bodyArea,
      age: req.body.age ?? user?.age,
      chronicDiseases: user?.chronicDiseases,
      vitals,
      locale,
    });
    return res.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return res.status(400).json({ error: msg });
  }
}

export async function healthSummary(req: AuthRequest, res: Response) {
  try {
    const summary = await aiService.getHealthSummary(req.user!.userId);
    return res.json({ summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(400).json({ error: msg });
  }
}

export async function prescriptionOcr(req: AuthRequest, res: Response) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text required" });
    const result = aiService.analyzePrescriptionOcr(String(text));
    return res.json({ result });
  } catch {
    return res.status(400).json({ error: "OCR failed" });
  }
}

export async function prescriptionOcrFile(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file?.buffer) return res.status(400).json({ error: "file required" });

  try {
    const result = await aiService.analyzeAndStorePrescriptionUpload(req.user!.userId, {
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
    return res.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OCR failed";
    return res.status(400).json({ error: msg });
  }
}

export async function listPrescriptionUploads(req: AuthRequest, res: Response) {
  try {
    const uploads = await aiService.listPrescriptionUploads(req.user!.userId);
    return res.json({ uploads });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load uploads";
    return res.status(400).json({ error: msg });
  }
}

export async function riskVitals(req: AuthRequest, res: Response) {
  try {
    const result = aiService.calculateVitalsRisk(req.body);
    return res.json({ result });
  } catch {
    return res.status(400).json({ error: "Risk analysis failed" });
  }
}

export async function listDocuments(req: AuthRequest, res: Response) {
  try {
    const { listPatientDocuments } = await import(
      "../../../services/ai/doc-assistant/document-upload.service.js"
    );
    const documents = await listPatientDocuments(req.user!.userId);
    return res.json({ documents });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load documents";
    return res.status(400).json({ error: msg });
  }
}

export async function uploadDocument(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file?.buffer) return res.status(400).json({ error: "file required" });

  const documentType = (req.body.documentType as string) === "prescription" ? "prescription" : "report";
  const name = req.body.name ? String(req.body.name) : file.originalname;
  const category = req.body.category ? String(req.body.category) : "General";

  try {
    const { uploadPatientDocument } = await import(
      "../../../services/ai/doc-assistant/document-upload.service.js"
    );
    const result = await uploadPatientDocument(req.user!.userId, {
      documentType,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      name,
      category,
    });
    return res.json(result);
  } catch (e) {
    console.error("[ai] document upload failed:", e);
    const msg = e instanceof Error ? e.message : "Upload failed";
    const isConfig =
      msg.includes("Cloudinary is not configured") || msg.includes("Invalid file type");
    return res.status(isConfig ? 400 : 500).json({ error: msg });
  }
}

export async function documentChat(req: AuthRequest, res: Response) {
  try {
    const { question, reportIds, documentIds } = req.body;
    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return res.status(400).json({ error: "question required (min 2 characters)" });
    }
    const ids = Array.isArray(documentIds)
      ? documentIds.map(String)
      : Array.isArray(reportIds)
        ? reportIds.map(String)
        : undefined;
    const locale = localeFromRequest(req.headers, req.body);
    const result = await aiService.chatWithDocuments(req.user!.userId, {
      question: question.trim(),
      reportIds: ids,
      locale,
    });
    return res.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return res.status(400).json({ error: msg });
  }
}
