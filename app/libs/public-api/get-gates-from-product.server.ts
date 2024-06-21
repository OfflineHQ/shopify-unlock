import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

export interface GetGatesFromProduct {
  graphql: AdminGraphqlClient;
  productGid: string;
  appNamespace: string;
}
