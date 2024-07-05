import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import setupProductDiscount from "../campaigns-discount/setup-product-discount.server";
import { getProductsGatesMinimal } from "./get-products-gates.server";
import { type CampaignFormData } from "./schema";
import setupCampaignProductSubject from "./setup-campaign-product-subject.server";
import {
  GateReactionType,
  GateRequirement,
  GateConditionLogic,
  GateReaction,
  DiscountType,
} from "@/types";

const CREATE_GATE_CONFIGURATION_MUTATION = `#graphql
  mutation CreateGateConfiguration($name: String!, $requirements: String!, $reaction: String!, $orderLimit: String, $gatesHandle: String) {
    gateConfigurationCreate(input: {
        name: $name,
        metafields: [{
          namespace: "offline-gate",
          key: "requirements",
          type: "json",
          value: $requirements
        },
        {
          namespace: "offline-gate",
          key: "reaction",
          type: "json",
          value: $reaction
        },
        {
          namespace: "offline-gate",
          key: "orderLimit",
          type: "string",
          value: $orderLimit
        }],
        handle: $gatesHandle
      }) {
      gateConfiguration {
        id
        name
        createdAt
        updatedAt
        metafields(namespace: "offline-gate", first: 10) {
          nodes {
            key
            value
            namespace
            type
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface SetupCampaign {
  graphql: AdminGraphqlClient;
  campaignForm: CampaignFormData;
  appNamespace: string;
}

export default async function setupCampaign({
  graphql,
  campaignForm,
  appNamespace,
}: SetupCampaign) {
  if (!appNamespace) {
    throw new Error("App namespace is required");
  }
  const exclusiveAccess =
    campaignForm.perkType === GateReactionType.ExclusiveAccess;
  const gateConfigurationRequirements: GateRequirement = {
    logic: GateConditionLogic.Any,
    conditions: [
      {
        contractAddress: "",
        tokenIds: [],
      },
    ],
  };
  if (
    !exclusiveAccess &&
    (!campaignForm.discountType || !campaignForm.discount)
  ) {
    throw new Error("Discount type and value are required");
  }
  const gateConfigurationReaction: GateReaction = exclusiveAccess
    ? {
        name: campaignForm.name,
        type: GateReactionType.ExclusiveAccess,
      }
    : {
        name: campaignForm.name,
        type: GateReactionType.Discount,
        discount: {
          type: campaignForm.discountType as DiscountType,
          value: campaignForm.discount as number,
        },
      };
  const gateConfiguration = await graphql(CREATE_GATE_CONFIGURATION_MUTATION, {
    variables: {
      name: campaignForm.name,
      requirements: JSON.stringify(gateConfigurationRequirements),
      reaction: JSON.stringify(gateConfigurationReaction),
      orderLimit: campaignForm.orderLimit?.toString() || null,
      gatesHandle: appNamespace,
    },
  });
  const resJson = await gateConfiguration.json();
  const gateConfigurationId =
    resJson.data?.gateConfigurationCreate?.gateConfiguration?.id;
  if (!gateConfigurationId) {
    throw new Error("Failed to create gate configuration");
  }
  console.log({
    gateCreated: resJson.data?.gateConfigurationCreate?.gateConfiguration,
  });
  const resProductGate = await getProductsGatesMinimal({
    graphql,
    productsGid: campaignForm.products,
  });
  if (!resProductGate) {
    throw new Error("Failed to get products");
  }
  await setupCampaignProductSubject({
    graphql,
    campaignId: gateConfigurationId,
    products: resProductGate,
    appNamespace,
  });
  if (!exclusiveAccess) {
    await setupProductDiscount({
      graphql,
      discountName: campaignForm.name,
      gateConfigurationId,
      appNamespace,
    });
  }
}
