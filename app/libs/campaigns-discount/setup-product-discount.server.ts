import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import createAppMetafields from "~/libs/app-metafields/create-app-metafields.server";

const CREATE_AUTOMATIC_DISCOUNT_MUTATION = `#graphql
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export interface SetupProductDiscount {
  graphql: AdminGraphqlClient;
  discountName: string;
  gateConfigurationId: string;
  appNamespace: string;
}

export default async function setupProductDiscount({
  graphql,
  discountName,
  gateConfigurationId,
  appNamespace,
}: SetupProductDiscount) {
  const res = await graphql(CREATE_AUTOMATIC_DISCOUNT_MUTATION, {
    variables: {
      discount: {
        title: discountName,
        functionId: process.env.SHOPIFY_OFFLINE_DISCOUNT_ID,
        combinesWith: {
          productDiscounts: true,
          shippingDiscounts: true,
        },
        startsAt: new Date(),
        metafields: [
          {
            key: "gate_configuration_id",
            namespace: "offline-gate",
            type: "single_line_text_field",
            value: gateConfigurationId,
          },
        ],
      },
    },
  });
  const resJson = await res.json();
  const discountId =
    resJson.data?.discountCreate?.automaticAppDiscount?.discountId;
  if (!discountId) {
    throw new Error("Failed to create discount");
  }
  const resMetafields = await createAppMetafields(graphql, [
    {
      type: "json",
      key: "offline_handle",
      namespace: "offline-gate",
      ownerId: discountId,
      value: JSON.stringify({
        gatesHandle: appNamespace,
      }),
    },
  ]);
  if (!resMetafields || resMetafields.userErrors?.length > 0) {
    throw new Error(
      `Failed to create metafields for discount: ${resMetafields?.userErrors
        ?.map((error) => error.message)
        .join(", ")}`,
    );
  }
  return discountId;
}
