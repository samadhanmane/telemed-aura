export type FieldError = { field: string; message: string };

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldError[];
  readonly code?: string;
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    options?: { errors?: FieldError[]; code?: string; cause?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = options?.errors;
    this.code = options?.code;
    this.isOperational = true;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function badRequest(message: string, errors?: FieldError[]) {
  return new AppError(400, message, { errors });
}

export function unauthorized(message = "Please login to continue") {
  return new AppError(401, message, { code: "UNAUTHORIZED" });
}

export function forbidden(message = "You do not have permission to access this resource") {
  return new AppError(403, message, { code: "FORBIDDEN" });
}

export function notFound(message = "Requested resource not found") {
  return new AppError(404, message);
}

export function conflict(message: string) {
  return new AppError(409, message);
}

export function unprocessable(message: string, errors?: FieldError[]) {
  return new AppError(422, message, { errors });
}

export function tooManyRequests(message = "Too many requests. Please wait before trying again.") {
  return new AppError(429, message);
}

export function internal(message = "Something went wrong on our server") {
  return new AppError(500, message);
}
