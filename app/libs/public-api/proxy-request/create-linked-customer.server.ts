import { makeShopifyProxyRequest } from "./make-shopify-request.server";

interface CreateLinkedCustomer {
  customerId: string;
  address: string;
  shopDomain: string;
}

export default async function createLinkedCustomer({
  customerId,
  address,
  shopDomain,
}: CreateLinkedCustomer) {
  const params = {
    address: encodeURIComponent(address),
    shop: shopDomain,
  };
  const path = `/customer/${customerId}`;
  await makeShopifyProxyRequest(path, params, "POST");
}
