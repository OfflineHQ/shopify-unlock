import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Button,
  ButtonGroup,
  ChoiceList,
  FormLayout,
  InlineStack,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
} from "@shopify/polaris";
import { useField, useForm } from "@shopify/react-form";
import { useCallback, useEffect, useState } from "react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.json();
  console.log({ formData });
  return json({
    status: 'success',
  });
};

export default function CreateTokengate() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isSubmitting =
  fetcher.state === "submitting";
  useEffect(() => {
    console.log(fetcher.data);
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Campaign created successfully");
      navigate("/app");
    }
  }, [fetcher.data]);
  const [exclusive, setExclusive] = useState(false);

  const perkType = useField("discount");
  const discountType = useField("percentage");

  const fieldsDefinition = {
    name: useField({
      value: "",
      validates: (name) => !name && "Name cannot be empty" || undefined,
    }),
    discountType,
    discount: useField(
      {
        value: 0,
        validates: (discount) => {
          if (perkType.value === "discount" && !discount) {
            return "Discount cannot be empty";
          }
        },
      },
      [perkType.value]
    ),
    products: useField({
      value: [],
      // validates: (products) =>
      //   products.length === 0 && "Products cannot be empty",
    }),
    perkType,
    orderLimit: useField(
      {
        value: 0,
        validates: (orderLimit) => {
          if (perkType.value === "exclusive_access" && !orderLimit) {
            return "Order limit cannot be empty";
          }
        },
      },
      [perkType.value],
    ),
  };

  const { fields, submit, reset } = useForm({
    fields: fieldsDefinition,
    onSubmit: async (formData) => {
      console.log("Form submitted with data:", formData);
      fetcher.submit(formData, {
        method: "POST",
        encType: "application/json"
      });
      return { status: 'success' };
    },
  });

  const handleDiscountTypeButtonClick = useCallback(() => {
    if (fields.discountType.value === "percentage") {
      fields.discountType.onChange("amount");
    } else {
      fields.discountType.onChange("percentage");
    }
  }, [fields.discountType]);

  return (
    <Page
      backAction={{
        content: "Go back",
        accessibilityLabel: "Go back",
        url: "/app",
      }}
      title="Create a new Offline Gate"
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
                  setExclusive(!exclusive);
                }}
              />
              {fields.perkType.value === "discount" && (
                <InlineStack blockAlign="end" gap="400">
                  <ButtonGroup>
                    <Button
                      pressed={fields.discountType.value === "percentage"}
                      onClick={handleDiscountTypeButtonClick}
                    >
                      Percentage
                    </Button>
                    <Button
                      pressed={fields.discountType.value === "amount"}
                      onClick={handleDiscountTypeButtonClick}
                    >
                      Amount
                    </Button>
                  </ButtonGroup>
                  <TextField
                    label="Discount"
                    type="number"
                    {...fields.discount}
                    autoComplete="off"
                  />
                </InlineStack>
              )}
              {fields.perkType.value === "exclusive_access" && (
                <TextField
                  label="Order Limit"
                  type="number"
                  {...fields.orderLimit}
                  autoComplete="off"
                />
              )}
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
                    content: "Cancel",
                    onAction: reset,
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