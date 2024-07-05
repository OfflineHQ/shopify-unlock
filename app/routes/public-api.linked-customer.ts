import { type LoaderFunctionArgs } from "@remix-run/node";
import getCustomerWalletAddress from "~/libs/customers/get-customer-metafield-wallet.server";
import getLinkedCustomer from "~/libs/public-api/get-linked-customer.server";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, storefront, session } =
    await authenticate.public.appProxy(request);
  console.log({ storefront, session });
  const { searchParams } = new URL(request.url);
  const loggedInCustomerId = searchParams.get("logged_in_customer_id");
  console.log({ session, loggedInCustomerId });

  if (!storefront || !loggedInCustomerId || !session) {
    return new Response();
  }
  try {
    const address = await getCustomerWalletAddress({
      graphql: admin.graphql,
      customerId: loggedInCustomerId,
    });
    return new Response(JSON.stringify({ address }));
  } catch (error) {
    console.error(error);
    return getLinkedCustomer({
      customerId: loggedInCustomerId,
      shopDomain: session.shop,
    });
  }
};
