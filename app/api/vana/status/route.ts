import { getVanaController, parseAiSource } from "@/lib/vana";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const source = parseAiSource(url.searchParams.get("source"));
  if (!requestId) return Response.json({ error: "Missing requestId" }, { status: 400 });
  if (!source) return Response.json({ error: "Choose ChatGPT, Claude, or YouTube." }, { status: 400 });
  try {
    return Response.json(await getVanaController(source).getAccessRequestStatus(requestId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not check Vana approval." }, { status: 503 });
  }
}
