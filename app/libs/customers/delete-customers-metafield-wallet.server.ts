import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";

type DeleteWalletAddressesParams = {
  graphql: AdminGraphqlClient;
  customerIds: string[];
};

export async function deleteWalletAddresses({
  graphql,
  customerIds,
}: DeleteWalletAddressesParams): Promise<void> {
  const metafields = customerIds.map((customerId) => ({
    ownerId: customerId,
    namespace: NAMESPACE,
    key: "wallet_address",
  }));

  const response = await graphql(
    `
      #graphql
      mutation DeleteCustomerWalletAddresses(
        $metafields: [MetafieldIdentifierInput!]!
      ) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            ownerId
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
        metafields,
      },
    },
  );

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));

  const userErrors = data.data?.metafieldsDelete?.userErrors;

  if (userErrors && userErrors.length > 0) {
    console.error("User errors:", userErrors);
    throw new Error(userErrors[0].message);
  }

  console.log(
    "Deleted metafield IDs:",
    data.data?.metafieldsDelete?.deletedMetafields,
  );
}
