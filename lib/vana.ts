import { createDirectDataController } from "@opendatalabs/vana-sdk/server";

export const commerceSources = {
  amazon: ["amazon.orders"],
  shop: ["shop.orders"],
  uber: ["uber.trips", "uber.receipts"],
} as const;

export type CommerceSource = keyof typeof commerceSources;

export function parseCommerceSource(value: unknown): CommerceSource | null {
  return typeof value === "string" && value in commerceSources
    ? value as CommerceSource
    : null;
}

export function getVanaController(source: CommerceSource) {
  const appPrivateKey = process.env.VANA_APP_PRIVATE_KEY;
  const homepageUrl = process.env.VANA_APP_URL;
  const network = process.env.VANA_NETWORK;
  if (!appPrivateKey || !homepageUrl || !["mainnet", "moksha"].includes(network ?? "")) {
    throw new Error("Live Vana mode is not configured. Set VANA_APP_PRIVATE_KEY, VANA_APP_URL, and VANA_NETWORK.");
  }
  return createDirectDataController({
    env: "production",
    network: network as "mainnet" | "moksha",
    appPrivateKey: appPrivateKey as `0x${string}`,
    app: {
      id: "charge-signal",
      name: "ChargeSignal",
      homepageUrl,
    },
    source,
    scopes: [...commerceSources[source]],
  });
}
