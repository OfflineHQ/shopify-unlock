import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import type {
  CreateGateSubjectMutation,
  RetrieveProductsGatesMinimalQuery,
  UpdateGateSubjectMutation,
} from "~/types/admin.generated";

const CREATE_GATE_SUBJECT_MUTATION = `#graphql
  mutation createGateSubject ($gateConfigurationId: ID!, $subject: ID!){
    gateSubjectCreate(input: {
      gateConfigurationId: $gateConfigurationId,
      active: true,
      subject: $subject
    }) {
      gateSubject {
        id
        configuration {
          id
          name
          requirements: metafield(namespace: "offline-gate",
            key: "requirements") {
              value
          }
          reaction: metafield(namespace: "offline-gate",
            key: "reaction") {
              value
          }
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_GATE_SUBJECT_MUTATION = `#graphql
  mutation updateGateSubject ($gateConfigurationId: ID!, $id: ID!){
    gateSubjectUpdate(input: {
      gateConfigurationId: $gateConfigurationId,
      id: $id
    }) {
      gateSubject {
        id
        configuration {
          id
          name
          requirements: metafield(namespace: "offline-gate",
            key: "requirements") {
              value
          }
          reaction: metafield(namespace: "offline-gate",
            key: "reaction") {
              value
          }
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface SetupCampaignProductSubject {
  graphql: AdminGraphqlClient;
  campaignId: string;
  appNamespace: string;
  products: RetrieveProductsGatesMinimalQuery["products"]["nodes"];
}

export default async function setupCampaignProductSubject({
  graphql,
  campaignId,
  appNamespace,
  products,
}: SetupCampaignProductSubject) {
  const promises = products.map(async (product) => {
    const gates = product.gates.filter(
      (gate) => gate.configuration?.handle === appNamespace,
    );
    if (gates.length > 0) {
      const activeGateSubjectId = gates[0].id;
      return graphql(UPDATE_GATE_SUBJECT_MUTATION, {
        variables: {
          gateConfigurationId: campaignId,
          id: activeGateSubjectId,
        },
      });
    } else {
      return graphql(CREATE_GATE_SUBJECT_MUTATION, {
        variables: {
          gateConfigurationId: campaignId,
          subject: product.id,
        },
      });
    }
  });

  const res = await Promise.all(promises);
  const resJson = await Promise.all(res.map((r) => r.json()));
  for (const r of resJson) {
    if (!r || !r.data) {
      throw new Error("Failed to create gate subject");
    }
    const userErrors =
      (r.data as CreateGateSubjectMutation).gateSubjectCreate?.userErrors ||
      (r.data as UpdateGateSubjectMutation).gateSubjectUpdate?.userErrors;
    if (userErrors && userErrors?.length > 0) {
      throw new Error(userErrors[0].message);
    }
  }
}
