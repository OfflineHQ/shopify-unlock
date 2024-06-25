import { json } from "@remix-run/node";
import getHmac from "./get-hmac.server";
import verifySignatureWithCometh from "./proxy-request/verify-signature-with-cometh.server";
import type { EvaluateGateArgsSchema } from "./schema";

// TODO: connect without `ProductGateRequest` (because we would like to put a connection block into section and not only on page)

export default async function evaluateGate({
  address,
  message,
  signature,
  shopDomain,
  productGid,
  gateConfigurationGid,
  customerId,
}: EvaluateGateArgsSchema) {
  if (!address || !message || !signature) {
    return json({ message: "Invalid request" }, { status: 403 });
  }
  try {
    const isValidSignature = await verifySignatureWithCometh({
      address,
      message,
      signature,
    });
    if (!isValidSignature) {
      return json({ message: "Invalid signature" }, { status: 403 });
    }
    // the message signed is the customerId
    else if (message !== customerId) {
      return json({ message: "Invalid customerId" }, { status: 403 });
    }
    //TODO, get gate metadata with product
    // const requiredContractAddresses = await getProductGate({
    //   shopDomain,
    //   productGid,
    //   gatesHandle: process.env.OFFLINE_GATES_HANDLE,
    // });
    //TODO, for now we return a validated gate because we don't filter yet with segments etc.
    const payload = {
      vaults: [
        {
          ...getHmac(gateConfigurationGid),
          isLoyaltyCard: true,
          canMint: false,
        },
      ],
    };
    // TODO, in the context of connect with the product and gate also evaluate and return the vaults with hmac signature
    return json(payload, { status: 200 });
  } catch (error) {
    console.error("Signature verification failed:", error);
    return json({ message: "Failed to verify signature" }, { status: 500 });
  }
}
