import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

const GET_APP_INSTALLATION = `#graphql
query GetCurrentInstallation {
  currentAppInstallation {
    id
  }
}
`;

export default async function getAppInstallation(graphql: AdminGraphqlClient) {
  const res = await graphql(GET_APP_INSTALLATION);
  const resJson = await res.json();
  return resJson.data?.currentAppInstallation;
}
