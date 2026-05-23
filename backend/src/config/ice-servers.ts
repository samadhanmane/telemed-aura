export type IceServerConfig = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

/** Parse comma- or newline-separated STUN/TURN URLs from env. */
function parseUrlList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\n]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

export function getIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [];

  const stunUrls = parseUrlList(process.env.STUN_URL);
  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls.length === 1 ? stunUrls[0]! : stunUrls });
  } else {
    servers.push({ urls: "stun:stun.l.google.com:19302" });
  }

  const turnUrls = [
    ...parseUrlList(process.env.TURN_URL),
    ...parseUrlList(process.env.TURN_URLS),
  ];
  const username = process.env.TURN_USERNAME?.trim();
  const credential = process.env.TURN_CREDENTIAL?.trim();

  if (turnUrls.length > 0 && username && credential) {
    servers.push({
      urls: turnUrls.length === 1 ? turnUrls[0]! : turnUrls,
      username,
      credential,
    });
  }

  return servers;
}

export function isTurnConfigured(): boolean {
  const turnUrls = [
    ...parseUrlList(process.env.TURN_URL),
    ...parseUrlList(process.env.TURN_URLS),
  ];
  return (
    turnUrls.length > 0 &&
    !!process.env.TURN_USERNAME?.trim() &&
    !!process.env.TURN_CREDENTIAL?.trim()
  );
}
