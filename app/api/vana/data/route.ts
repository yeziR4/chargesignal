import { analyzeContextData } from "@/lib/context-passport";
import { getReadAcknowledgement, getVanaController, parseAiSource } from "@/lib/vana";

const cache = new Map<string, unknown>();
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const source = parseAiSource(url.searchParams.get("source"));
  if (!requestId) return Response.json({ error: "Missing requestId" }, { status: 400 });
  if (!source) return Response.json({ error: "Choose ChatGPT or Claude." }, { status: 400 });
  const cacheKey = `${source}:${requestId}`;
  try {
    if (!cache.has(cacheKey)) {
      const approvedData = await getVanaController(source).readApprovedData({ requestId });
      const acknowledgement = getReadAcknowledgement(requestId);
      if (acknowledgement?.status !== "acknowledged") {
        const detail = acknowledgement?.error ?? "Vana returned no consumer acknowledgement.";
        throw new Error(`The data was read, but Vana did not record it. Please retry. ${detail}`);
      }
      const result = analyzeContextData(source, approvedData);
      console.info("[vana-read] approved data analyzed", {
        requestId,
        source,
        paid: Boolean(approvedData.payment),
        conversations: result.conversationCount,
        userMessages: result.userMessageCount,
        words: result.wordCount,
      });
      cache.set(cacheKey, result);
    }
    return Response.json(cache.get(cacheKey));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not read approved Vana data." }, { status: 503 });
  }
}
