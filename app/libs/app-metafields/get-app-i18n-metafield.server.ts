import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { I18nMetafieldKey } from "../i18n/schema";
import type { I18nMetafieldValues } from "../i18n/types";
import { NAMESPACE } from "./common";

export default async function getAppI18nMetafield<K extends I18nMetafieldKey>(
  graphql: AdminGraphqlClient,
  key: K,
) {
  const res = await graphql(
    `
      #graphql
      query GetAppMetafield($namespace: String!, $key: String!) {
        currentAppInstallation {
          metafield(namespace: $namespace, key: $key) {
            value
          }
        }
      }
    `,
    {
      variables: {
        namespace: NAMESPACE,
        key,
      },
    },
  );
  const resJson = await res.json();
  const value = resJson.data?.currentAppInstallation?.metafield?.value;
  if (!value) {
    return null;
  }

  return JSON.parse(value) as I18nMetafieldValues[K];
}
