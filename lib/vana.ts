import { createDirectDataController } from "@opendatalabs/vana-sdk/server";

export function getVanaController() {
  const appPrivateKey = process.env.VANA_APP_PRIVATE_KEY;
  const homepageUrl = process.env.VANA_APP_URL;
  if (!appPrivateKey || !homepageUrl) {
    throw new Error("Live Vana mode is not configured. Set VANA_APP_PRIVATE_KEY and VANA_APP_URL.");
  }
  return createDirectDataController({
    env: "production",
    network: process.env.VANA_NETWORK === "mainnet" ? "mainnet" : "moksha",
    appPrivateKey: appPrivateKey as `0x${string}`,
    app: {
      id: "charge-signal",
      name: "ChargeSignal",
      homepageUrl,
    },
    source: "gmail",
    scopes: ["gmail.receipts"],
  });
}

