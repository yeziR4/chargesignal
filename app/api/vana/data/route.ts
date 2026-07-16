import { getVanaController } from "@/lib/vana";
import { analyzeVanaReceiptData } from "@/lib/recurrence";

const cache = new Map<string, unknown>();
export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId) return Response.json({ error: "Missing requestId" }, { status: 400 });
  try {
    if (!cache.has(requestId)) {
      const approvedData = await getVanaController().readApprovedData({ requestId });
      cache.set(requestId, analyzeVanaReceiptData(approvedData));
    }
    return Response.json(cache.get(requestId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not read approved Vana data." }, { status: 503 });
  }
}
