import { createDirectDataController } from "@opendatalabs/vana-sdk/server";
import { createDefaultAccessRequestClient } from "@opendatalabs/vana-sdk/direct/access-request-client";
import type { AccessRequestClient } from "@opendatalabs/vana-sdk/direct/types";
import { privateKeyToAccount } from "viem/accounts";

export const aiSources = {
  chatgpt: ["chatgpt.conversations", "chatgpt.memories"],
  claude: ["claude.conversations", "claude.projects"],
} as const;

export type AiSource = keyof typeof aiSources;

type ReadAcknowledgement = {
  status: "acknowledged" | "failed";
  attempts: number;
  error?: string;
};

const readAcknowledgements = new Map<string, ReadAcknowledgement>();
const ACK_DELAYS_MS = [0, 750, 2_000] as const;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function rememberAcknowledgement(requestId: string, value: ReadAcknowledgement) {
  readAcknowledgements.set(requestId, value);
  if (readAcknowledgements.size > 500) {
    const oldest = readAcknowledgements.keys().next().value;
    if (oldest) readAcknowledgements.delete(oldest);
  }
}

export function getReadAcknowledgement(requestId: string) {
  return readAcknowledgements.get(requestId);
}

function createReliableAccessRequestClient(appPrivateKey: `0x${string}`): AccessRequestClient {
  const account = privateKeyToAccount(appPrivateKey);
  const client = createDefaultAccessRequestClient({
    baseUrl: "https://app.vana.org",
    approvalBaseUrl: "https://app.vana.org",
    appAddress: account.address,
    signMessage: (message) => account.signMessage({ message }),
  });

  return {
    ...client,
    async acknowledgeRead(requestId: string) {
      let lastError = "Vana did not acknowledge the read.";
      const markAcknowledged = (attempts: number, recovered = false) => {
        rememberAcknowledgement(requestId, { status: "acknowledged", attempts });
        console.info("[vana-read] consumer acknowledgement completed", {
          requestId,
          attempts,
          recovered,
          appAddress: account.address,
        });
      };
      for (let index = 0; index < ACK_DELAYS_MS.length; index += 1) {
        const delay = ACK_DELAYS_MS[index];
        if (delay) await wait(delay);
        try {
          await client.acknowledgeRead?.(requestId);
          markAcknowledged(index + 1);
          return;
        } catch (error) {
          lastError = errorMessage(error);
          try {
            const status = await client.getAccessRequestStatus(requestId);
            if (status.status === "completed") {
              markAcknowledged(index + 1, true);
              return;
            }
          } catch (statusError) {
            console.warn("[vana-read] could not verify acknowledgement status", {
              requestId,
              attempt: index + 1,
              error: errorMessage(statusError),
            });
          }
          console.warn("[vana-read] consumer acknowledgement attempt failed", {
            requestId,
            attempt: index + 1,
            error: lastError,
          });
        }
      }

      rememberAcknowledgement(requestId, {
        status: "failed",
        attempts: ACK_DELAYS_MS.length,
        error: lastError,
      });
      throw new Error(lastError);
    },
  };
}

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
    accessRequestClient: createReliableAccessRequestClient(appPrivateKey as `0x${string}`),
    app: {
      id: "context-passport",
      name: "Context Passport",
      homepageUrl,
    },
    source,
    scopes: [...aiSources[source]],
  });
}
