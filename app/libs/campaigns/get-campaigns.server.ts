import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

export interface GetCampaigns {
  graphql: AdminGraphqlClient;
  appNamespace: string;
  limit?: number;
  offset?: number;
}
export default async function getCampaigns({
  graphql,
  appNamespace,
}: GetCampaigns) {
  const GATES_QUERY = `#graphql
  query GetGateConfigurations($query: String!, $first: Int!) {
    gateConfigurations(query: $query, first: $first) {
      nodes {
        id
        name
        handle
        requirements: metafield(namespace: "offline-gate",
          key: "requirements") {
            value
        }
        reaction: metafield(namespace: "offline-gate",
          key: "reaction") {
            value
        }
        discountId: metafield(namespace: "offline-gate",
          key: "discount-id") {
            value
        }
        subjectBindings(first: $first, includeInactive: true) {
          nodes {
            id
            active
	    subject {
		... on Product {
			title
			id
		}
	    }
          }
        }
        createdAt
        updatedAt
      }
    }
  }
`;
  const res = await graphql(GATES_QUERY, {
    variables: {
      query: `"handle:${appNamespace}"`,
      first: 100,
    },
  });
  const resJson = await res.json();
  return resJson.data?.gateConfigurations?.nodes || [];
}

export type GetCampaignRes = Awaited<ReturnType<typeof getCampaigns>>;
