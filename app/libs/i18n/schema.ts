import { z } from "zod";
import { LanguageCode } from "~/types/admin.types.d";

export enum I18nMetafieldKey {
  EXCLUSIVE_ERROR = "exclusiveError",
  EXCLUSIVE_TEXT = "exclusiveText",
}

// Zod schemas for metafield values

const i18nExclusiveErrorSchema = z.object({
  noAccess: z.string().default(""),
  limitReached: z.string().default(""),
});

const i18nExclusiveTextSchema = z.object({
  name: z.string().default(""),
});

// Zod schemas

const languageCodeSchema = z.nativeEnum(LanguageCode);

const i18nFieldsTypeSchema = z.object({
  locale: languageCodeSchema,
  published: z.boolean(),
  primary: z.boolean(),
});

export const i18nMetafieldFormSchema = <K extends I18nMetafieldKey>(key: K) => {
  const valueSchemas = {
    [I18nMetafieldKey.EXCLUSIVE_ERROR]: z.array(
      i18nFieldsTypeSchema.extend(i18nExclusiveErrorSchema.shape),
    ),
    [I18nMetafieldKey.EXCLUSIVE_TEXT]: z.array(
      i18nFieldsTypeSchema.extend(i18nExclusiveTextSchema.shape),
    ),
  } as const;

  return valueSchemas[key] || z.unknown();
};

const i18nContentMapSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.record(languageCodeSchema, valueSchema);

export const i18nMetafieldValueSchema = <K extends I18nMetafieldKey>(
  key: K,
) => {
  const valueSchemas = {
    [I18nMetafieldKey.EXCLUSIVE_ERROR]: i18nExclusiveErrorSchema,
    [I18nMetafieldKey.EXCLUSIVE_TEXT]: i18nExclusiveTextSchema,
  } as const;

  return valueSchemas[key] || z.unknown();
};

export const i18nContentMetaFieldsSchema = <K extends I18nMetafieldKey>(
  key: K,
) =>
  z.object({
    key: z.literal(key),
    content: i18nContentMapSchema(i18nMetafieldValueSchema(key)),
  });

// Zod types

export type I18nFieldsType = z.infer<typeof i18nFieldsTypeSchema>;

export type I18nExclusiveError = z.infer<typeof i18nExclusiveErrorSchema>;

export type I18nExclusiveText = z.infer<typeof i18nExclusiveTextSchema>;
