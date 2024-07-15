import { makeShopifyProxyRequest } from "./make-shopify-request.server";

interface GetLinkedCustomer {
  customerId: string;
  shopDomain: string;
}

export interface GetLinkedCustomerResponse {
  address: string | null;
}

export default async function getLinkedCustomer({
  customerId,
  shopDomain,
}: GetLinkedCustomer) {
  const params = {
    shop: shopDomain,
  };
  const path = `/customer/${customerId}`;
  const res = await makeShopifyProxyRequest<GetLinkedCustomerResponse>(
    path,
    params,
  );
  return { address: res?.address || null };
}
