import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Box,
  Button,
  Card,
  Divider,
  Layout,
  Page,
  PageActions,
  Tabs,
  Text,
} from "@shopify/polaris";
import { useCallback, useMemo, useState } from "react";
import getAppI18nMetafield from "~/libs/app-metafields/get-app-i18n-metafield.server";
import type { ExclusiveErrorFieldsType } from "~/libs/campaigns-exclusive/i18n-form";
import {
  ExclusiveTranslationForm,
  useExclusiveForm,
} from "~/libs/campaigns-exclusive/i18n-form";
import { I18nMetafieldKey } from "~/libs/i18n/types";
import getShopLocales from "~/libs/shop/get-shop-locales.server";
import { authenticate } from "~/shopify.server";
import type { LanguageCode } from "~/types/admin.types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const res = await getShopLocales(admin.graphql);
  if (!res) {
    return json({
      languages: [],
      exclusiveError: null,
    });
  }
  const languages = res.sort(
    (a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0),
  );

  const exclusiveError = await getAppI18nMetafield(
    admin.graphql,
    I18nMetafieldKey.EXCLUSIVE_ERROR,
  );

  return json({
    languages,
    exclusiveError,
  });
};

export default function Settings() {
  const { languages, exclusiveError } = useLoaderData<typeof loader>();
  console.log("exclusiveError", exclusiveError);
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  const i18nExclusiveErrorFields: ExclusiveErrorFieldsType[] = languages.map(
    (language) => ({
      locale: language.locale.toUpperCase() as LanguageCode,
      noAccess: "",
      limitReached: "",
      published: language.published,
      primary: language.primary,
    }),
  );

  const { fields, submit, reset, dirty } = useExclusiveForm(
    i18nExclusiveErrorFields,
    async (formData) => {
      console.log("Form submitted with data:", formData);
      return { status: "success" };
    },
  );

  const tabs = useMemo(
    () =>
      languages.map((language, index) => ({
        id: language.locale,
        primary: language.primary,
        content: (
          <Text as="h3" variant="headingMd">
            {language.primary
              ? `${language.locale} (primary)`
              : language.locale}
          </Text>
        ),
        accessibilityLabel: language.primary
          ? `${language.locale} (primary)`
          : language.locale,
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
          <Form data-save-bar onSubmit={submit}>
            <Card roundedAbove="sm">
              <Text as="h2" variant="headingLg">
                Default Campaigns Text
              </Text>
              <Box paddingBlockStart="200">
                <Text as="p" variant="bodyLg" tone="subdued">
                  Define the default text for your campaigns with translation
                  for each language supported on your store.
                </Text>
              </Box>
              <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
                <Divider />
                <ExclusiveTranslationForm
                  language={languages[selected]}
                  index={selected}
                  fields={fields}
                />
                {/* <TextField
                          label="Store name"
                          {...fields[selectedLanguage.id].name}
                          autoComplete="off"
                        />
                        <TextField
                          label="Store description"
                          {...fields[selectedLanguage.id].description}
                          autoComplete="off"
                          multiline={4}
                        /> */}
                {/* Add more form fields */}
              </Tabs>
            </Card>
            <PageActions
              primaryAction={
                <Button
                  variant="primary"
                  submit
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Save
                </Button>
              }
              secondaryActions={[
                {
                  content: "Reset",
                  onAction: reset,
                  disabled: isSubmitting || !dirty,
                },
              ]}
            />
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
