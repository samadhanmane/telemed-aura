/**
 * Main API + WebRTC signaling (same port — no separate video:dev required locally)
 */
import { createServer } from "node:http";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { connectDatabase } from "./database/connection.js";
import { attachSignaling } from "./signaling/socket.server.js";
import { parseFrontendOrigins } from "./config/frontend-origins.js";

loadEnv();

async function main() {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);
  attachSignaling(httpServer);

  const port = process.env.PORT ?? 4000;
  const { isCloudinaryConfigured } = await import("./integrations/cloudinary.service.js");
  httpServer.listen(port, () => {
    console.log(`[api] listening on :${port}`);
    if (process.env.API_PUBLIC_URL) {
      console.log(`[api] public URL: ${process.env.API_PUBLIC_URL}`);
    }
    const origins = parseFrontendOrigins();
    console.log(
      `[cors] allowed origins: ${origins.length ? origins.join(", ") : "(none — set FRONTEND_URL)"}`,
    );
    console.log(`[video] signaling on :${port}${process.env.SIGNALING_PATH ?? "/signaling"}`);
    console.log(
      isCloudinaryConfigured()
        ? "[cloudinary] configured (CLOUDINARY_NAME / CLOUDINARY_* env)"
        : "[cloudinary] NOT configured — Doc Assistant uploads will fail",
    );
    const aiModel = process.env.AI_MODEL ?? "gemini-2.0-flash-lite";
    console.log(`[ai] Gemini model: ${aiModel} (fallbacks: gemini-2.0-flash-lite, gemini-2.5-flash-lite)`);
  });
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
