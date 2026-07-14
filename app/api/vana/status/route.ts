import { getVanaController } from "@/lib/vana";

export async function GET(request: Request) {
  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId) return Response.json({ error: "Missing requestId" }, { status: 400 });
  try {
    return Response.json(await getVanaController().getAccessRequestStatus(requestId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not check Vana approval." }, { status: 503 });
  }
}

