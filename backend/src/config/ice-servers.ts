export function getIceServers() {
  const servers: { urls: string | string[]; username?: string; credential?: string }[] = [
    { urls: process.env.STUN_URL ?? "stun:stun.l.google.com:19302" },
  ];
  const turnUrl = process.env.TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }
  return servers;
}
