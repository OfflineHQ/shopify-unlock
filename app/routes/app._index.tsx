import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { BlockStack, Button, IndexTable, Page } from "@shopify/polaris";
import type { IndexTableHeading } from "@shopify/polaris/build/ts/src/components/IndexTable";
import type { NonEmptyArray } from "@shopify/polaris/build/ts/src/types";
import setupAppNamespace from "~/libs/app-metafields/setup-app-namespace";
import { authenticate } from "../shopify.server";

async function getCampaigns(appNamespace: string) {
  return [];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const appNamespace = await setupAppNamespace(admin.graphql);
  const campaigns = await getCampaigns(appNamespace);
  return { campaigns, appNamespace };
};

export default function Index() {
  const navigate = useNavigate();
  const { campaigns, appNamespace } = useLoaderData<typeof loader>();

  console.log({ appNamespace });

  const tableHeadings = [
    { title: "Gate" },
    { title: "Perk" },
    { title: "Products" },
    { title: "ID" },
    { title: "" },
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

  const campaignsMarkup = campaigns
    .filter((gate) => gate.requirements?.value && gate.reaction?.value)
    .map((gate, index) => {
      const { id, name, requirements, reaction, subjectBindings } = gate;

      // const segment = (JSON.parse(requirements.value)?.conditions || [])
      //   .map((condition) => condition.contractAddress)
      //   .join(", ");

      console.log({ gate });

      const perkType = JSON.parse(reaction.value)?.type ?? "—";

      const numProducts = subjectBindings?.nodes?.length ?? "—";

      return (
        <IndexTable.Row id={id} key={id} position={index}>
          <IndexTable.Cell>{name}</IndexTable.Cell>
          <IndexTable.Cell>{perkTypeName[perkType]}</IndexTable.Cell>
          <IndexTable.Cell>{numProducts}</IndexTable.Cell>
          <IndexTable.Cell>{id.split("/").pop()}</IndexTable.Cell>
          <IndexTable.Cell>
            <Button>Delete</Button>
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
        emptyState={emptyState}
        headings={tableHeadings as NonEmptyArray<IndexTableHeading>}
        itemCount={campaigns?.length ?? 0}
        resourceName={{
          singular: "Campaign",
          plural: "Campaigns",
        }}
        selectable={false}
      >
        {campaignsMarkup}
      </IndexTable>
    </Page>
  );
}
