import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { badRequest } from "../../shared/errors/app-error.js";
import { sendError } from "../../shared/utils/response.js";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 180) || "download";
}

function isAllowedFileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("cloudinary.com")) return true;
    if (u.pathname.startsWith("/uploads/")) return true;
    return false;
  } catch {
    return false;
  }
}

export const downloadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rawUrl = String(req.query.url ?? "").trim();
  const filename = sanitizeFilename(String(req.query.filename ?? "download"));

  if (!rawUrl) {
    throw badRequest("url query parameter is required");
  }
  if (!isAllowedFileUrl(rawUrl)) {
    throw badRequest("File URL is not allowed");
  }

  const upstream = await fetch(rawUrl);
  if (!upstream.ok) {
    return sendError(res, 502, "Could not fetch file from storage");
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  const contentType =
    upstream.headers.get("content-type")?.split(";")[0]?.trim() ?? "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", String(buffer.length));
  return res.send(buffer);
});
