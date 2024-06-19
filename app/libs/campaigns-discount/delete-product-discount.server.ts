import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

interface DeleteProductDiscountProps {
  graphql: AdminGraphqlClient;
  discountId: string;
}

const DELETE_PRODUCT_DISCOUNT_MUTATION = `#graphql
mutation DiscountAutomaticDelete($id: ID!) {
  discountAutomaticDelete(id: $id) {
    deletedAutomaticDiscountId
    userErrors {
      message
    }
  }
}
`;

export default async function deleteProductDiscount({
  graphql,
  discountId,
}: DeleteProductDiscountProps) {
  const res = await graphql(DELETE_PRODUCT_DISCOUNT_MUTATION, {
    variables: {
      id: discountId,
    },
  });
  const resJson = await res.json();
  if (resJson.data?.discountAutomaticDelete?.userErrors?.length) {
    throw new Error(resJson.data.discountAutomaticDelete.userErrors[0].message);
  }
}
