import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Button,
  ChoiceList,
  FormLayout,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
} from "@shopify/polaris";
import { useField, useForm } from "@shopify/react-form";
import { useEffect, useState } from "react";
import setupAppNamespace from "~/libs/app-metafields/setup-app-namespace.server";
import { TargetProductsOrCollections } from "~/libs/campaigns-product-collection/TargetProductsOrCollections";
import { authenticate } from "~/shopify.server";
// import { TokengatesResourcePicker } from "../components/TokengatesResourcePicker";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { appNamespace } = await setupAppNamespace(admin.graphql);
  return { appNamespace };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.json();
  console.log({ formData });
  return json({
    status: "success",
  });
};

export default function CreateTokengate() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";
  useEffect(() => {
    console.log(fetcher.data);
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Campaign created successfully");
      navigate("/app");
    }
  }, [fetcher.data]);
  const [exclusive, sei18nExclusiveError] = useState(false);

  const perkType = useField("discount");
  const discountType = useField("percentage");

  const fieldsDefinition = {
    name: useField({
      value: "",
      validates: (name) => (!name && "Name cannot be empty") || undefined,
    }),
    discountType,
    discount: useField(
      {
        value: 0,
        validates: (discount) => {
          if ((perkType.value === "discount" && !discount) || !(discount > 0)) {
            return "Discount cannot be empty";
          }
        },
      },
      [perkType.value],
    ),
    products: useField({
      value: [],
      validates: (products) =>
        (products.length === 0 && "Products cannot be empty") || undefined,
    }),
    perkType,
    orderLimit: useField(
      {
        value: 0,
        validates: (orderLimit) => {
          if (
            (perkType.value === "exclusive_access" && !orderLimit) ||
            !(orderLimit > 0)
          ) {
            return "Order limit cannot be empty";
          }
        },
      },
      [perkType.value],
    ),
  };

  const { fields, submit, reset, dirty } = useForm({
    fields: fieldsDefinition,
    onSubmit: async (formData) => {
      console.log("Form submitted with data:", formData);
      fetcher.submit(formData, {
        method: "POST",
        encType: "application/json",
      });
      return { status: "success" };
    },
  });

  return (
    <Page
      backAction={{
        content: "Go back",
        accessibilityLabel: "Go back",
        url: "/app",
      }}
      title="Create a new Campaign"
    >
      <Layout>
        <Layout.Section>
          <Form data-save-bar onSubmit={submit}>
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Configuration
              </Text>
              <TextField
                name="name"
                label="Name"
                type="text"
                {...fields.name}
                autoComplete="off"
              />
              <ChoiceList
                title="Perk Type"
                choices={[
                  { label: "Discount", value: "discount" },
                  {
                    label: "Exclusive Access",
                    value: "exclusive_access",
                  },
                ]}
                selected={[fields.perkType.value]}
                onChange={(value) => {
                  console.log(value[0]);
                  fields.perkType.onChange(value[0]);
                  sei18nExclusiveError(!exclusive);
                }}
              />
              {fields.perkType.value === "discount" && (
                <FormLayout.Group>
                  <ChoiceList
                    title="Discount Type"
                    choices={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Amount", value: "amount" },
                    ]}
                    selected={[fields.discountType.value]}
                    onChange={(value) => fields.discountType.onChange(value[0])}
                  />
                  <TextField
                    label="Discount"
                    type="number"
                    {...fields.discount}
                    autoComplete="off"
                  />
                </FormLayout.Group>
              )}
              {fields.perkType.value === "exclusive_access" && (
                <TextField
                  label="Order Limit"
                  type="number"
                  {...fields.orderLimit}
                  autoComplete="off"
                />
              )}

              {/* <TokengatesResourcePicker products={fields.products} /> */}
              <TargetProductsOrCollections products={fields.products} />
              <PageActions
                primaryAction={
                  <Button
                    variant="primary"
                    submit
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Create Campaign
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
            </FormLayout>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
