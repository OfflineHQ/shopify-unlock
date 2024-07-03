// check if the loyalty card is owned by the user

import { makeShopifyProxyRequest } from "./make-shopify-request.server";

interface isLoyaltyCardOwned {
  address: string;
  contractAddress: string;
  shopDomain: string;
}

// return true if the user owns the loyalty card, false otherwise
export default async function isLoyaltyCardOwned({
  address,
  contractAddress,
  shopDomain,
}: isLoyaltyCardOwned) {
  if (!contractAddress) {
    return false;
  }

  const params = {
    ownerAddress: encodeURIComponent(address),
    shop: shopDomain,
  };

  const path = `/loyalty-card/${contractAddress}`;
  const data = await makeShopifyProxyRequest<{ isOwned: boolean }>(
    path,
    params,
  );
  return data?.isOwned;
}
