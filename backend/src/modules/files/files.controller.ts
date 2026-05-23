import type { Response } from "express";
import type { AuthRequest } from "../../shared/middleware/auth.middleware.js";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 180) || "download";
}

/** Only Cloudinary or this API's /uploads paths — blocks open redirects. */
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

export async function downloadFile(req: AuthRequest, res: Response) {
  try {
    const rawUrl = String(req.query.url ?? "").trim();
    const filename = sanitizeFilename(String(req.query.filename ?? "download"));

    if (!rawUrl) {
      return res.status(400).json({ error: "url query parameter is required" });
    }
    if (!isAllowedFileUrl(rawUrl)) {
      return res.status(400).json({ error: "File URL is not allowed" });
    }

    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      return res.status(502).json({ error: "Could not fetch file from storage" });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() ?? "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(buffer.length));
    return res.send(buffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Download failed";
    return res.status(500).json({ error: msg });
  }
}
