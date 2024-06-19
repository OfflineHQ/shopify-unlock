import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type { MetafieldInput } from "~/types/admin.types";

interface UpdateCampaignMetafieldsProps {
  graphql: AdminGraphqlClient;
  metafields: MetafieldInput[];
  campaignId: string;
}

const UPDATED_CAMPAIGN_METAFIELDS_MUTATION = `#graphql
mutation gateConfigurationUpdate($id: ID!, $metafields: [MetafieldInput!]!) {
  gateConfigurationUpdate(input: {
	id: $id
	metafields: $metafields
  }) {
    gateConfiguration {
      id
    }
	userErrors {
		message
	}
  }
}
`;

export default async function updateCampaignMetafields({
  graphql,
  campaignId,
  metafields,
}: UpdateCampaignMetafieldsProps) {
  const res = await graphql(UPDATED_CAMPAIGN_METAFIELDS_MUTATION, {
    variables: {
      id: campaignId,
      metafields,
    },
  });
  const resJson = await res.json();
  if (resJson.data?.gateConfigurationUpdate?.userErrors?.length) {
    throw new Error(resJson.data.gateConfigurationUpdate.userErrors[0].message);
  }
}
