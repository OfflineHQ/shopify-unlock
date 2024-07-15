import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { NAMESPACE } from "../app-metafields/common";
import createAppMetafields from "../app-metafields/create-app-metafields.server";
import { I18nMetafieldKey } from "../i18n/schema";
import type { I18nMetafieldForm } from "../i18n/types";
import { convertFromI18nFormToMetafieldValue } from "../i18n/utils";

interface I18nExclusiveDefaults {
  graphql: AdminGraphqlClient;
  signupContentForm: I18nMetafieldForm[I18nMetafieldKey.SIGNUP_CONTENT];
  ownerId: string;
}

export async function setupI18nSignupContentDefaults({
  graphql,
  signupContentForm,
  ownerId,
}: I18nExclusiveDefaults) {
  const signupContent = await convertFromI18nFormToMetafieldValue(
    I18nMetafieldKey.SIGNUP_CONTENT,
    signupContentForm,
  );
  const res = await createAppMetafields(graphql, [
    {
      type: "json",
      namespace: NAMESPACE,
      key: I18nMetafieldKey.SIGNUP_CONTENT,
      value: JSON.stringify(signupContent),
      ownerId,
    },
  ]);

  return res;
}
