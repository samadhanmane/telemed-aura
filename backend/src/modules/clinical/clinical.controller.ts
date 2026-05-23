import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import * as clinicalService from "./clinical.service.js";
import * as appointmentsService from "../appointments/appointments.service.js";
import * as triageService from "./triage.service.js";
import * as criticalCareService from "./critical-care.service.js";
import { getTodayDateString } from "../../shared/appointment-slots.js";
import { getPatientSeveritySnapshot } from "./patient-severity.service.js";
import { getNextFreeSlot } from "../doctors/doctors.service.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { badRequest } from "../../shared/errors/app-error.js";

export const getPatientContext = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ctx = await clinicalService.getPatientContext(
    req.user!.userId,
    String(req.params.patientId),
  );
  return sendSuccess(res, "Patient context loaded", ctx);
});

export const updateNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, appointmentId } = req.body;
  const note = await clinicalService.upsertClinicalNote(
    req.user!.userId,
    String(req.params.patientId),
    String(content),
    appointmentId,
  );
  return sendSuccess(res, "Clinical note saved", { note });
});

export const createPrescription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { medicines, instructions, appointmentId } = req.body;
  const rx = await clinicalService.createPrescription(req.user!.userId, {
    patientId: String(req.params.patientId),
    appointmentId,
    medicines,
    instructions: instructions ?? "",
  });
  return sendSuccess(res, "Prescription saved", { prescription: rx }, 201);
});

export const scheduleFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { patientId, date, time, specialty, sourceAppointmentId } = req.body;
  const appointment = await appointmentsService.createFollowUpAppointment(req.user!.userId, {
    patientId,
    date,
    time,
    specialty,
    sourceAppointmentId,
  });

  if (sourceAppointmentId && typeof sourceAppointmentId === "string") {
    const { emitToAppointmentRoom } = await import("../../signaling/io.js");
    const { SIGNALING_EVENTS } = await import("../../signaling/events.js");
    emitToAppointmentRoom(sourceAppointmentId, SIGNALING_EVENTS.FOLLOW_UP_SCHEDULED, {
      appointment,
    });
  }

  return sendSuccess(res, "Follow-up scheduled", { appointment }, 201);
});

export const uploadReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file?.buffer) {
    throw badRequest(
      "Upload a file (PDF, PNG, or JPG) for full OCR, image detection, and AI analysis",
    );
  }
  const name = (req.body.name as string) || file.originalname;
  const category = (req.body.category as string) || "General";
  const result = await import("../ai/ai.service.js").then((m) =>
    m.uploadAndAnalyzeReport(req.user!.userId, {
      name,
      category,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    }),
  );
  return sendSuccess(res, "Report uploaded and analyzed", result, 201);
});

export const listDoctorReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reports = await clinicalService.listDoctorPatientReports(req.user!.userId);
  return sendSuccess(res, "Reports loaded", { reports });
});

export const listMyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reports = await clinicalService.listPatientReports(req.user!.userId);
  return sendSuccess(res, "Reports loaded", { reports });
});

export const listMyPrescriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescriptions = await clinicalService.listPrescriptionsForPatient(req.user!.userId);
  return sendSuccess(res, "Prescriptions loaded", { prescriptions });
});

export const reviewReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks, severityOverride, confirmedFlags } = req.body;
  const report = await clinicalService.reviewMedicalReport(
    req.user!.userId,
    String(req.params.reportId),
    { remarks: String(remarks), severityOverride, confirmedFlags },
  );
  return sendSuccess(res, "Report review saved", { report });
});

export const listDoctorPrescriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescriptions = await clinicalService.listDoctorPrescriptions(req.user!.userId);
  return sendSuccess(res, "Prescriptions loaded", { prescriptions });
});

export const getTriageQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await criticalCareService.listMyPatientsNonCriticalQueue(req.user!.userId);
  return sendSuccess(res, "Triage queue loaded", data);
});

export const listCriticalPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await triageService.listPlatformCriticalPatients(req.user!.userId);
  return sendSuccess(res, "Critical patients loaded", data);
});

export const getPatientSeverity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const severity = await getPatientSeveritySnapshot(String(req.params.patientId));
  return sendSuccess(res, "Severity loaded", { severity });
});

export const urgentBook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { patientId, date, time, specialty, rescheduleOtherAppointmentId } = req.body;
  const result = await criticalCareService.acceptCriticalImmediate(req.user!.userId, {
    patientId,
    date,
    time,
    specialty,
  });
  if (rescheduleOtherAppointmentId && result.mustRescheduleFirst) {
    await triageService.rescheduleAppointment(req.user!.userId, rescheduleOtherAppointmentId, {
      autoNextSlot: true,
      reason: "Rescheduled for critical patient acceptance",
    });
  }
  return sendSuccess(res, "Urgent appointment booked", result, 201);
});

export const acceptCriticalPatient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { patientId, date, time, specialty } = req.body;
  const result = await criticalCareService.acceptCriticalImmediate(req.user!.userId, {
    patientId,
    date,
    time,
    specialty,
  });
  return sendSuccess(res, "Critical patient accepted", result, 201);
});

export const getPatientCriticalAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const alert = await criticalCareService.getActiveAlertForPatient(req.user!.userId);
  const slots =
    alert?.canPatientBook && req.query.doctorId
      ? await import("../doctors/doctors.service.js").then((m) =>
          m.getAvailableSlots(
            String(req.query.doctorId),
            String(req.query.date ?? getTodayDateString()),
          ),
        )
      : [];
  return sendSuccess(res, "Critical alert loaded", { alert, slots });
});

export const dismissPatientCriticalAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  await criticalCareService.dismissCriticalNotification(req.user!.userId);
  return sendSuccess(res, "Alert dismissed", { ok: true });
});

export const patientCriticalBook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { doctorId, date, time } = req.body;
  const result = await criticalCareService.patientBookCritical(req.user!.userId, {
    doctorId,
    date,
    time,
  });
  return sendSuccess(res, "Urgent appointment booked", result, 201);
});

export const rescheduleBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appointmentId, date, time, autoNextSlot, reason } = req.body;
  const appointment = await triageService.rescheduleAppointment(
    req.user!.userId,
    String(appointmentId),
    { date, time, autoNextSlot, reason },
  );
  return sendSuccess(res, "Appointment rescheduled", { appointment });
});

export const nextFreeSlot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const date = (req.query.date as string) || undefined;
  const slot = await getNextFreeSlot(req.user!.userId, date);
  return sendSuccess(res, slot ? "Next slot found" : "No slots available", { slot });
});
