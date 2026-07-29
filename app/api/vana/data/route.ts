import { analyzeContextData } from "@/lib/context-passport";
import { getVanaController, parseAiSource } from "@/lib/vana";

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
      cache.set(cacheKey, analyzeContextData(source, approvedData));
    }
    return Response.json(cache.get(cacheKey));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not read approved Vana data." }, { status: 503 });
  }
}
