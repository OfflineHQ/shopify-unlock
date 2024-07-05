import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";

type GetCustomersWithWalletAddressParams = {
  graphql: AdminGraphqlClient;
  cursor?: string;
};

export type CustomerWithWalletAddress = {
  id: string;
  email: string;
  walletAddress: string;
};

export async function getCustomersWithWalletAddress({
  graphql,
  cursor,
}: GetCustomersWithWalletAddressParams): Promise<{
  customers: CustomerWithWalletAddress[];
  hasNextPage: boolean;
  endCursor: string | null;
}> {
  const response = await graphql(
    `
      query GetCustomersWithWalletAddress(
        $cursor: String
        $namespace: String!
      ) {
        customers(first: 250, after: $cursor) {
          edges {
            node {
              id
              email
              metafield(namespace: $namespace, key: "wallet_address") {
                value
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    {
      variables: {
        cursor,
        namespace: NAMESPACE,
      },
    },
  );

  const result = await response.json();

  const customers = result?.data?.customers?.edges?.map(
    (edge: any): CustomerWithWalletAddress => ({
      id: edge.node.id,
      email: edge.node.email,
      walletAddress: edge.node.metafield?.value || "",
    }),
  );

  return {
    customers: customers || [],
    hasNextPage: result?.data?.customers?.pageInfo?.hasNextPage || false,
    endCursor: result?.data?.customers?.pageInfo?.endCursor || null,
  };
}
