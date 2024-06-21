import { makeShopifyProxyRequest } from "./make-shopify-request.server";

interface GetLinkedCustomer {
  customerId: string;
  shopDomain: string;
}

export interface GetLinkedCustomerResponse {
  address?: string;
}

export default async function getLinkedCustomer({
  customerId,
  shopDomain,
}: GetLinkedCustomer) {
  const params = {
    shop: shopDomain,
  };
  const path = `/customer/${customerId}`;
  return makeShopifyProxyRequest<GetLinkedCustomerResponse>(path, params);
}
