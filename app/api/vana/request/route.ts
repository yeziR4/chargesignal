import { getVanaController } from "@/lib/vana";

export async function POST() {
  try {
    const request = await getVanaController().createAccessRequest({
      returnUrl: `${process.env.VANA_APP_URL}/connect/return`,
    });
    return Response.json(request);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create a Vana access request." }, { status: 503 });
  }
}

