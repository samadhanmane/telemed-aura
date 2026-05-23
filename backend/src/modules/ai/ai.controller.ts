import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import { localeFromRequest } from "../../../services/ai/i18n/locale.js";
import * as aiService from "./ai.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { badRequest } from "../../shared/errors/app-error.js";

export const symptomScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { symptoms, description, bodyArea, vitals } = req.body;
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
  return sendSuccess(res, "Symptom analysis complete", { result });
});

export const healthSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const summary = await aiService.getHealthSummary(req.user!.userId);
  return sendSuccess(res, "Health summary loaded", { summary });
});

export const prescriptionOcr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  const result = aiService.analyzePrescriptionOcr(String(text));
  return sendSuccess(res, "Prescription analyzed", { result });
});

export const prescriptionOcrFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file?.buffer) throw badRequest("Please upload a prescription image or PDF");

  const result = await aiService.analyzeAndStorePrescriptionUpload(req.user!.userId, {
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
  });
  return sendSuccess(res, "Prescription uploaded and analyzed", { result });
});

export const listPrescriptionUploads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const uploads = await aiService.listPrescriptionUploads(req.user!.userId);
  return sendSuccess(res, "Uploads loaded", { uploads });
});

export const riskVitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = aiService.calculateVitalsRisk(req.body);
  return sendSuccess(res, "Risk analysis complete", { result });
});

export const listDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listPatientDocuments } = await import(
    "../../../services/ai/doc-assistant/document-upload.service.js"
  );
  const documents = await listPatientDocuments(req.user!.userId);
  return sendSuccess(res, "Documents loaded", { documents });
});

export const uploadDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file?.buffer) throw badRequest("Please upload a document file");

  const documentType = (req.body.documentType as string) === "prescription" ? "prescription" : "report";
  const name = req.body.name ? String(req.body.name) : file.originalname;
  const category = req.body.category ? String(req.body.category) : "General";

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
  return sendSuccess(res, "Document uploaded successfully", result);
});

export const documentChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { question, reportIds, documentIds } = req.body;
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
  return sendSuccess(res, "Answer ready", { result });
});
