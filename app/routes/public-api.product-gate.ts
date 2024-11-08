import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

const GET_PRODUCT_GATE_QUERY = `#graphql
  query GetProductGate($productGid: ID!) {
	product(id: $productGid) {
      gates(includeInactive: true) {
        id
        active
        configuration {
          id
          name
          handle
          requirements: metafield(namespace: "offline-gate",
            key: "requirements") {
              value
          }
          reaction: metafield(namespace: "offline-gate",
            key: "reaction") {
              value
          }
          orderLimit: metafield(namespace: "offline-gate", key: "orderLimit") {
            value
          }
        }
      }
    }
  }`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, storefront } = await authenticate.public.appProxy(request);
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const handle = searchParams.get("handle");

  if (!storefront || !productId) {
    return new Response();
  }
  // TODO: HERE if put storefront.graphql cannot access the metadata, inform Shopify support
  const response = await admin.graphql(GET_PRODUCT_GATE_QUERY, {
    variables: {
      productGid: "gid://shopify/Product/" + productId,
    },
  });
  const body = await response.json();
  const gates = body.data?.product?.gates || [];
  console.log({ gates, handle });
  console.log({ gateReaction: gates[0].configuration.requirements });
  const gatesFromHandle = gates.filter(
    (gate: any) => gate.configuration.handle === handle,
  );
  return json(gatesFromHandle);
};
