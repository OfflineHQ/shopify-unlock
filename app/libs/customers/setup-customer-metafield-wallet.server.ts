import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";

type SetupCustomerMetafieldWalletParams = {
  graphql: AdminGraphqlClient;
  customerId: string;
  walletAddress: string;
};

export default async function updateCustomerMetafieldWallet({
  graphql,
  customerId,
  walletAddress,
}: SetupCustomerMetafieldWalletParams) {
  const response = await graphql(
    `
      #graphql
      mutation UpdateCustomerMetafield($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          id: `gid://shopify/Customer/${customerId}`,
          metafields: [
            {
              key: "wallet_address",
              value: walletAddress,
              type: "single_line_text_field",
              namespace: NAMESPACE,
            },
          ],
        },
      },
    },
  );

  const result = await response.json();

  if (
    result?.data?.customerUpdate?.userErrors &&
    result.data.customerUpdate.userErrors.length > 0
  ) {
    console.error(
      "Error updating customer metafield:",
      result.data.customerUpdate.userErrors,
    );
    throw new Error("Failed to update customer metafield with wallet address");
  }

  return result.data?.customerUpdate?.customer;
}
