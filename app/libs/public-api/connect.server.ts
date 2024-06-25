import { json } from "@remix-run/node";
import createLinkedCustomer from "./proxy-request/create-linked-customer.server";
import type { ConnectArgsSchema } from "./schema";
import {
  getVaultsPayload,
  verifySignatureAndCustomerId,
} from "./shared-functions.server";

export default async function connect(args: ConnectArgsSchema) {
  const {
    address,
    customerId,
    existingCustomer,
    shopDomain,
    gateConfigurationGid,
    productGid,
  } = args;

  if (!existingCustomer || !customerId) {
    return json({ message: "Invalid request" }, { status: 403 });
  }

  const existingCustomerAddress = existingCustomer.address?.toLowerCase() || "";

  if (
    existingCustomerAddress &&
    existingCustomerAddress !== address.toLowerCase()
  ) {
    return json({ message: "Invalid address" }, { status: 403 });
  }

  const verificationResult = await verifySignatureAndCustomerId(args);
  if (verificationResult) {
    return verificationResult;
  }

  if (!existingCustomerAddress) {
    await createLinkedCustomer({
      customerId,
      address: address.toLowerCase(),
      shopDomain,
    });
  }

  const vaultsPayload =
    gateConfigurationGid && productGid
      ? await getVaultsPayload({
          gateConfigurationGid,
          shopDomain,
          productGid,
        })
      : {};

  const payload = {
    linkedCustomer: {
      address,
    },
    walletAddress: address,
    walletVerificationMessage: args.message,
    walletVerificationSignature: args.signature,
    ...vaultsPayload,
  };

  return json(payload, { status: 200 });
}
