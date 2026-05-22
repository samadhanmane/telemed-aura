/**
 * Internal service URLs (email, ai, video) for gateway / service mesh.
 */

export const serviceUrls = {
  email: process.env.EMAIL_SERVICE_URL ?? "http://localhost:4001",
  ai: process.env.AI_SERVICE_URL ?? "http://localhost:4002",
  video: process.env.VIDEO_SERVICE_URL ?? "http://localhost:4003",
} as const;
