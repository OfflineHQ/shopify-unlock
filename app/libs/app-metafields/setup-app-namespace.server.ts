import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import createAppMetafields from "./create-app-metafields.server";
import { NAMESPACE } from "./common";

const GET_APP_NAMESPACE_METAFIELDS = `#graphql
query GetAppNamespaceMetafield($namespace: String!) {
  currentAppInstallation {
    id
    metafield(key: "offline_handle", namespace: $namespace) {
      key
      value
    }
  }
}
`;

export default async function setupAppNamespace(graphql: AdminGraphqlClient) {
  if (!process.env.OFFLINE_GATES_HANDLE) {
    throw new Error("OFFLINE_GATES_HANDLE is not set");
  }
  const res = await graphql(GET_APP_NAMESPACE_METAFIELDS, {
    variables: {
      namespace: NAMESPACE,
    },
  });
  const resJson = await res.json();
  if (!resJson?.data?.currentAppInstallation) {
    throw new Error("App not installed");
  }
  const { currentAppInstallation } = resJson.data;
  const { metafield, id } = currentAppInstallation;
  if (!metafield) {
    const resApp = await createAppMetafields(graphql, [
      {
        type: "single_line_text_field",
        key: "offline_handle",
        namespace: NAMESPACE,
        value: process.env.OFFLINE_GATES_HANDLE,
        ownerId: id,
      },
    ]);
    const resMetafield = resApp?.metafields?.[0];
    if (!resMetafield) {
      throw new Error("Failed to create app metafield");
    }
    return {
      appNamespace: resMetafield.value,
      appId: id,
    };
  }
  const { value } = metafield;
  return {
    appNamespace: value,
    appId: id,
  };
}
