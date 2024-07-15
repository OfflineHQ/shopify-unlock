import { getGateContextClient } from "@shopify/gate-context-client";
import { DiscountType } from "~/types";
import type { GateContectWrite, GateContext, Vault } from "./schema";
import { connectWalletSchema, evaluateGateSchema } from "./schema";

export const shopifyUnlockAppProxyUrl = "/apps/offline";

interface OfflineGateContextClient {
  read: () => Promise<GateContext | null>;
  write: (data: GateContectWrite) => Promise<void>;
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

export async function connectWallet({
  address,
  message,
  signature,
  productId,
  gateId,
}: {
  address: string;
  message: string;
  signature: string;
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
    console.log("evaluateGate json", { json });
    const validatedData = evaluateGateSchema.parse(json);
    console.log("evaluateGate response:", validatedData);
    await gateContextClient.write(validatedData);
    return validatedData;
  }
}

export const getGate = () => window.myAppGates?.[0] || {};

export function updatePriceDisplay(
  discount: {
    type: DiscountType;
    value: number;
  },
  formattedOriginalPrice: string,
) {
  const priceContainers = document.querySelectorAll(".price");
  console.log("priceContainers", priceContainers);
  priceContainers.forEach((priceContainer) => {
    const regularPriceElement = priceContainer.querySelector(
      ".price__regular .price-item--regular",
    );
    const salePriceElement = priceContainer.querySelector(
      ".price__sale .price-item--sale",
    );

    if (regularPriceElement && salePriceElement) {
      const originalPrice = parseFloat(
        formattedOriginalPrice.replace(/[^0-9,.-]+/g, "").replace(",", "."),
      );
      let discountedPrice = originalPrice;

      if (discount.type === DiscountType.Percentage) {
        discountedPrice = originalPrice * (1 - discount.value / 100);
      } else if (discount.type === DiscountType.Amount) {
        discountedPrice = Math.max(0, originalPrice - discount.value);
      }

      // Update classes
      priceContainer.classList.add("price--on-sale", "price--show-badge");

      // Update regular price (slashed)
      const slashedRegularPriceSpan = priceContainer.querySelector(
        ".price__sale s.price-item--regular",
      );
      if (slashedRegularPriceSpan) {
        slashedRegularPriceSpan.textContent = formattedOriginalPrice;
      }

      // Update sale price
      const formattedDiscountedPrice = (window as any).Shopify.formatMoney(
        Math.round(discountedPrice * 100),
      );
      salePriceElement.textContent = formattedDiscountedPrice;

      // Update or add the badge
      let badgeElement = priceContainer.querySelector(
        ".badge.price__badge-sale",
      );
      if (!badgeElement) {
        badgeElement = document.createElement("span");
        badgeElement.className = "badge price__badge-sale color-scheme-5";
        priceContainer.appendChild(badgeElement);
      }
      badgeElement.textContent = "Unlocked";

      // Show sale price container and hide regular price container
      const regularPriceContainer: HTMLElement | null =
        priceContainer.querySelector(".price__regular");
      const salePriceContainer: HTMLElement | null =
        priceContainer.querySelector(".price__sale");
      if (regularPriceContainer && salePriceContainer) {
        regularPriceContainer.style.display = "none";
        salePriceContainer.style.display = "block";
      }
    }
  });
}
