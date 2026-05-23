import type { Response } from "express";
import type { FieldError } from "../errors/app-error.js";

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: FieldError[];
  code?: string;
};

/** @deprecated Legacy shape — still accepted by frontend during migration */
export type LegacyErrorBody = { error: string; code?: string };

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200,
) {
  const body: ApiSuccess<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  options?: { errors?: FieldError[]; code?: string },
) {
  const body: ApiErrorBody = {
    success: false,
    message,
    ...(options?.errors?.length ? { errors: options.errors } : {}),
    ...(options?.code ? { code: options.code } : {}),
  };
  return res.status(statusCode).json(body);
}
