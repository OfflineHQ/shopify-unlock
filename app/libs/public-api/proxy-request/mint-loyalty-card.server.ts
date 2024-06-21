import { makeShopifyProxyRequest } from "./make-shopify-request.server";

interface MintLoyaltyCard {
  address: string;
  contractAddress: string;
  shopDomain: string;
  customerId: string;
}

// mint a loyalty card for the user
export default async function mintLoyaltyCard({
  address,
  contractAddress,
  shopDomain,
  customerId,
}: MintLoyaltyCard) {
  if (!contractAddress) {
    return false;
  }

  const params = {
    ownerAddress: encodeURIComponent(address),
    customerId,
    shop: shopDomain,
  };

  const path = `/loyalty-card/${contractAddress}`;
  await makeShopifyProxyRequest(path, params, "POST");
}
