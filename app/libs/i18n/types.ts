import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { LanguageCode } from "~/types/admin.types";

// Form types

export interface I18nExclusiveError {
  noAccess: string;
  limitReached: string;
}

// Abstract types

export interface I18nFieldsType {
  locale: LanguageCode;
  published: boolean;
  primary: boolean;
}

export type I18nContentMap<T> = {
  [key in LanguageCode]: T;
};

export enum I18nMetafieldKey {
  EXCLUSIVE_ERROR = "exclusiveError",
}

export interface I18nMetafieldValues {
  [I18nMetafieldKey.EXCLUSIVE_ERROR]: I18nContentMap<I18nExclusiveError>;
}

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
