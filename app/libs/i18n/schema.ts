import { z } from "zod";
import { LanguageCode } from "~/types/admin.types.d";

export enum I18nMetafieldKey {
  EXCLUSIVE_ERROR = "exclusiveError",
  EXCLUSIVE_TEXT = "exclusiveText",
  SIGNUP_CONTENT = "signupContent",
}

// Zod schemas for metafield values

const i18nExclusiveErrorSchema = z.object({
  noAccess: z.string().default(""),
  limitReached: z.string().default(""),
});

const i18nExclusiveTextSchema = z.object({
  name: z.string().default(""),
});

const i18nSignupContentSchema = z.object({
  signUpContent: z
    .array(
      z
        .object({
          type: z.string(),
          children: z.array(z.object({}).passthrough()),
        })
        .passthrough(),
    )
    .default([
      {
        children: [{ text: "" }],
        type: "img",
        url: "https://cdn-icons-png.flaticon.com/128/838/838680.png",
        id: "t29ar",
        width: 92,
        align: "center",
      },
      { children: [{ text: "Sign up to our club" }], type: "h3", id: "r6jpn" },
      { children: [{ text: "" }], type: "p", id: "zhl32" },
      {
        children: [
          {
            text: "Get exclusive discount and access to products tailored for ",
          },
          { text: "you", underline: true },
        ],
        type: "p",
        id: "0psqt",
      },
      { children: [{ text: "" }], type: "p", id: "dsxn3" },
    ]),
  signUpCTAText: z.string().default("Sign Up"),
  cancelText: z.string().default("Cancel"),
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
    [I18nMetafieldKey.SIGNUP_CONTENT]: z.array(
      i18nFieldsTypeSchema.extend(i18nSignupContentSchema.shape),
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
    [I18nMetafieldKey.SIGNUP_CONTENT]: i18nSignupContentSchema,
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

export type I18nSignupContent = z.infer<typeof i18nSignupContentSchema>;
