import type { LanguageCode } from "~/types/admin.types";
import type { I18nMetafieldKey } from "./schema";
import { i18nMetafieldFormSchema, i18nMetafieldValueSchema } from "./schema";
import type {
  I18nMetafieldForm,
  I18nMetafieldValues,
  Languages,
} from "./types";

export function convertFromI18nFormToMetafieldValue<K extends I18nMetafieldKey>(
  key: K,
  i18nMetafieldForm: I18nMetafieldForm[K],
) {
  i18nMetafieldFormSchema(key).parse(i18nMetafieldForm); // Validate the input using Zod

  let metafieldValue: I18nMetafieldValues[K] = {};
  for (const item of i18nMetafieldForm) {
    const { locale, published, primary, ...rest } = item;
    metafieldValue[locale] = rest as any;
  }
  i18nMetafieldValueSchema(key).parse(metafieldValue); // Validate the output using Zod
  return metafieldValue;
}

export function convertFromMetafieldValueToI18nForm<K extends I18nMetafieldKey>(
  key: K,
  metafieldValue: I18nMetafieldValues[K] | null,
  languages: Languages[],
) {
  return languages.map((language) => {
    const locale = language.locale.toUpperCase() as LanguageCode;
    const { published, primary } = language;
    const translations = i18nMetafieldValueSchema(key).parse(
      metafieldValue?.[locale] || {},
    );
    return {
      locale,
      published,
      primary,
      ...translations,
    };
  }) as I18nMetafieldForm[K];
}
