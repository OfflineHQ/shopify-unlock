import { json } from "@remix-run/node";
import { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import getCustomerWalletAddress from "../customers/get-customer-metafield-wallet.server";
import type { EvaluateGateArgsSchema } from "./schema";
import {
  getVaultsPayload,
  verifyCustomerAddress,
} from "./shared-functions.server";

export default async function evaluateGate(
  graphql: AdminGraphqlClient,
  { address, customerId, ...args }: EvaluateGateArgsSchema,
) {
  const existingCustomerAddress = await getCustomerWalletAddress({
    graphql,
    customerId,
  });
  if (!existingCustomerAddress) {
    return json({ message: "Customer address not found" }, { status: 404 });
  }
  const isAddressValidError = verifyCustomerAddress({
    address,
    existingCustomerAddress,
  });
  if (isAddressValidError) {
    return isAddressValidError;
  }
  const payload = await getVaultsPayload({
    address,
    customerId,
    ...args,
  });
  return json(payload, { status: 200 });
}
