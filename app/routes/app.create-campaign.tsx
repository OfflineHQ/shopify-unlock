import { useNavigate } from "@remix-run/react";
// import { ContextualSaveBar } from "@shopify/app-bridge-react";
import {
  Form,
  Layout,
  Page,
  PageActions
} from "@shopify/polaris";
import { useField, useForm } from "@shopify/react-form";
import { useCallback, useState } from "react";

export default function CreateTokengate() {
  const navigate = useNavigate();
  const [toastProps, setToastProps] = useState({ content: null });
  const [exclusive, setExclusive] = useState(false);

  const fieldsDefinition = {
    name: useField({
      value: "",
      validates: (name) => !name && "Name cannot be empty",
    }),
    discountType: useField("percentage"),
    discount: useField({
      value: undefined,
    }),
    products: useField([]),
    perkType: useField("discount"),
    orderLimit: useField(""),
  };

  const { fields, submit, submitting, dirty, reset, makeClean } = useForm({
    fields: fieldsDefinition,
    onSubmit: async (formData) => {
      try {
        const { discountType, discount, name, products, perkType, orderLimit } =
          formData;

        const productGids = products.map((product) => product.id);

        console.log({ discount });
        if (perkType === "discount" && !discount) {
          setToastProps({
            content: "Discount cannot be empty!",
            error: true,
          });
          return;
        }

        // TODO Fix this, call to proxy not working

        // // Call to proxy
        // const loyaltyCardContractResponse = await fetch(
        //   `/apps/offline/admin/loyalty-card`,
        //   {
        //     method: "GET",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //   }
        // );
        // console.log({ loyaltyCardContractResponse });
        // const data = await loyaltyCardContractResponse.json();
        // console.log({ data });
        // const loyaltyCardContractAddress = data
        //   ?.contractAddress;
        // console.log({ loyaltyCardContractAddress });
        // if (!loyaltyCardContractResponse.ok || !loyaltyCardContractAddress) {
        //   setToastProps({
        //     content: "There was an error getting your loyalty card contract. Please contact support.",
        //     error: true,
        //   });
        //   return;
        // }

        // TODO: remove this when call to proxy resolved
        const loyaltyCardContractAddress =
          "0x35f30b6ca28c3fae0bf97abfcc6c81b6559fb333";

        console.log({ productGids });

        let requestBody = {
          // gatesHandle: appData?.response?.metafield?.value,
          discountType,
          discount,
          name,
          productGids,
          segment: [loyaltyCardContractAddress],
          perkType,
          exclusiveAccess: perkType === "exclusive_access" ? true : false,
        };

        console.log({ createTokenGateRequestBody: requestBody });

        const orderLimitValue = Number(orderLimit);
        if (!isNaN(orderLimitValue) && orderLimitValue > 0) {
          requestBody.orderLimit = orderLimitValue;
        }

        //   const response = await authenticatedFetch("/api/gates", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify(requestBody),
        //   });

        //   if (response.ok) {
        //     setToastProps({ content: "Offline Gate created" });
        //     makeClean();
        //     navigate("/");
        //   } else {
        //     setToastProps({
        //       content: "There was an error creating an Offline Gate",
        //       error: true,
        //     });
        //   }
      } catch (error) {
        console.error({ error });
        setToastProps({
          content: "There was an error creating an Offline Gate",
          error: true,
        });
      }
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
          <Form onSubmit={submit}>
            {/* <ContextualSaveBar
              saveAction={{
                onAction: submit,
                disabled: submitting || !dirty,
                // loading: submitting || !isSuccess,
              }}
              discardAction={{
                onAction: reset,
              }}
              visible={dirty}
            /> */}
            {/* <Layout>
              <Layout.Section>
                <Card>
                  <Card.Section>
                    <TextContainer>
                    <Text variant="headingMd" as="h2">Configuration</Text>
                      <TextField
                        name="name"
                        label="Name"
                        type="text"
                        {...fields.name}
                        autoComplete="off"
                      />
                    </TextContainer>
                  </Card.Section>
                  <Card.Section title="PERK TYPE">
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
                  </Card.Section>
                  {fields.perkType.value === "discount" && (
                    <Card.Section title="DISCOUNT PERK">
                      <InlineStack>
                        <InlineStack.Item>
                          <ButtonGroup segmented>
                            <Button
                              pressed={
                                fields.discountType.value === "percentage"
                              }
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
                        </InlineStack.Item>
                        <InlineStack.Item fill>
                          <TextField
                            label="Discount"
                            type="number"
                            {...fields.discount}
                            autoComplete="off"
                          />
                        </InlineStack.Item>
                      </InlineStack>
                    </Card.Section>
                  )}
                  {fields.perkType.value === "exclusive_access" && (
                    <Card.Section title="EXCLUSIVE ACCESS PERK">
                      <TextContainer>
                        <TextField
                          label="Order Limit"
                          type="number"
                          {...fields.orderLimit}
                          autoComplete="off"
                        />
                      </TextContainer>
                    </Card.Section>
                  )}
                </Card>
              </Layout.Section>
            </Layout> */}
            <PageActions
              primaryAction={{
                content: "Create Gate",
                onAction: submit,
                loading: submitting,
                disabled: submitting,
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: reset,
                },
              ]}
            />
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
