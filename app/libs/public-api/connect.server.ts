import { json } from "@remix-run/node";
import createLinkedCustomer from "./proxy-request/create-linked-customer.server";
import type { GetLinkedCustomerResponse } from "./proxy-request/get-linked-customer.server";
import type { VerifySignatureWithCometh } from "./proxy-request/verify-signature-with-cometh.server";
import verifySignatureWithCometh from "./proxy-request/verify-signature-with-cometh.server";
import type { ProductGateRequest, StorefrontRequest } from "./types";

// TODO: connect without `ProductGateRequest` (because we would like to put a connection block into section and not only on page)
export interface Connect
  extends VerifySignatureWithCometh,
    StorefrontRequest,
    ProductGateRequest {
  existingCustomer: GetLinkedCustomerResponse;
}

export default async function connect({
  address,
  message,
  signature,
  shopDomain,
  productGid,
  gateConfigurationGid,
  customerId,
  existingCustomer,
}: Connect) {
  if (!existingCustomer || !customerId || !address || !message || !signature) {
    return json({ message: "Invalid request" }, { status: 403 });
  }

  const existingCutomerAddress = existingCustomer.address?.toLowerCase() || "";

  if (
    existingCutomerAddress &&
    existingCutomerAddress !== address.toLowerCase()
  ) {
    return json({ message: "Invalid address" }, { status: 403 });
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
    if (!existingCutomerAddress) {
      await createLinkedCustomer({
        customerId,
        address: address.toLowerCase(),
        shopDomain,
      });
    }
    return json({ message: "Connected" }, { status: 200 });
  } catch (error) {
    console.error("Signature verification failed:", error);
    return json({ message: "Failed to verify signature" }, { status: 500 });
  }
}
