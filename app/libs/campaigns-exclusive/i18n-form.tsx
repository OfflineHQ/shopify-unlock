import { Box, FormLayout, Text, TextField } from "@shopify/polaris";
import type { SubmitResult } from "@shopify/react-form";
import { notEmptyString, useForm, useList } from "@shopify/react-form";
import type { I18nExclusiveError, I18nFieldsType } from "~/libs/i18n/schema";
import { I18nMetafieldKey } from "~/libs/i18n/schema";
import type { I18nMetafieldForm } from "~/libs/i18n/types";

export interface ExclusiveErrorFieldsType
  extends I18nFieldsType,
    I18nExclusiveError {}

export type ExclusiveFormDataType = {
  [I18nMetafieldKey.EXCLUSIVE_ERROR]: I18nMetafieldForm[I18nMetafieldKey.EXCLUSIVE_ERROR];
};

export function useExclusiveForm(
  initialFields: ExclusiveErrorFieldsType[],
  onSubmit: (formData: ExclusiveFormDataType) => Promise<SubmitResult>,
) {
  const { fields, submit, reset, ...rest } = useForm({
    fields: {
      [I18nMetafieldKey.EXCLUSIVE_ERROR]: useList({
        list: initialFields,
        validates: {
          noAccess: notEmptyString("Required"),
          limitReached: [
            notEmptyString("Required"),
            (value) =>
              value.includes("{}")
                ? undefined
                : "{} is required to indicate the order limit",
          ],
        },
      }),
    },
    onSubmit,
  });

  return { fields, submit, reset, ...rest };
}

export function ExclusiveTranslationForm({
  language,
  index,
  fields,
}: {
  language: { locale: string; primary: boolean };
  index: number;
  fields: ReturnType<typeof useExclusiveForm>["fields"];
}) {
  return (
    <>
      <Box paddingBlockStart="400">
        <Text as="h3" variant="headingSm">
          Exclusive (Limited) Access Error Text
        </Text>
      </Box>
      <Box paddingBlock="200">
        <FormLayout>
          <TextField
            label="No Access"
            placeholder="Ex: You don't have access to this product"
            {...fields[I18nMetafieldKey.EXCLUSIVE_ERROR][index].noAccess}
            autoComplete="off"
          />
          <TextField
            label="Limit Reached"
            placeholder="Ex: You have reached the limit of {} by order"
            {...fields[I18nMetafieldKey.EXCLUSIVE_ERROR][index].limitReached}
            autoComplete="off"
          />
        </FormLayout>
      </Box>
    </>
  );
}
