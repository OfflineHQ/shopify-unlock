import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  ChoiceList,
  Divider,
  FormLayout,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
} from "@shopify/polaris";
import { useField, useForm } from "@shopify/react-form";
import { useCallback, useEffect, useState } from "react";
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
  const campaignType = useField("open");
  const redemptionLimit = useField("no_limit");
  const orderLimit = useField(
    {
      value: 0,
      validates: [
        (orderLimit) => {
          if (redemptionLimit.value === "set_limit" && !orderLimit) {
            return "Order limit cannot be empty";
          }
        },
        (orderLimit) => {
          if (orderLimit && !(orderLimit > 0)) {
            return "Order limit cannot be negative";
          }
        },
      ],
    },
    [redemptionLimit.value],
  );

  const fieldsDefinition = {
    name: useField({
      value: "",
      validates: (name) => (!name && "Name cannot be empty") || undefined,
    }),
    campaignType,
    redemptionLimit,
    discountType,
    discount: useField(
      {
        value: 0,
        validates: [
          (discount) => {
            if (perkType.value === "discount" && !discount) {
              return "Discount cannot be empty";
            }
          },
          (discount) => {
            if (discount && !(discount > 0)) {
              return "Discount cannot be negative";
            }
          },
          (discount) => {
            if (discountType.value === "percentage" && !(discount <= 100)) {
              return "Discount cannot be greater than 100%";
            }
          },
        ],
      },
      [perkType.value, discountType.value],
    ),
    products: useField({
      value: [],
      validates: (products) =>
        (products.length === 0 && "Products cannot be empty") || undefined,
    }),
    perkType,
    orderLimit,
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

  const renderOrderLimit = useCallback(
    (isSelected: boolean) =>
      isSelected && (
        <TextField
          label="Order Limit"
          labelHidden
          autoComplete="off"
          type="number"
          {...fields.orderLimit}
        />
      ),
    [fields.orderLimit],
  );

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
            <BlockStack gap="500">
              <Card roundedAbove="sm">
                <Text as="h2" variant="headingLg">
                  Campaign Settings
                </Text>
                <Box paddingBlockStart="200" paddingBlockEnd="400">
                  <Text as="p" variant="bodyLg" tone="subdued">
                    Define the type of campaign you want.
                  </Text>
                </Box>
                <FormLayout>
                  <Divider />
                  <TextField
                    name="name"
                    label="Campaign Name"
                    helpText="This name will be used to identify your campaign on the dashboard (not displayed to customers)"
                    placeholder="Ex: Summer Sale"
                    type="text"
                    {...fields.name}
                    autoComplete="off"
                  />
                  <ChoiceList
                    title="Campaign Type"
                    choices={[
                      {
                        label: "Open (any customer)",
                        value: "open",
                        helpText:
                          "Any customer can join the campaign and access the defined perks",
                      },
                      {
                        label: "Targeted (specific customers)",
                        value: "targeted",
                        disabled: true,
                        helpText:
                          "Only customers segment imported from your CRM will be able to access those perks",
                      },
                      {
                        label: "Tiered (multi-level)",
                        value: "tiered",
                        disabled: true,
                        helpText:
                          "Define a set of perks attached to customer segments or open to any customers. Useful if you want to personalize your campaign to a specific audience",
                      },
                    ]}
                    selected={[fields.campaignType.value]}
                    onChange={(value) => {
                      console.log(value[0]);
                      fields.campaignType.onChange(value[0]);
                    }}
                  />
                </FormLayout>
              </Card>
              <Card roundedAbove="sm">
                <Text as="h2" variant="headingLg">
                  Define your perks
                </Text>
                <Box paddingBlockStart="200" paddingBlockEnd="400">
                  <Text as="p" variant="bodyLg" tone="subdued">
                    Define the type of perks for your campaign assigned to your
                    products or collections.
                  </Text>
                </Box>
                <FormLayout>
                  <Divider />
                  <ChoiceList
                    title="Perk Type"
                    choices={[
                      { label: "Product discount", value: "discount" },
                      {
                        label: "Exclusive (limited) access to product",
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
                          { label: "Fixed amount", value: "amount" },
                        ]}
                        selected={[fields.discountType.value]}
                        onChange={(value) =>
                          fields.discountType.onChange(value[0])
                        }
                      />
                      <TextField
                        label="Discount"
                        type="number"
                        suffix={
                          fields.discountType.value === "percentage" ? "%" : "€"
                        }
                        {...fields.discount}
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                  )}

                  <ChoiceList
                    title="Campaign Redemption Limit"
                    choices={[
                      {
                        label: "No Limit",
                        value: "no_limit",
                        helpText:
                          "Customers can redeem this offer an unlimited number of times as long as the campaign is active.",
                      },
                      {
                        label: "Set Limit",
                        value: "set_limit",
                        helpText:
                          "Limit the number of times each customer can redeem their offer. This is applicable for both product discounts or exclusive access while the campaign is active.",
                        renderChildren: renderOrderLimit,
                      },
                    ]}
                    selected={[fields.redemptionLimit.value]}
                    onChange={(value) => {
                      console.log(value[0]);
                      fields.redemptionLimit.onChange(value[0]);
                    }}
                  />
                  {/* <TokengatesResourcePicker products={fields.products} /> */}
                  <Card roundedAbove="sm" background="bg-surface-secondary">
                    <Text as="h3" variant="headingLg">
                      Target Products or Collections
                    </Text>
                    <Box paddingBlockStart="200" paddingBlockEnd="400">
                      <Text as="p" variant="bodyLg" tone="subdued">
                        Select the products or collections that will be targeted
                        for those perks in your campaign.
                        <br />
                        <br />
                        Please note that you cannot have the same product or
                        collection selected twice in the same campaign.
                      </Text>
                    </Box>
                    <Divider />
                    <Box paddingBlockStart="400" paddingBlockEnd="400">
                      <TargetProductsOrCollections products={fields.products} />
                    </Box>
                  </Card>
                </FormLayout>
              </Card>
            </BlockStack>
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
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
