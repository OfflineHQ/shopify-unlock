import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { LanguageCode, ShopLocale } from "~/types/admin.types";
import type {
  I18nExclusiveError,
  I18nExclusiveText,
  I18nFieldsType,
  I18nMetafieldKey,
} from "./schema";

export type Languages = Pick<ShopLocale, "primary" | "locale" | "published">;

// [{"locale":"EN","noAccess":"asfgasf","limitReached":"{}","published":true,"primary" :true},{"locale":"DE","noAccess":"asfasgasg","limitReached":"{}","published":false,"primary":false},{"locale":"FR","noAccess":"adgsg","l imitReached":"{}","published":true,"primary":false}]

// Abstract types

export interface I18nMetafieldValues {
  [I18nMetafieldKey.EXCLUSIVE_ERROR]: I18nContentMap<I18nExclusiveError>;
  [I18nMetafieldKey.EXCLUSIVE_TEXT]: I18nContentMap<I18nExclusiveText>;
}

export interface I18nMetafieldForm {
  [I18nMetafieldKey.EXCLUSIVE_ERROR]: (I18nFieldsType & I18nExclusiveError)[];
  [I18nMetafieldKey.EXCLUSIVE_TEXT]: (I18nFieldsType & I18nExclusiveText)[];
}

export type I18nContentMap<T> = {
  [key in LanguageCode]?: T;
};

export interface I18nContentMetaFields<K extends I18nMetafieldKey> {
  key: K;
  content: I18nContentMap<I18nMetafieldValues[K]>;
}

export interface I18nGetMetafieldsQueryArgs
  extends Pick<I18nContentMetafieldsQueryArgs<I18nMetafieldKey>, "graphql"> {
  categories: I18nMetafieldKey[];
}

export interface I18nContentMetafieldsQueryArgs<K extends I18nMetafieldKey> {
  graphql: AdminGraphqlClient;
  ownerId: string;
  i18nContents: I18nContentMetaFields<K>[];
}
