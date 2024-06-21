import { createHmac } from "crypto";

export default function getHmac(id: string) {
  const secret = process.env.OFFLINE_GATES_SHOPIFY_SECRET;
  if (!secret) {
    throw new Error(
      "OFFLINE_GATES_SHOPIFY_SECRET environment variable is not set",
    );
  }
  const hmac = createHmac("sha256", secret);
  hmac.update(id);
  const hmacDigest = hmac.digest("hex");
  return {
    id,
    hmac: hmacDigest,
  };
}
