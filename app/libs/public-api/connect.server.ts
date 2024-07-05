import { json } from "@remix-run/node";
import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import updateCustomerMetafieldWallet from "../customers/setup-customer-metafield-wallet.server";
import createLinkedCustomer from "./proxy-request/create-linked-customer.server";
import type { ConnectArgsSchema } from "./schema";
import {
  getVaultsPayload,
  verifyCustomerAddress,
  verifySignatureAndCustomerId,
} from "./shared-functions.server";

export default async function connect(
  graphql: AdminGraphqlClient,
  args: ConnectArgsSchema,
) {
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

  const existingCustomerAddress = existingCustomer.address;
  const isAddressValidError = verifyCustomerAddress({
    address,
    existingCustomerAddress,
  });
  if (isAddressValidError) {
    return isAddressValidError;
  }

  const verificationResultError = await verifySignatureAndCustomerId(args);
  if (verificationResultError) {
    return verificationResultError;
  }

  if (!existingCustomerAddress) {
    // TODO add for createLinkedCustomer info relating to the device used for the creation of the passkey (user agent)
    // could be useful to indicate to the user which device should hold the passkey
    await createLinkedCustomer({
      customerId,
      address: address.toLowerCase(),
      shopDomain,
    });
    await updateCustomerMetafieldWallet({
      customerId,
      walletAddress: address.toLowerCase(),
      graphql,
    });
  }

  const vaultsPayload =
    gateConfigurationGid && productGid
      ? await getVaultsPayload({
          gateConfigurationGid,
          shopDomain,
          productGid,
          address,
          customerId,
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
