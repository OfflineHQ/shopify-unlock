import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { MetafieldsSetInput } from "~/types/admin.types";

const UPDATE_APP_NAMESPACE_METAFIELDS = `#graphql
mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafieldsSetInput) {
    metafields {
      key
      value
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default async function createAppMetafields(
  graphql: AdminGraphqlClient,
  metafieldsSetInput: MetafieldsSetInput[],
) {
  const res = await graphql(UPDATE_APP_NAMESPACE_METAFIELDS, {
    variables: {
      metafieldsSetInput,
    },
  });

  const resJson = await res.json();
  return resJson.data?.metafieldsSet;
}
