import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Box,
  Card,
  InlineStack,
  Layout,
  Page,
  PageActions,
  Tabs,
  Text,
} from "@shopify/polaris";
import { useForm } from "@shopify/react-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import getAppI18nMetafield from "~/libs/app-metafields/get-app-i18n-metafield.server";
import setupAppNamespace from "~/libs/app-metafields/setup-app-namespace.server";
import type { ExclusiveFormDataType } from "~/libs/campaigns-exclusive/i18n-form";
import {
  ExclusiveTranslationForm,
  useExclusiveFormFields,
} from "~/libs/campaigns-exclusive/i18n-form";
import { setupI18nExclusiveDefaults } from "~/libs/campaigns-exclusive/setup-i18n-exclusive-default.server";
import { I18nMetafieldKey } from "~/libs/i18n/schema";
import { convertFromMetafieldValueToI18nForm } from "~/libs/i18n/utils";
import getShopLocales from "~/libs/shop/get-shop-locales.server";
import { setupI18nSignupContentDefaults } from "~/libs/signup/setup-i18n-signup-content-default.server";
import {
  SignUpForm,
  SignupFormDataType,
  SignupFormModalPreview,
  useSignupFormFields,
} from "~/libs/signup/signup-form";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const { appId } = await setupAppNamespace(admin.graphql);

  const res = await getShopLocales(admin.graphql);
  if (!res) {
    throw new Error("No languages found");
  }
  const languages = res.sort(
    (a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0),
  );

  const [exclusiveError, signupContent] = await Promise.all([
    getAppI18nMetafield(admin.graphql, I18nMetafieldKey.EXCLUSIVE_ERROR),
    getAppI18nMetafield(admin.graphql, I18nMetafieldKey.SIGNUP_CONTENT),
  ]);

  const [i18nExclusiveErrorFields, i18nSignupContentFields] = await Promise.all(
    [
      convertFromMetafieldValueToI18nForm(
        I18nMetafieldKey.EXCLUSIVE_ERROR,
        exclusiveError,
        languages,
      ),
      convertFromMetafieldValueToI18nForm(
        I18nMetafieldKey.SIGNUP_CONTENT,
        signupContent,
        languages,
      ),
    ],
  );

  return json({
    appId,
    languages,
    i18nExclusiveErrorFields,
    i18nSignupContentFields,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = (await request.json()) as {
    appId: string;
  } & ExclusiveFormDataType &
    SignupFormDataType;
  await Promise.all([
    setupI18nExclusiveDefaults({
      graphql: admin.graphql,
      ownerId: formData.appId,
      exclusiveErrorForm: formData.exclusiveError,
    }),
    setupI18nSignupContentDefaults({
      graphql: admin.graphql,
      ownerId: formData.appId,
      signupContentForm: formData.signupContent,
    }),
  ]);
  console.log({ formData });
  return json({
    status: "success",
  });
};

export default function Settings() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const {
    languages,
    i18nExclusiveErrorFields,
    appId,
    i18nSignupContentFields,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";

  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved successfully");
      navigate("/app");
    }
  }, [fetcher.data]);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  const { signUpFormFields } = useSignupFormFields(i18nSignupContentFields);
  const { exclusiveFormFields } = useExclusiveFormFields(
    i18nExclusiveErrorFields,
  );
  const { fields, submit, reset, dirty } = useForm({
    fields: {
      ...exclusiveFormFields,
      ...signUpFormFields,
    },
    onSubmit: async (formData) => {
      fetcher.submit(
        { ...formData, appId },
        {
          method: "POST",
          encType: "application/json",
        },
      );
      return { status: "success" };
    },
  });

  const tabs = useMemo(
    () =>
      languages.map((language, index) => ({
        id: language.locale,
        primary: language.primary,
        content: (
          <Text as="h3" variant="headingMd">
            {language.primary ? `${language.name} (primary)` : language.name}
          </Text>
        ),
        accessibilityLabel: language.primary
          ? `${language.name} (primary)`
          : language.name,
        panelID: `${language.locale}-content`,
      })),
    [languages],
  );

  return (
    <Page
      backAction={{
        content: "Go back",
        accessibilityLabel: "Go back",
        url: "/app",
      }}
      title="Settings"
    >
      <Layout>
        <Layout.Section>
          <TooltipProvider
            disableHoverableContent
            delayDuration={500}
            skipDelayDuration={0}
          >
            <Form data-save-bar onSubmit={submit}>
              <Card>
                <Text as="h2" variant="headingLg">
                  Default Campaigns Content
                </Text>
                <Box paddingBlockStart="400" paddingBlockEnd="400">
                  <Text as="p" variant="bodyMd">
                    Define the default content for your campaigns with
                    translation for each language supported on your store.
                  </Text>
                </Box>
                <Tabs
                  tabs={tabs}
                  selected={selected}
                  onSelect={handleTabChange}
                >
                  <InlineStack gap="800">
                    <Box maxWidth="30rem">
                      <SignUpForm
                        language={languages[selected]}
                        index={selected}
                        fields={fields}
                      />
                    </Box>
                    <Box>
                      <SignupFormModalPreview
                        language={languages[selected]}
                        index={selected}
                        fields={fields}
                      />
                    </Box>
                  </InlineStack>
                  <ExclusiveTranslationForm
                    language={languages[selected]}
                    index={selected}
                    fields={fields}
                  />
                </Tabs>
              </Card>
              <PageActions
                primaryAction={{
                  content: "Save",
                  loading: isSubmitting,
                  disabled: isSubmitting,
                  onAction: submit,
                }}
                secondaryActions={[
                  {
                    content: "Reset",
                    disabled: isSubmitting || !dirty,
                    onAction: reset,
                  },
                ]}
              />
            </Form>
          </TooltipProvider>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
