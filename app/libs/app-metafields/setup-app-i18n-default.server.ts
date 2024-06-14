import type { I18nMetafieldKey } from "~/libs/i18n/schema";
import type {
  I18nContentMap,
  I18nContentMetafieldsQueryArgs,
  I18nMetafieldValues,
} from "~/libs/i18n/types";
import { NAMESPACE } from "./common";
import createAppMetafields from "./create-app-metafields.server";

export async function setupAppI18nDefaults<K extends I18nMetafieldKey>({
  graphql,
  ownerId,
  i18nContents,
}: I18nContentMetafieldsQueryArgs<K>) {
  const res = await createAppMetafields(
    graphql,
    i18nContents.map(({ key, content }) => ({
      type: "json",
      namespace: NAMESPACE,
      key,
      value: JSON.stringify(content),
      ownerId,
    })),
  );
  if (!res || !res.metafields || res.userErrors?.length > 0) {
    throw new Error("Failed to create app metafields");
  }
  if (res.userErrors?.length > 0) {
    throw new Error(res.userErrors.map(({ message }) => message).join("\n"));
  }
  let metafields = res.metafields.map(({ key, value }) => ({
    key: key as K,
    value: JSON.parse(value) as I18nContentMap<I18nMetafieldValues[K]>,
  }));

  return metafields;
}
