import { getGateContextClient } from "@shopify/gate-context-client";
import type { GateContext, LinkedCustomer, Vault } from "./schema";
import {
  connectWalletSchema,
  evaluateGateSchema,
  getLinkedCustomerSchema,
} from "./schema";

export const shopifyUnlockAppProxyUrl = "/apps/offline";

interface OfflineGateContextClient {
  read: () => Promise<GateContext | null>;
  write: (data: GateContext) => Promise<void>;
}

// @ts-ignore
export const gateContextClient: OfflineGateContextClient =
  getGateContextClient<OfflineGateContextClient>({
    backingStore: "ajaxApi",
    // @ts-ignore
    shopifyGateContextGenerator: async (data: GateContext) => {
      console.log("shopifyGateContextGenerator", data);
      try {
        if (data.disconnect) {
          const disconnectData: GateContext = {
            walletAddress: undefined,
            walletVerificationMessage: undefined,
            walletVerificationSignature: undefined,
            linkedCustomer: {
              address: data.noCustomer
                ? undefined
                : data.linkedCustomer?.address,
            },
            vaults: [],
          };
          console.log("disconnectData", disconnectData);
          return disconnectData;
        }
        const existing = await gateContextClient.read();
        console.log("existing gate context", { existing, data });

        // Merge existing and new data
        const mergedData = {
          ...(existing || {}),
          ...(data || {}),
        };

        // Merge vaults array
        const existingVaults = existing?.vaults || [];
        const newVaults = data?.vaults || [];
        const mergedVaults = mergeVaults(existingVaults, newVaults);

        // Return the merged data with updated vaults
        return {
          ...mergedData,
          vaults: mergedVaults,
        };
      } catch (e) {
        console.error("failed to read gate context", e);
        return data;
      }
    },
  });

// Function to merge vaults arrays
function mergeVaults(existingVaults: Vault[], newVaults: Vault[]) {
  const vaultsById = new Map(existingVaults.map((vault) => [vault.id, vault]));

  newVaults.forEach((vault) => {
    if (vault.remove) {
      // If the vault has a 'remove' property set to true, remove it from the map
      vaultsById.delete(vault.id);
    } else {
      // Otherwise, update the vault in the map
      vaultsById.set(vault.id, vault);
    }
  });

  return Array.from(vaultsById.values());
}

export function disableBuyButtons() {
  const buyButtons = document.querySelectorAll(".product-form__buttons button");
  buyButtons.forEach((button) => {
    button.setAttribute("disabled", "");
  });
}

export function enableBuyButtons() {
  const buyButtons = document.querySelectorAll(".product-form__buttons button");
  buyButtons.forEach((button) => {
    button.removeAttribute("disabled");
  });
}

export async function getLinkedCustomer() {
  const response = await fetch(
    `${shopifyUnlockAppProxyUrl}/public-api/linked-customer`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("getLinkedCustomer error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    const validatedData = getLinkedCustomerSchema.parse(json);
    console.log("getLinkedCustomer response:", validatedData);
    await gateContextClient.write({ linkedCustomer: validatedData });
    return validatedData;
  }
}

export async function connectWallet({
  address,
  message,
  signature,
  existingCustomer,
  productId,
  gateId,
}: {
  address: string;
  message: string;
  signature: string;
  existingCustomer?: LinkedCustomer;
  productId?: string;
  gateId?: string;
}) {
  const response = await fetch(
    `${shopifyUnlockAppProxyUrl}/public-api/connect`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        productGid: `gid://shopify/Product/${productId}`,
        gateConfigurationGid: `gid://shopify/GateConfiguration/${gateId}`,
        address,
        message,
        signature,
        existingCustomer,
      }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("connectApi error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    const validatedData = connectWalletSchema.parse(json);
    console.log("connectApi response:", validatedData);
    await gateContextClient.write(validatedData);
    return validatedData;
  }
}

export async function evaluateGate({
  address,
  message,
  signature,
  productId,
  gateId,
}: {
  address: string;
  message: string;
  signature: string;
  productId: string;
  gateId: string;
}) {
  const response = await fetch(
    `${shopifyUnlockAppProxyUrl}/public-api/evaluate-gate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        message,
        signature,
        productId,
        productGid: `gid://shopify/Product/${productId}`,
        gateConfigurationGid: `gid://shopify/GateConfiguration/${gateId}`,
      }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("evaluateGate error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    const validatedData = evaluateGateSchema.parse(json);
    console.log("evaluateGate response:", validatedData);
    await gateContextClient.write(validatedData);
    return validatedData;
  }
}

export const getGate = () => window.myAppGates?.[0] || {};
