import { env } from "@/lib/env";

/** Turn `/uploads/...` from API into a browser-loadable URL */
export function resolveUploadUrl(fileUrl?: string): string | undefined {
  if (!fileUrl) return undefined;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  const apiBase = env.apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${apiBase}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}
