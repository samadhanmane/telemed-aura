import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error.js";
import { zodFieldErrors } from "../validations/common.js";

type ValidateSource = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: ValidateSource = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const errors = zodFieldErrors(parsed.error);
      const message = errors[0]?.message ?? "Validation failed";
      return next(new AppError(422, message, { errors, code: "VALIDATION_ERROR" }));
    }
    if (source === "body") {
      req.body = parsed.data;
    } else if (source === "query") {
      req.query = parsed.data as typeof req.query;
    } else {
      req.params = parsed.data as typeof req.params;
    }
    next();
  };
}
