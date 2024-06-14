import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

const GET_SHOP_LOCALES = `#graphql
  query GetShopLocales {
	shopLocales {
		locale
    name
		primary
		published
    }
  }
`;

export default async function getShopLocales(graphql: AdminGraphqlClient) {
  const res = await graphql(GET_SHOP_LOCALES);
  const resJson = await res.json();
  return resJson.data?.shopLocales;
}
