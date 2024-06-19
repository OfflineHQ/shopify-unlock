import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import deleteProductDiscount from "../campaigns-discount/delete-product-discount.server";
import deleteCampaignProductSubject from "./delete-campaign-product-subject.server";
import type { GetCampaignRes } from "./get-campaigns.server";

interface DeleteCampaignsProps extends Omit<DeleteCampaignProps, "campaign"> {
  campaigns: GetCampaignRes;
}

const DELETE_GATE_CONFIGURATION_MUTATION = `#graphql
mutation GateConfigurationDelete($input: GateConfigurationDeleteInput!) {
  gateConfigurationDelete(input: $input) {
    userErrors {
      field
      message
    }
    deletedGateConfigurationId
  }
}
`;

interface DeleteCampaignProps {
  graphql: AdminGraphqlClient;
  campaign: GetCampaignRes[number];
}

export async function deleteCampaign({
  graphql,
  campaign,
}: DeleteCampaignProps) {
  const discountId = campaign.discountId?.value;
  if (discountId) {
    await deleteProductDiscount({ graphql, discountId });
  }
  await Promise.all(
    campaign.subjectBindings.nodes.map((subject) =>
      deleteCampaignProductSubject({
        graphql,
        productSubjectId: subject.id,
      }),
    ),
  );
  console.log({ campaignId: campaign.id });
  const res = await graphql(DELETE_GATE_CONFIGURATION_MUTATION, {
    variables: {
      input: {
        id: campaign.id,
      },
    },
  });
  const resJson = await res.json();
  if (resJson.data?.gateConfigurationDelete?.userErrors?.length) {
    console.log(resJson.data.gateConfigurationDelete.userErrors[0].message);
    throw new Error(resJson.data.gateConfigurationDelete.userErrors[0].message);
  }
}

export default async function deleteCampaigns({
  graphql,
  campaigns,
}: DeleteCampaignsProps) {
  await Promise.all(
    campaigns.map((campaign) => deleteCampaign({ graphql, campaign })),
  );
}
