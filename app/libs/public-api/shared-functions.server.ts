import { json } from "@remix-run/node";
import getHmac from "./get-hmac.server";
import verifySignatureWithCometh from "./proxy-request/verify-signature-with-cometh.server";
import type { ConnectArgsSchema, EvaluateGateArgsSchema } from "./schema";

export async function verifySignatureAndCustomerId(
  args: EvaluateGateArgsSchema | ConnectArgsSchema,
) {
  const { address, message, signature, customerId } = args;

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
    if (message !== customerId) {
      return json({ message: "Invalid customerId" }, { status: 403 });
    }
    return null; // Indicates success
  } catch (error) {
    console.error("Signature verification failed:", error);
    return json({ message: "Failed to verify signature" }, { status: 500 });
  }
}

export async function getVaultsPayload(
  args: Pick<
    EvaluateGateArgsSchema,
    "gateConfigurationGid" | "shopDomain" | "productGid"
  >,
) {
  const { gateConfigurationGid, shopDomain, productGid } = args;

  // TODO: Implement actual logic to get gate metadata with product
  // const requiredContractAddresses = await getProductGate({
  //   shopDomain,
  //   productGid,
  //   gatesHandle: process.env.OFFLINE_GATES_HANDLE,
  // });

  // TODO: For now we return a validated gate because we don't filter yet with segments etc.
  return {
    vaults: [
      {
        ...getHmac(gateConfigurationGid),
        isLoyaltyCard: true,
        canMint: false,
      },
    ],
  };
}
