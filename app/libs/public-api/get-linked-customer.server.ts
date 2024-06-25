import { json } from "@remix-run/node";
import getLinkedCustomerProxy from "./proxy-request/get-linked-customer.server";
import type { StorefrontRequest } from "./types";

export type GetLinkedCustomer = StorefrontRequest;

export default async function getLinkedCustomer({
  customerId,
  shopDomain,
}: GetLinkedCustomer) {
  try {
    const linkedCustomer = await getLinkedCustomerProxy({
      customerId,
      shopDomain,
    });
    console.log("Linked customer:", linkedCustomer);
    return json(linkedCustomer, { status: 200 });
  } catch (error) {
    console.error("Error getting linked customer:", error);
    if (error instanceof Error) {
      return json(
        { message: error.message },
        { status: (error as any).statusCode || 500 },
      );
    }
    return json({ message: "Internal server error" }, { status: 500 });
  }
}
