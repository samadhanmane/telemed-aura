import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as emrService from "./emr.service.js";

export async function getMyEmr(req: AuthRequest, res: Response) {
  try {
    const data = await emrService.getPatientEmr(req.user!.userId);
    return res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load EMR";
    return res.status(400).json({ error: msg });
  }
}

export async function generateMySnapshot(req: AuthRequest, res: Response) {
  try {
    const snap = await emrService.generateEmrSnapshot(
      req.user!.userId,
      "patient",
      req.user!.userId,
      "Patient-requested snapshot",
    );
    return res.status(201).json({ snapshot: snap });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate snapshot";
    return res.status(400).json({ error: msg });
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await emrService.updatePatientHealthProfile(req.user!.userId, req.body);
    return res.json({ profile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return res.status(400).json({ error: msg });
  }
}

export async function recordMyVitals(req: AuthRequest, res: Response) {
  try {
    const vital = await emrService.recordVitals(req.user!.userId, {
      source: "manual",
      ...req.body,
    });
    return res.status(201).json({ vital });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save vitals";
    return res.status(400).json({ error: msg });
  }
}

export async function getPatientEmrForDoctor(req: AuthRequest, res: Response) {
  try {
    const data = await emrService.getDoctorPatientEmr(
      req.user!.userId,
      String(req.params.patientId),
    );
    return res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "EMR not available";
    return res.status(403).json({ error: msg });
  }
}

export async function generatePatientSnapshot(req: AuthRequest, res: Response) {
  try {
    await emrService.assertDoctorCanViewEmr(req.user!.userId, String(req.params.patientId));
    const snap = await emrService.generateEmrSnapshot(
      String(req.params.patientId),
      "doctor",
      req.user!.userId,
      "Doctor-requested snapshot",
    );
    return res.status(201).json({ snapshot: snap });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(400).json({ error: msg });
  }
}

export async function listDoctorPatientsEmr(req: AuthRequest, res: Response) {
  try {
    const patients = await emrService.listDoctorPatientsEmr(req.user!.userId);
    return res.json({ patients });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return res.status(400).json({ error: msg });
  }
}

export async function saveConsultationConclusion(req: AuthRequest, res: Response) {
  try {
    const record = await emrService.finalizeConsultationEmr(
      String(req.params.appointmentId),
      req.user!.userId,
      req.body,
    );
    return res.status(201).json({ record });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save consultation record";
    return res.status(400).json({ error: msg });
  }
}
