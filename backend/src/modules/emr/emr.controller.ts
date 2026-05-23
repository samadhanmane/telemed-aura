import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as emrService from "./emr.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";

export const getMyEmr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await emrService.getPatientEmr(req.user!.userId);
  return sendSuccess(res, "EMR loaded", data);
});

export const generateMySnapshot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const snap = await emrService.generateEmrSnapshot(
    req.user!.userId,
    "patient",
    req.user!.userId,
    "Patient-requested snapshot",
  );
  return sendSuccess(res, "EMR snapshot generated", { snapshot: snap }, 201);
});

export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await emrService.updatePatientHealthProfile(req.user!.userId, req.body);
  return sendSuccess(res, "Health profile updated", { profile });
});

export const recordMyVitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vital = await emrService.recordVitals(req.user!.userId, {
    source: "manual",
    ...req.body,
  });
  return sendSuccess(res, "Vitals recorded", { vital }, 201);
});

export const getPatientEmrForDoctor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await emrService.getDoctorPatientEmr(
    req.user!.userId,
    String(req.params.patientId),
  );
  return sendSuccess(res, "Patient EMR loaded", data);
});

export const generatePatientSnapshot = asyncHandler(async (req: AuthRequest, res: Response) => {
  await emrService.assertDoctorCanViewEmr(req.user!.userId, String(req.params.patientId));
  const snap = await emrService.generateEmrSnapshot(
    String(req.params.patientId),
    "doctor",
    req.user!.userId,
    "Doctor-requested snapshot",
  );
  return sendSuccess(res, "EMR snapshot generated", { snapshot: snap }, 201);
});

export const listDoctorPatientsEmr = asyncHandler(async (req: AuthRequest, res: Response) => {
  const patients = await emrService.listDoctorPatientsEmr(req.user!.userId);
  return sendSuccess(res, "Patients loaded", { patients });
});

export const saveConsultationConclusion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const record = await emrService.finalizeConsultationEmr(
    String(req.params.appointmentId),
    req.user!.userId,
    req.body,
  );
  return sendSuccess(res, "Consultation record saved", { record }, 201);
});
