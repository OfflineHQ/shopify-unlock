import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Box,
  Button,
  Card,
  Divider,
  FormLayout,
  Layout,
  Page,
  PageActions,
  Tabs,
  Text,
  TextField,
} from "@shopify/polaris";
import { notEmptyString, useForm, useList } from "@shopify/react-form";
import { useCallback, useMemo, useState } from "react";
import getShopLocales from "~/libs/shop/get-shop-locales.server";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const res = await getShopLocales(admin.graphql);
  if (!res) {
    return json({
      languages: [],
    });
  }
  const languages = res.sort(
    (a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0),
  );

  return json({
    languages,
  });
};

export default function Settings() {
  const { languages } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  const tExclusiveFields = languages.map((language) => ({
    key: language.locale,
    noAccess: "",
    limitReached: "",
    published: language.published,
  }));

  const { fields, submit, reset } = useForm({
    fields: {
      tExclusive: useList({
        list: tExclusiveFields,
        validates: {
          noAccess: notEmptyString("Required"),
          limitReached: notEmptyString("Required"),
        },
      }),
    },
    onSubmit: async (formData) => {
      console.log("Form submitted with data:", formData);
      fetcher.submit(formData, {
        method: "POST",
        encType: "application/json",
      });
      return { status: "success" };
    },
  });

  function translationForms(
    language: (typeof languages)[number],
    index: number,
  ) {
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
              label="No access"
              {...fields.tExclusive[index].noAccess}
              autoComplete="off"
            />
            <TextField
              label="Store description"
              {...fields.tExclusive[index].limitReached}
              autoComplete="off"
            />
          </FormLayout>
        </Box>
      </>
    );
  }

  const tabs = useMemo(
    () =>
      languages.map((language, index) => ({
        id: language.locale,
        primary: language.primary,
        content: (
          <Text as="h3" variant="headingMd">
            {language.locale}
          </Text>
        ),
        accessibilityLabel: language.primary
          ? `${language.locale} (Primary)`
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
                Default Campaigns Translations
              </Text>
              <Box paddingBlockStart="200">
                <Text as="p" variant="bodyMd">
                  Define the default translations for your campaigns.
                </Text>
              </Box>
              <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
                <Divider />
                {translationForms(languages[selected], selected)}
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
              <PageActions
                primaryAction={
                  <Button
                    variant="primary"
                    submit
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Save Settings
                  </Button>
                }
                secondaryActions={[
                  {
                    content: "Cancel",
                    onAction: reset,
                  },
                ]}
              />
            </Card>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
