import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import getAppI18nMetafield from "~/libs/app-metafields/get-app-i18n-metafield.server";
import setupAppNamespace from "~/libs/app-metafields/setup-app-namespace.server";
import type { ExclusiveFormDataType } from "~/libs/campaigns-exclusive/i18n-form";
import {
  ExclusiveTranslationForm,
  useExclusiveForm,
} from "~/libs/campaigns-exclusive/i18n-form";
import { setupI18nExclusiveDefaults } from "~/libs/campaigns-exclusive/setup-i18n-exclusive-default.server";
import { I18nMetafieldKey } from "~/libs/i18n/schema";
import { convertFromMetafieldValueToI18nForm } from "~/libs/i18n/utils";
import getShopLocales from "~/libs/shop/get-shop-locales.server";
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

  const exclusiveError = await getAppI18nMetafield(
    admin.graphql,
    I18nMetafieldKey.EXCLUSIVE_ERROR,
  );

  const i18nExclusiveErrorFields = convertFromMetafieldValueToI18nForm(
    I18nMetafieldKey.EXCLUSIVE_ERROR,
    exclusiveError,
    languages,
  );

  return json({
    appId,
    languages,
    i18nExclusiveErrorFields,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = (await request.json()) as {
    appId: string;
  } & ExclusiveFormDataType;
  const res = await setupI18nExclusiveDefaults({
    graphql: admin.graphql,
    ownerId: formData.appId,
    exclusiveErrorForm: formData.exclusiveError,
  });
  console.log("res", res);
  return json({
    status: "success",
  });
};

export default function Settings() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { languages, i18nExclusiveErrorFields, appId } =
    useLoaderData<typeof loader>();
  console.log("exclusiveError", i18nExclusiveErrorFields);
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";

  const [selected, setSelected] = useState(0);

  useEffect(() => {
    console.log(fetcher.data);
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved successfully");
      navigate("/app");
    }
  }, [fetcher.data]);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );
  const { fields, submit, reset, dirty } = useExclusiveForm(
    i18nExclusiveErrorFields,
    async (formData) => {
      console.log("Form submitted with data:", formData);
      fetcher.submit(
        { ...formData, appId },
        {
          method: "POST",
          encType: "application/json",
        },
      );
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
