/**
 * Main API + WebRTC signaling (same port — no separate video:dev required locally)
 */
import { createServer } from "node:http";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { connectDatabase } from "./database/connection.js";
import { attachSignaling } from "./signaling/socket.server.js";

loadEnv();

async function main() {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);
  attachSignaling(httpServer);

  const port = process.env.PORT ?? 4000;
  httpServer.listen(port, () => {
    console.log(`[api] listening on :${port}`);
    console.log(`[video] signaling on :${port}${process.env.SIGNALING_PATH ?? "/signaling"}`);
  });
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
