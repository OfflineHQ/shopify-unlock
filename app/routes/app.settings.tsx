import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Box,
  Button,
  Card,
  FormLayout,
  Layout,
  Page,
  PageActions,
  Tabs,
  Text,
  TextField
} from "@shopify/polaris";
import { useForm, useList } from "@shopify/react-form";
import { useCallback, useState } from "react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        shopLocales {
          locale
          primary
          published
        }
      }
    `,
  );

  const responseJson = await response.json();
  const languages = responseJson.data.shopLocales;

  return json({
    languages,
    primaryLanguage: languages.find((language) => language.primary),
  });
};

export default function Settings() {
  const { languages } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const fieldsDefinition = languages.map((language) => ({
    key: language.locale,
    name: "",
    description: "",
  }));
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );

  const { fields, submit, reset } = useForm({
    fields: {
      translations: useList({
        list: fieldsDefinition,
        validates: {
          name: (name) => (!name && `Name cannot be empty`) || undefined,
          description: (description) =>
            (!description && `Description cannot be empty`) || undefined,
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

  function translationForm(
    language: (typeof languages)[number],
    index: number,
  ) {
    return (
      <>
        <TextField
          label="Store name"
          {...fields.translations[index].name}
          autoComplete="off"
        />
        <TextField
          label="Store description"
          {...fields.translations[index].description}
          autoComplete="off"
          multiline={4}
        />
      </>
    );
  }

  const tabs = languages.map((language, index) => ({
    id: language.locale,
    primary: language.primary,
    content: language.locale,
    accessibilityLabel: language.primary
      ? `${language.locale} (Primary)`
      : language.locale,
    panelID: `${language.locale}-content`,
  }));

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
            <Card>
              <Text as="h2" variant="headingMd">
                Translations
              </Text>
              <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
                <Box paddingBlockStart="200">
                  <FormLayout key={selected}>
                    {translationForm(languages[selected], selected)}
                  </FormLayout>
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
                  </Box>
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
              />            </Card>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
