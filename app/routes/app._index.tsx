import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { BlockStack, IndexTable, Page, Text } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import type { IndexTableHeading } from "@shopify/polaris/build/ts/src/components/IndexTable";
import type { NonEmptyArray } from "@shopify/polaris/build/ts/src/types";
import { useEffect, useState } from "react";
import setupAppNamespace from "~/libs/app-metafields/setup-app-namespace.server";
import { CampaignRowActions } from "~/libs/campaigns/campaign-row-actions";
import deleteCampaigns, {
  deleteCampaign,
} from "~/libs/campaigns/detele-campaigns.server";
import type { GetCampaignRes } from "~/libs/campaigns/get-campaigns.server";
import getCampaigns from "~/libs/campaigns/get-campaigns.server";
import { ActionsEnum } from "~/libs/campaigns/types";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { campaigns, campaign, action } = (await request.json()) as {
    campaigns?: GetCampaignRes;
    campaign?: GetCampaignRes[number];
    action: ActionsEnum;
  };
  switch (action) {
    case ActionsEnum.DeleteCampaigns:
      if (campaigns?.length) {
        await deleteCampaigns({
          graphql: admin.graphql,
          campaigns,
        });
      }
      break;
    case ActionsEnum.DeleteCampaign:
      if (campaign) {
        await deleteCampaign({
          graphql: admin.graphql,
          campaign,
        });
      }
      break;
  }

  return json({
    status: "success",
    action,
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { appNamespace } = await setupAppNamespace(admin.graphql);
  const campaigns = await getCampaigns({
    graphql: admin.graphql,
    appNamespace,
  });
  return { campaigns, appNamespace };
};

export default function Index() {
  const navigate = useNavigate();
  const { campaigns } = useLoaderData<typeof loader>();

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state === "submitting";

  const tableHeadings = [
    { title: "Name" },
    { title: "Perk" },
    { title: "Products" },
    { title: "ID" },
    { title: "Actions", alignment: "end" },
  ];

  const perkTypeName = Object.freeze({
    discount: "Discount",
    exclusive_access: "Exclusive Access",
  });

  const emptyState = (
    <BlockStack align="center">
      <p>No campaigns found</p>
    </BlockStack>
  );

  useEffect(() => {
    console.log(fetcher.data);
    if (fetcher.data?.status === "success") {
      switch (fetcher.data.action) {
        case ActionsEnum.DeleteCampaigns:
          shopify.toast.show("Campaigns deleted successfully");
          break;
        case ActionsEnum.DeleteCampaign:
          shopify.toast.show("Campaign deleted successfully");
          break;
      }
      navigate("/app");
    }
  }, [fetcher.data]);

  const handleBulkDelete = async () => {
    const campaignToDelete = campaigns.filter((campaign) =>
      selectedCampaigns.includes(campaign.id),
    );
    console.log("Deleting campaigns:", campaignToDelete);
    fetcher.submit(
      { campaigns: campaignToDelete, action: ActionsEnum.DeleteCampaigns },
      {
        method: "POST",
        encType: "application/json",
      },
    );
    return { status: "success" };
  };

  const handleAction = (campaignId: string, action: ActionsEnum) => {
    const campaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!campaign) {
      return;
    }
    fetcher.submit(
      {
        campaign,
        action,
      },
      { method: "POST", encType: "application/json" },
    );
  };

  const campaignsMarkup = campaigns
    .filter((gate) => gate.requirements?.value && gate.reaction?.value)
    .map((gate, index) => {
      const { id, name, reaction, subjectBindings } = gate;

      // const segment = (JSON.parse(requirements.value)?.conditions || [])
      //   .map((condition) => condition.contractAddress)
      //   .join(", ");

      const perkType = JSON.parse(reaction?.value || "{}")?.type ?? "—";

      const numProducts = subjectBindings?.nodes?.length ?? "—";

      return (
        <IndexTable.Row
          id={id}
          key={id}
          position={index}
          selected={!!selectedCampaigns.includes(id)}
        >
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {name}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text variant="bodyMd" as="span">
              {perkTypeName[perkType]}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text variant="bodyMd" as="span" numeric>
              {numProducts}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" numeric>
              {id.split("/").pop()}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <CampaignRowActions campaignId={id} handleAction={handleAction} />
            </div>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    });

  return (
    <Page
      title="My Campaigns"
      primaryAction={{
        content: "Create new campaign",
        onAction: () => {
          navigate("/app/create-campaign");
        },
      }}
    >
      <IndexTable
        promotedBulkActions={[
          {
            destructive: true,
            content: "Delete campaigns",
            icon: DeleteIcon,
            onAction: handleBulkDelete,
          },
        ]}
        emptyState={emptyState}
        headings={tableHeadings as NonEmptyArray<IndexTableHeading>}
        itemCount={campaigns?.length ?? 0}
        resourceName={{
          singular: "Campaign",
          plural: "Campaigns",
        }}
        loading={isSubmitting}
        selectedItemsCount={selectedCampaigns.length}
        onSelectionChange={(selectionType, toggleType, selection, position) => {
          if (selectionType === "page") {
            setSelectedCampaigns(
              toggleType ? campaigns.map((campaign) => campaign.id) : [],
            );
          } else if (selectionType === "single") {
            setSelectedCampaigns(
              toggleType
                ? [...selectedCampaigns, selection as string]
                : selectedCampaigns.filter(
                    (selected) => selected !== selection,
                  ),
            );
          }
        }}
      >
        {campaignsMarkup}
      </IndexTable>
    </Page>
  );
}
