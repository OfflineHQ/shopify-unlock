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
import {
  CampaignTypeEnum,
  DiscountTypeEnum,
  PerkTypeEnum,
  RedemptionLimitEnum,
  campaignFormSchema,
  type CampaignFormData,
  type campaignTypeEnum,
  type discountTypeEnum,
  type perkTypeEnum,
  type redemptionLimitEnum,
} from "~/libs/campaigns/schema";
import setupCampaign from "~/libs/campaigns/setup-campaign.server";
import { authenticate } from "~/shopify.server";
import type { Collection, Product } from "~/types/admin.types";
// import { TokengatesResourcePicker } from "../components/TokengatesResourcePicker";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { appNamespace } = await setupAppNamespace(admin.graphql);
  return { appNamespace };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = (await request.json()) as CampaignFormData & {
    appNamespace: string;
    collections: Collection[];
    products: Product[];
    orderLimit: string;
    discount: string;
  };
  const { appNamespace, products, collections, orderLimit, discount, ...form } =
    formData;
  const campaignForm = {
    ...form,
    orderLimit: orderLimit ? parseInt(orderLimit) : undefined,
    discount: discount ? parseFloat(discount) : undefined,
    products: products.map((product) => product.id),
  };
  campaignFormSchema.parse(campaignForm);
  console.log({ campaignForm, appNamespace });
  const { admin } = await authenticate.admin(request);
  await setupCampaign({
    graphql: admin.graphql,
    campaignForm,
    appNamespace,
  });
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

  const campaignType = useField<(typeof campaignTypeEnum)[number]>(
    CampaignTypeEnum.Open,
  );
  const perkType = useField<(typeof perkTypeEnum)[number]>(
    PerkTypeEnum.Discount,
  );
  const discountType = useField<(typeof discountTypeEnum)[number]>(
    DiscountTypeEnum.Percentage,
  );
  const redemptionLimit = useField<(typeof redemptionLimitEnum)[number]>(
    RedemptionLimitEnum.NoLimit,
  );
  const orderLimit = useField(
    {
      value: "",
      validates: [
        (orderLimit) => {
          if (redemptionLimit.value === "set_limit" && !orderLimit) {
            return "Order limit cannot be empty";
          }
        },
        (orderLimit) => {
          if (orderLimit && !(parseInt(orderLimit) > 0)) {
            return "Order limit cannot be negative";
          }
        },
      ],
    },
    [redemptionLimit.value],
  );

  const [isProductSelection, setIsProductSelection] = useState<boolean | null>(
    null,
  );

  const products = useField(
    {
      value: [],
      validates: (products) =>
        ((!!isProductSelection || isProductSelection === null) &&
          products?.length === 0 &&
          "Products cannot be empty") ||
        undefined,
    },
    [isProductSelection],
  );

  const collections = useField(
    {
      value: [],
      validates: (collections) =>
        (isProductSelection === false &&
          collections?.length === 0 &&
          "Collections cannot be empty") ||
        undefined,
    },
    [isProductSelection],
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
        value: "",
        validates: [
          (discount) => {
            if (perkType.value === "discount" && !discount) {
              return "Discount cannot be empty";
            }
          },
          (discount) => {
            if (
              perkType.value === "discount" &&
              discount &&
              !(parseFloat(discount) > 0)
            ) {
              return "Discount cannot be negative";
            }
          },
          (discount) => {
            if (
              perkType.value === "discount" &&
              discountType.value === "percentage" &&
              !(parseFloat(discount) <= 100)
            ) {
              return "Discount cannot be greater than 100%";
            }
          },
        ],
      },
      [perkType.value, discountType.value],
    ),
    products,
    collections,
    perkType,
    orderLimit,
  };

  const { fields, submit, reset, dirty, ...remaining } = useForm({
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

  console.log({ dirty, ...remaining });

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
                      fields.campaignType.onChange(
                        value[0] as (typeof campaignTypeEnum)[number],
                      );
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
                      fields.perkType.onChange(
                        value[0] as (typeof perkTypeEnum)[number],
                      );
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
                          fields.discountType.onChange(
                            value[0] as (typeof discountTypeEnum)[number],
                          )
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
                      fields.redemptionLimit.onChange(
                        value[0] as (typeof redemptionLimitEnum)[number],
                      );
                    }}
                  />
                  {/* <TokengatesResourcePicker products={fields.products} /> */}
                  <TargetProductsOrCollections
                    products={fields.products}
                    collections={fields.collections}
                    isProductSelection={isProductSelection}
                    setIsProductSelection={setIsProductSelection}
                  />
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
