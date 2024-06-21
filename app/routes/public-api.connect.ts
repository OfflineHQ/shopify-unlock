import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export const loader: LoaderFunction = async ({ request }) => {
  const { storefront, liquid } = await authenticate.public.appProxy(request);

  if (!storefront) {
    return new Response();
  }
  // Your API logic goes here
  const data = {
    message: "Hello from the public API!",
  };

  return json(data);
};
