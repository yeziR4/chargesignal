import { getVanaAppUrl, getVanaController, parseAiSource } from "@/lib/vana";

export async function POST(request: Request) {
  try {
    const source = parseAiSource((await request.json())?.source);
    if (!source) return Response.json({ error: "Choose ChatGPT, Claude, or YouTube." }, { status: 400 });
    const accessRequest = await getVanaController(source).createAccessRequest({
      returnUrl: `${getVanaAppUrl()}/connect/return?source=${source}`,
    });
    return Response.json(accessRequest);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create a Vana access request." }, { status: 503 });
  }
}
