import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";

type GetCustomerWalletAddressParams = {
  graphql: AdminGraphqlClient;
  customerId: string;
};

export default async function getCustomerWalletAddress({
  graphql,
  customerId,
}: GetCustomerWalletAddressParams) {
  const response = await graphql(
    `
      #graphql
      query GetCustomerWalletAddress($customerId: ID!, $namespace: String!) {
        customer(id: $customerId) {
          metafield(namespace: $namespace, key: "wallet_address") {
            value
          }
        }
      }
    `,
    {
      variables: {
        customerId: `gid://shopify/Customer/${customerId}`,
        namespace: NAMESPACE,
      },
    },
  );

  const result = await response.json();

  return (result.data?.customer?.metafield?.value as string) || null;
}
