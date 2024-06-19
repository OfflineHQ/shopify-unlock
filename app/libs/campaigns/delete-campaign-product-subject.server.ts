import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

interface DeleteCampaignProductSubjectProps {
  graphql: AdminGraphqlClient;
  productSubjectId: string;
}

const DELETE_PRODUCT_SUBJECT_MUTATION = `#graphql
mutation ProductSubjectDelete($input: GateSubjectDeleteInput!) {
	gateSubjectDelete(input: $input) {
    	userErrors {
    	  field
    	  message
    	}
  }
}
`;

export default async function deleteCampaignProductSubject({
  graphql,
  productSubjectId,
}: DeleteCampaignProductSubjectProps) {
  const res = await graphql(DELETE_PRODUCT_SUBJECT_MUTATION, {
    variables: {
      input: {
        id: productSubjectId,
      },
    },
  });
  const resJson = await res.json();
  if (resJson.data?.gateSubjectDelete?.userErrors?.length) {
    throw new Error(resJson.data.gateSubjectDelete.userErrors[0].message);
  }
}
