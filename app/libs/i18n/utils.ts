import type { LanguageCode } from "~/types/admin.types";
import type { I18nMetafieldKey } from "./schema";
import { i18nMetafieldFormSchema, i18nMetafieldValueSchema } from "./schema";
import type {
  I18nMetafieldForm,
  I18nMetafieldValues,
  Languages,
} from "./types";

export async function convertFromI18nFormToMetafieldValue<
  K extends I18nMetafieldKey,
>(key: K, i18nMetafieldForm: I18nMetafieldForm[K]) {
  await i18nMetafieldFormSchema(key).parseAsync(i18nMetafieldForm); // Validate the input using Zod

  let metafieldValue: I18nMetafieldValues[K] = {};
  for (const item of i18nMetafieldForm) {
    const { locale, published, primary, ...rest } = item;
    metafieldValue[locale] = rest as any;
  }
  await i18nMetafieldValueSchema(key).parseAsync(metafieldValue); // Validate the output using Zod
  return metafieldValue;
}

export async function convertFromMetafieldValueToI18nForm<
  K extends I18nMetafieldKey,
>(
  key: K,
  metafieldValue: I18nMetafieldValues[K] | null,
  languages: Languages[],
) {
  const promises = languages.map(async (language) => {
    const locale = language.locale.toUpperCase() as LanguageCode;
    const { published, primary } = language;
    const translations = await i18nMetafieldValueSchema(key).parseAsync(
      metafieldValue?.[locale] || {},
    );
    return {
      locale,
      published,
      primary,
      ...translations,
    };
  });

  return Promise.all(promises) as Promise<I18nMetafieldForm[K]>;
}
