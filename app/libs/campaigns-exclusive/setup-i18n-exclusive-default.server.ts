import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";
import createAppMetafields from "../app-metafields/create-app-metafields.server";
import { I18nMetafieldKey } from "../i18n/schema";
import type { I18nMetafieldForm } from "../i18n/types";
import { convertFromI18nFormToMetafieldValue } from "../i18n/utils";

interface I18nExclusiveDefaults {
  graphql: AdminGraphqlClient;
  exclusiveErrorForm: I18nMetafieldForm[I18nMetafieldKey.EXCLUSIVE_ERROR];
  ownerId: string;
}

export async function setupI18nExclusiveDefaults({
  graphql,
  exclusiveErrorForm,
  ownerId,
}: I18nExclusiveDefaults) {
  const exclusiveError = await convertFromI18nFormToMetafieldValue(
    I18nMetafieldKey.EXCLUSIVE_ERROR,
    exclusiveErrorForm,
  );
  const res = await createAppMetafields(graphql, [
    {
      type: "json",
      namespace: NAMESPACE,
      key: I18nMetafieldKey.EXCLUSIVE_ERROR,
      value: JSON.stringify(exclusiveError),
      ownerId,
    },
  ]);

  return res;
}
