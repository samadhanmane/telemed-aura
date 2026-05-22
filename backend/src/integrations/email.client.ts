import { serviceUrls } from "../config/services.js";

/** Main API → email service HTTP client */
export async function triggerEmail(endpoint: string, body: unknown) {
  const res = await fetch(`${serviceUrls.email}/api/email/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
