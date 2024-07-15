import { PlateEditor } from "@/components/plate-ui/plate-editor";
import {
  Box,
  FormLayout,
  InlineError,
  Text,
  TextField,
} from "@shopify/polaris";

import ConnectModalUI from "@/components/connect-modal/connect-modal-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { canUseDOM, cn } from "@/lib/utils";
import { useList } from "@shopify/react-form";
import { type Value } from "@udecode/plate-common";
import { useCallback, useState } from "react";
import {
  I18nFieldsType,
  I18nMetafieldKey,
  I18nSignupContent,
} from "../i18n/schema";
import { I18nMetafieldForm } from "../i18n/types";
import Preview from "../preview/preview";

export interface SignUpFormFieldsType
  extends I18nFieldsType,
    I18nSignupContent {}

export type SignupFormDataType = {
  [I18nMetafieldKey.SIGNUP_CONTENT]: I18nMetafieldForm[I18nMetafieldKey.SIGNUP_CONTENT];
};

export function useSignupFormFields(initialFields: SignUpFormFieldsType[]) {
  const signUpFormFields = {
    [I18nMetafieldKey.SIGNUP_CONTENT]: useList({
      list: initialFields,
      validates: {
        signUpContent: (value) =>
          value.length <= 1 ? "Content is required" : undefined,
        signUpCTAText: (value) =>
          value.length === 0 ? "Call to Action Text is required" : undefined,
        cancelText: (value) =>
          value.length === 0 ? "Cancel Text is required" : undefined,
      },
    }),
  };
  return { signUpFormFields };
}

interface SignUpFormProps {
  language: { locale: string; primary: boolean };
  index: number;
  fields: ReturnType<typeof useSignupFormFields>["signUpFormFields"];
}

export function SignupFormModalPreview({
  language,
  index,
  fields,
}: SignUpFormProps) {
  if (!canUseDOM) return null;

  const [currentViewport, setCurrentViewport] = useState("mobile");

  const handleViewportChange = useCallback((viewport: string) => {
    setCurrentViewport(viewport);
  }, []);
  function CTA() {
    return (
      <Button variant="default" onClick={(event) => event.preventDefault()}>
        {fields[I18nMetafieldKey.SIGNUP_CONTENT][index].signUpCTAText.value}
      </Button>
    );
  }
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <ConnectModalUI
        content={
          fields[I18nMetafieldKey.SIGNUP_CONTENT][index].signUpContent
            .value as Value
        }
        modal={false}
        open={container !== null}
        container={container}
        cta={<CTA />}
        closeText={
          fields[I18nMetafieldKey.SIGNUP_CONTENT][index].cancelText.value
        }
        closeBtnClasses={buttonVariants({ variant: "secondary" })}
        isDesktop={currentViewport === "desktop"}
      />
      <Preview
        setContainer={setContainer}
        onViewportChange={handleViewportChange}
      >
        {/* fixing an issue where overlay not displayed for dialog */}
        <div
          className={cn(
            "offline-dialog-overlay offline-fixed offline-inset-0 offline-z-50 offline-bg-black/80 offline-data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 offline-w-full offline-h-full offline-overflow-hidden",
          )}
        />
      </Preview>
    </>
  );
}

export function SignUpForm({ language, index, fields }: SignUpFormProps) {
  return (
    <Box paddingBlockStart="400">
      <Text as="h3" variant="headingMd">
        Sign-up Modal Content
      </Text>
      <Box paddingBlockStart="200" paddingBlockEnd="400">
        <FormLayout>
          <Text as="p" variant="bodyMd">
            Edit sign-up modal content that will be displayed to customers
          </Text>
          <Box paddingBlockStart="200">
            <PlateEditor
              value={
                fields[I18nMetafieldKey.SIGNUP_CONTENT][index].signUpContent
                  .value as Value
              }
              onChange={(newValue) => {
                fields[I18nMetafieldKey.SIGNUP_CONTENT][
                  index
                ].signUpContent.onChange(newValue);
              }}
              className="offline-min-h-[18rem]"
            />
            <InlineError
              message={
                fields[I18nMetafieldKey.SIGNUP_CONTENT][index].signUpContent
                  .error as string
              }
              fieldID="signUpContent"
            />
          </Box>
          <TextField
            label="Call to Action Text"
            placeholder="Ex: Sign Up"
            {...fields[I18nMetafieldKey.SIGNUP_CONTENT][index].signUpCTAText}
            autoComplete="off"
          />
          <TextField
            label="Cancel Text"
            placeholder="Ex: Cancel"
            {...fields[I18nMetafieldKey.SIGNUP_CONTENT][index].cancelText}
            autoComplete="off"
          />
        </FormLayout>
      </Box>
    </Box>
  );
}
