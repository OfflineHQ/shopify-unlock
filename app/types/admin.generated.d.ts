/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.d.ts';

export type CreateAppDataMetafieldMutationVariables = AdminTypes.Exact<{
  metafieldsSetInput: Array<AdminTypes.MetafieldsSetInput> | AdminTypes.MetafieldsSetInput;
}>;


export type CreateAppDataMetafieldMutation = { metafieldsSet?: AdminTypes.Maybe<{ metafields?: AdminTypes.Maybe<Array<Pick<AdminTypes.Metafield, 'key' | 'value'>>>, userErrors: Array<Pick<AdminTypes.MetafieldsSetUserError, 'field' | 'message'>> }> };

export type GetCurrentInstallationQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetCurrentInstallationQuery = { currentAppInstallation: Pick<AdminTypes.AppInstallation, 'id'> };

export type GetShopLocalesQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetShopLocalesQuery = { shopLocales: Array<Pick<AdminTypes.ShopLocale, 'locale' | 'primary' | 'published'>> };

export type PopulateProductMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.ProductInput;
}>;


export type PopulateProductMutation = { productCreate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id' | 'title' | 'handle' | 'status'>
      & { variants: { edges: Array<{ node: Pick<AdminTypes.ProductVariant, 'id' | 'price' | 'barcode' | 'createdAt'> }> } }
    )> }> };

export type ShopifyRemixTemplateUpdateVariantMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.ProductVariantInput;
}>;


export type ShopifyRemixTemplateUpdateVariantMutation = { productVariantUpdate?: AdminTypes.Maybe<{ productVariant?: AdminTypes.Maybe<Pick<AdminTypes.ProductVariant, 'id' | 'price' | 'barcode' | 'createdAt'>> }> };

interface GeneratedQueryTypes {
  "#graphql\nquery GetCurrentInstallation {\n  currentAppInstallation {\n    id\n  }\n}\n": {return: GetCurrentInstallationQuery, variables: GetCurrentInstallationQueryVariables},
  "#graphql\n  query GetShopLocales {\n\tshopLocales {\n\t\tlocale\n\t\tprimary\n\t\tpublished\n    }\n  }\n": {return: GetShopLocalesQuery, variables: GetShopLocalesQueryVariables},
  "#graphql\n      query GetShopLocales {\n        shopLocales {\n          locale\n          primary\n          published\n        }\n      }\n    ": {return: GetShopLocalesQuery, variables: GetShopLocalesQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {\n  metafieldsSet(metafields: $metafieldsSetInput) {\n    metafields {\n      key\n      value\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}\n": {return: CreateAppDataMetafieldMutation, variables: CreateAppDataMetafieldMutationVariables},
  "#graphql\n      mutation populateProduct($input: ProductInput!) {\n        productCreate(input: $input) {\n          product {\n            id\n            title\n            handle\n            status\n            variants(first: 10) {\n              edges {\n                node {\n                  id\n                  price\n                  barcode\n                  createdAt\n                }\n              }\n            }\n          }\n        }\n      }": {return: PopulateProductMutation, variables: PopulateProductMutationVariables},
  "#graphql\n      mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {\n        productVariantUpdate(input: $input) {\n          productVariant {\n            id\n            price\n            barcode\n            createdAt\n          }\n        }\n      }": {return: ShopifyRemixTemplateUpdateVariantMutation, variables: ShopifyRemixTemplateUpdateVariantMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
