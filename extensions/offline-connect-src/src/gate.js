import { getGateContextClient } from "@shopify/gate-context-client";

// TODO: import from offline lib @offline/iframe
export const OffKeyState = {
  Unlocked: "Unlocked", // The off-key is unlocked and can be used
  Locked: "Locked", // The off-key is locked and cannot be used
  Unlocking: "Unlocking", // The off-key is unlocking (being created)
  Used: "Used", // The off-key has been used and cannot be used again in this context
};

// TODO: here using a public api for now but should be replaced with a private api with app proxy (see https://github.com/OfflineHQ/shopify-gates/issues/25)
// export const shopifyUnlockBackendApiUrl = '/apps/offline';
export const shopifyUnlockBackendApiUrl =
  process.env.SHOPIFY_UNLOCK_BACKEND_URL;

export const gateContextClient = getGateContextClient({
  backingStore: "ajaxApi",
  shopifyGateContextGenerator: async (data) => {
    try {
      const existing = await gateContextClient.read();
      if (data.disconnect) {
        return data.noCustomer
          ? {}
          : { linkedCustomer: existing.linkedCustomer };
      }
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
function mergeVaults(existingVaults, newVaults) {
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

export async function getLinkedCustomer(customerId) {
  console.log("getLinkedCustomer", customerId);
  const response = await fetch(
    `${shopifyUnlockBackendApiUrl}/public-api/getLinkedCustomer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId,
        shopDomain: getShopDomain(),
      }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("getLinkedCustomer error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    await gateContextClient.write({ linkedCustomer: json });
    return json;
  }
}

export async function connectWallet({
  address,
  message,
  signature,
  customerId,
  existingCustomer,
  productId,
  gateId,
  shopDomain,
}) {
  const response = await fetch(
    `${shopifyUnlockBackendApiUrl}/public-api/connect`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        productGid: `gid://shopify/Product/${productId}`,
        gateConfigurationGid: `gid://shopify/GateConfiguration/${gateId}`,
        shopDomain,
        address,
        message,
        signature,
        customerId,
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
    await gateContextClient.write(json);
    console.log("connectApi response:", json);
    return json;
  }
}

export async function isLoyaltyCardOwned({
  address,
  message,
  signature,
  productId,
  gateId,
  shopDomain,
}) {
  const response = await fetch(
    `${shopifyUnlockBackendApiUrl}/public-api/isLoyaltyCardOwned`,
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
        shopDomain,
      }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error("isLoyaltyCardOwned error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    await gateContextClient.write(json);
    return json;
  }
}

export async function mintLoyaltyCard({
  address,
  message,
  signature,
  productId,
  gateId,
  shopDomain,
}) {
  const response = await fetch(
    `${shopifyUnlockBackendApiUrl}/public-api/mintLoyaltyCard`,
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
        shopDomain,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("mintLoyaltyCard error:", errorData);
    throw errorData;
  } else {
    const json = await response.json();
    await gateContextClient.write(json);
    return json;
  }
}

export const getGate = () => window.myAppGates?.[0] || {};

export const getShopDomain = () => {
  return window.Shopify.shop;
};

export function getProductId() {
  return document.getElementById("offline-unlock").dataset.product_id;
}
