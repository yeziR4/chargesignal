import { getVanaController, parseCommerceSource } from "@/lib/vana";

export async function POST(request: Request) {
  try {
    const source = parseCommerceSource((await request.json())?.source);
    if (!source) return Response.json({ error: "Choose a supported data source." }, { status: 400 });
    const accessRequest = await getVanaController(source).createAccessRequest({
      returnUrl: `${process.env.VANA_APP_URL}/connect/return?source=${source}`,
    });
    return Response.json(accessRequest);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create a Vana access request." }, { status: 503 });
  }
}
