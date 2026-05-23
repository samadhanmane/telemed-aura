import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error.js";
import { sendError } from "../utils/response.js";
import { zodFieldErrors } from "../validations/common.js";

const KNOWN_MESSAGES: Record<string, { status: number; message?: string; code?: string }> = {
  "Email already registered": { status: 409, message: "Email already registered" },
  "Email already registered — sign in instead": {
    status: 409,
    message: "Email already registered",
  },
  "Invalid email or password": { status: 401, message: "Invalid email or password" },
  Forbidden: { status: 403, message: "You do not have permission to access this resource" },
  "Not authorized for this consultation": {
    status: 403,
    message: "You are not authorized to join this consultation",
  },
  "Appointment not found": { status: 404, message: "Requested resource not found" },
  "Doctor not found": { status: 404, message: "Doctor not found" },
  "This time is not available — choose a free slot": {
    status: 409,
    message: "Selected slot is already booked",
  },
  "No free slots on this date — pick another day or update availability": {
    status: 409,
    message: "Time slot unavailable",
  },
  "Consultation is not available. Appointment must be confirmed.": {
    status: 403,
    message: "Consultation has not started yet",
  },
  "This appointment was cancelled.": { status: 400, message: "Appointment already cancelled" },
  "Appointments cannot be booked in the past": {
    status: 400,
    message: "Appointments cannot be booked in the past",
  },
  "You have no consultation history with this patient": {
    status: 403,
    message: "You do not have permission to access this resource",
  },
  "EMR not available": { status: 403, message: "Access denied" },
  "Not your appointment": { status: 403, message: "You do not have permission to access this resource" },
  "You can rate only after the consultation is completed": {
    status: 400,
    message: "You can rate only after the consultation is completed",
  },
  "You already reviewed this consultation": {
    status: 409,
    message: "You already reviewed this consultation",
  },
  "Report not found": { status: 404, message: "Requested resource not found" },
  "Patient not found": { status: 404, message: "Requested resource not found" },
  "Could not send verification email. Check SMTP settings and try again.": {
    status: 503,
    message: "Unable to send email notification",
  },
  "File storage is not configured — cannot upload certificate": {
    status: 503,
    message: "File storage is not configured. Contact support.",
  },
};

function mapMongoError(err: mongoose.Error): AppError | null {
  if (err.name === "ValidationError") {
    const ve = err as mongoose.Error.ValidationError;
    const errors = Object.values(ve.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new AppError(422, "Validation failed", { errors, code: "VALIDATION_ERROR" });
  }
  if ((err as { code?: number }).code === 11000) {
    const key = Object.keys((err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})[0];
    if (key?.includes("email")) {
      return new AppError(409, "Email already registered");
    }
    return new AppError(409, "Booking conflict detected", { code: "DUPLICATE_KEY" });
  }
  if (err.name === "CastError") {
    return new AppError(400, "Invalid request");
  }
  return null;
}

function mapJwtError(err: Error): AppError | null {
  if (err instanceof jwt.TokenExpiredError) {
    return new AppError(401, "Your session has expired. Please login again.", {
      code: "TOKEN_EXPIRED",
    });
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return new AppError(401, "Invalid authentication token", { code: "INVALID_TOKEN" });
  }
  return null;
}

function mapKnownMessage(message: string): AppError | null {
  const exact = KNOWN_MESSAGES[message];
  if (exact) {
    return new AppError(exact.status, exact.message ?? message, { code: exact.code });
  }
  if (message.includes("REGISTRATION_PENDING")) {
    return new AppError(403, message, { code: "REGISTRATION_PENDING" });
  }
  if (message.includes("REGISTRATION_REJECTED")) {
    return new AppError(403, message, { code: "REGISTRATION_REJECTED" });
  }
  return null;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 413, "File too large. Maximum size is 20MB.");
    }
    return sendError(res, 400, "Invalid file upload");
  }

  if (err instanceof Error && err.message.startsWith("Invalid file type")) {
    return sendError(res, 400, err.message);
  }

  if (err instanceof ZodError) {
    const errors = zodFieldErrors(err);
    return sendError(res, 422, errors[0]?.message ?? "Validation failed", {
      errors,
      code: "VALIDATION_ERROR",
    });
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, {
      errors: err.errors,
      code: err.code,
    });
  }

  if (err instanceof mongoose.Error) {
    const mapped = mapMongoError(err);
    if (mapped) {
      return sendError(res, mapped.statusCode, mapped.message, {
        errors: mapped.errors,
        code: mapped.code,
      });
    }
  }

  if (err instanceof Error) {
    const coded = err as Error & { code?: string };
    if (coded.code === "REGISTRATION_PENDING" || coded.code === "REGISTRATION_REJECTED") {
      return sendError(res, 403, err.message, { code: coded.code });
    }

    const jwtMapped = mapJwtError(err);
    if (jwtMapped) {
      return sendError(res, jwtMapped.statusCode, jwtMapped.message, { code: jwtMapped.code });
    }

    const known = mapKnownMessage(err.message);
    if (known) {
      return sendError(res, known.statusCode, known.message, { code: known.code });
    }
  }

  console.error("[error]", err);
  return sendError(res, 500, "Something went wrong on our server");
}
