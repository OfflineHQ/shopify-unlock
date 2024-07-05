import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { z } from "zod";
import evaluateGate from "~/libs/public-api/evaluate-gate";
import { evaluateGateParamsSchema } from "~/libs/public-api/schema";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, storefront, session } =
    await authenticate.public.appProxy(request);
  const { searchParams } = new URL(request.url);
  const loggedInCustomerId = searchParams.get("logged_in_customer_id");

  if (!storefront || !loggedInCustomerId || !session) {
    return json({ message: "Invalid request" }, { status: 403 });
  }

  try {
    const rawData = await request.json();
    console.log({ rawData });
    const validatedData = evaluateGateParamsSchema.parse(rawData);

    const result = await evaluateGate(admin.graphql, {
      ...validatedData,
      shopDomain: session.shop,
      customerId: loggedInCustomerId,
    });
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 },
      );
    }
    console.error("Error in connect action:", error);
    return json({ message: "Internal server error" }, { status: 500 });
  }
};
