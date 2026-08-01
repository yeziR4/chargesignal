import { createDirectDataController } from "@opendatalabs/vana-sdk/server";

export const aiSources = {
  chatgpt: ["chatgpt.conversations", "chatgpt.memories"],
  claude: ["claude.conversations", "claude.projects"],
} as const;

export type AiSource = keyof typeof aiSources;

export function parseAiSource(value: unknown): AiSource | null {
  return typeof value === "string" && value in aiSources
    ? value as AiSource
    : null;
}

export function getVanaAppUrl() {
  const value = process.env.VANA_APP_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("VANA_APP_URL is not configured.");
  return value;
}

export function getVanaController(source: AiSource) {
  const appPrivateKey = process.env.VANA_APP_PRIVATE_KEY;
  const homepageUrl = getVanaAppUrl();
  const network = process.env.VANA_NETWORK;
  if (!appPrivateKey || !["mainnet", "moksha"].includes(network ?? "")) {
    throw new Error("Live Vana mode is not configured. Set VANA_APP_PRIVATE_KEY, VANA_APP_URL, and VANA_NETWORK.");
  }
  return createDirectDataController({
    env: "production",
    network: network as "mainnet" | "moksha",
    appPrivateKey: appPrivateKey as `0x${string}`,
    app: {
      id: "threadprint",
      name: "Threadprint",
      homepageUrl,
    },
    source,
    scopes: [...aiSources[source]],
  });
}
