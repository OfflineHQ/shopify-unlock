export default function getShopDomain(request: Request) {
  const shopDomain = request.url.split("/").pop();
  return shopDomain as string;
}
