import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

const PRODUCTS_QUERY = `#graphql
query RetrieveProductsGatesMinimal($queryString: String!, $first: Int!){
  products(query: $queryString, first: $first) {
    nodes {
      id
      gates(includeInactive: true) {
        id
        active
        configuration {
          handle
        }
      }
    }
  }
}
`;

interface GetProductsGatesMinimal {
  graphql: AdminGraphqlClient;
  productsGid: string[];
}

const generateProductsQueryString = (productGids: string[]) => {
  return productGids
    .map((productGid) => {
      const id = productGid.split("/").pop();
      return `(id:${id})`;
    })
    .join(" OR ");
};

export async function getProductsGatesMinimal({
  graphql,
  productsGid,
}: GetProductsGatesMinimal) {
  const res = await graphql(PRODUCTS_QUERY, {
    variables: {
      queryString: generateProductsQueryString(productsGid),
      first: 100,
    },
  });
  const productsResJson = await res.json();
  return productsResJson.data?.products?.nodes;
}
