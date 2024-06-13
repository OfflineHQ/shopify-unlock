import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { I18nMetafieldKey, I18nMetafieldValues } from "~/libs/i18n/types";
import { NAMESPACE } from "./common";

export default async function getAppI18nMetafield(
  graphql: AdminGraphqlClient,
  key: I18nMetafieldKey,
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
  return JSON.parse(value) as I18nMetafieldValues[I18nMetafieldKey];
}
