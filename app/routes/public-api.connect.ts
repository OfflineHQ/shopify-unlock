import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader: LoaderFunction = async ({ request }) => {
  console.log({ method: request.method });
  // Your API logic goes here
  const data = {
    message: "Hello from the public API!",
  };

  return json(data);
};
