/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type CreateAppMetafieldMutationVariables = AdminTypes.Exact<{
  metafieldsSetInput: Array<AdminTypes.MetafieldsSetInput> | AdminTypes.MetafieldsSetInput;
}>;


export type CreateAppMetafieldMutation = { metafieldsSet?: AdminTypes.Maybe<{ metafields?: AdminTypes.Maybe<Array<Pick<AdminTypes.Metafield, 'key' | 'value'>>>, userErrors: Array<Pick<AdminTypes.MetafieldsSetUserError, 'field' | 'message'>> }> };

export type GetAppMetafieldQueryVariables = AdminTypes.Exact<{
  namespace: AdminTypes.Scalars['String']['input'];
  key: AdminTypes.Scalars['String']['input'];
}>;


export type GetAppMetafieldQuery = { currentAppInstallation: { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> } };

export type GetCurrentInstallationQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetCurrentInstallationQuery = { currentAppInstallation: Pick<AdminTypes.AppInstallation, 'id'> };

export type GetAppNamespaceMetafieldsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetAppNamespaceMetafieldsQuery = { currentAppInstallation: (
    Pick<AdminTypes.AppInstallation, 'id'>
    & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'key' | 'value'>> }
  ) };

export type DiscountAutomaticDeleteMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type DiscountAutomaticDeleteMutation = { discountAutomaticDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.DiscountAutomaticDeletePayload, 'deletedAutomaticDiscountId'>
    & { userErrors: Array<Pick<AdminTypes.DiscountUserError, 'message'>> }
  )> };

export type CreateAutomaticDiscountMutationVariables = AdminTypes.Exact<{
  discount: AdminTypes.DiscountAutomaticAppInput;
}>;


export type CreateAutomaticDiscountMutation = { discountCreate?: AdminTypes.Maybe<{ automaticAppDiscount?: AdminTypes.Maybe<Pick<AdminTypes.DiscountAutomaticApp, 'discountId'>>, userErrors: Array<Pick<AdminTypes.DiscountUserError, 'code' | 'message' | 'field'>> }> };

export type GateConfigurationUpdateMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
  metafields: Array<AdminTypes.MetafieldInput> | AdminTypes.MetafieldInput;
}>;


export type GateConfigurationUpdateMutation = { gateConfigurationUpdate?: AdminTypes.Maybe<{ gateConfiguration?: AdminTypes.Maybe<Pick<AdminTypes.GateConfiguration, 'id'>>, userErrors: Array<Pick<AdminTypes.GateConfigurationUserError, 'message'>> }> };

export type ProductSubjectDeleteMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.GateSubjectDeleteInput;
}>;


export type ProductSubjectDeleteMutation = { gateSubjectDelete?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.GateSubjectUserError, 'field' | 'message'>> }> };

export type GateConfigurationDeleteMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.GateConfigurationDeleteInput;
}>;


export type GateConfigurationDeleteMutation = { gateConfigurationDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.GateConfigurationDeletePayload, 'deletedGateConfigurationId'>
    & { userErrors: Array<Pick<AdminTypes.GateConfigurationUserError, 'field' | 'message'>> }
  )> };

export type GetGateConfigurationsQueryVariables = AdminTypes.Exact<{
  query: AdminTypes.Scalars['String']['input'];
  first: AdminTypes.Scalars['Int']['input'];
}>;


export type GetGateConfigurationsQuery = { gateConfigurations?: AdminTypes.Maybe<{ nodes: Array<(
      Pick<AdminTypes.GateConfiguration, 'id' | 'name' | 'handle' | 'createdAt' | 'updatedAt'>
      & { requirements?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, reaction?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, discountId?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, orderLimit?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, subjectBindings: { nodes: Array<(
          Pick<AdminTypes.GateSubject, 'id' | 'active'>
          & { subject: Pick<AdminTypes.Product, 'title' | 'id'> }
        )> } }
    )> }> };

export type RetrieveProductsGatesMinimalQueryVariables = AdminTypes.Exact<{
  queryString: AdminTypes.Scalars['String']['input'];
  first: AdminTypes.Scalars['Int']['input'];
}>;


export type RetrieveProductsGatesMinimalQuery = { products: { nodes: Array<(
      Pick<AdminTypes.Product, 'id'>
      & { gates: Array<(
        Pick<AdminTypes.GateSubject, 'id' | 'active'>
        & { configuration: Pick<AdminTypes.GateConfiguration, 'handle'> }
      )> }
    )> } };

export type CreateGateSubjectMutationVariables = AdminTypes.Exact<{
  gateConfigurationId: AdminTypes.Scalars['ID']['input'];
  subject: AdminTypes.Scalars['ID']['input'];
}>;


export type CreateGateSubjectMutation = { gateSubjectCreate?: AdminTypes.Maybe<{ gateSubject?: AdminTypes.Maybe<(
      Pick<AdminTypes.GateSubject, 'id' | 'createdAt' | 'updatedAt'>
      & { configuration: (
        Pick<AdminTypes.GateConfiguration, 'id' | 'name' | 'createdAt' | 'updatedAt'>
        & { requirements?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, reaction?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
      ) }
    )>, userErrors: Array<Pick<AdminTypes.GateSubjectUserError, 'field' | 'message'>> }> };

export type UpdateGateSubjectMutationVariables = AdminTypes.Exact<{
  gateConfigurationId: AdminTypes.Scalars['ID']['input'];
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type UpdateGateSubjectMutation = { gateSubjectUpdate?: AdminTypes.Maybe<{ gateSubject?: AdminTypes.Maybe<(
      Pick<AdminTypes.GateSubject, 'id' | 'createdAt' | 'updatedAt'>
      & { configuration: (
        Pick<AdminTypes.GateConfiguration, 'id' | 'name' | 'createdAt' | 'updatedAt'>
        & { requirements?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, reaction?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
      ) }
    )>, userErrors: Array<Pick<AdminTypes.GateSubjectUserError, 'field' | 'message'>> }> };

export type CreateGateConfigurationMutationVariables = AdminTypes.Exact<{
  name: AdminTypes.Scalars['String']['input'];
  requirements: AdminTypes.Scalars['String']['input'];
  reaction: AdminTypes.Scalars['String']['input'];
  orderLimit?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  gatesHandle?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type CreateGateConfigurationMutation = { gateConfigurationCreate?: AdminTypes.Maybe<{ gateConfiguration?: AdminTypes.Maybe<(
      Pick<AdminTypes.GateConfiguration, 'id' | 'name' | 'createdAt' | 'updatedAt'>
      & { metafields: { nodes: Array<Pick<AdminTypes.Metafield, 'key' | 'value' | 'namespace' | 'type'>> } }
    )>, userErrors: Array<Pick<AdminTypes.GateConfigurationUserError, 'field' | 'message'>> }> };

export type GetShopLocalesQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetShopLocalesQuery = { shopLocales: Array<Pick<AdminTypes.ShopLocale, 'locale' | 'name' | 'primary' | 'published'>> };

export type GetProductGateQueryVariables = AdminTypes.Exact<{
  productGid: AdminTypes.Scalars['ID']['input'];
}>;


export type GetProductGateQuery = { product?: AdminTypes.Maybe<{ gates: Array<(
      Pick<AdminTypes.GateSubject, 'id' | 'active'>
      & { configuration: (
        Pick<AdminTypes.GateConfiguration, 'id' | 'name' | 'handle'>
        & { requirements?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, reaction?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>>, orderLimit?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
      ) }
    )> }> };

interface GeneratedQueryTypes {
  "\n      #graphql\n      query GetAppMetafield($namespace: String!, $key: String!) {\n        currentAppInstallation {\n          metafield(namespace: $namespace, key: $key) {\n            value\n          }\n        }\n      }\n    ": {return: GetAppMetafieldQuery, variables: GetAppMetafieldQueryVariables},
  "#graphql\nquery GetCurrentInstallation {\n  currentAppInstallation {\n    id\n  }\n}\n": {return: GetCurrentInstallationQuery, variables: GetCurrentInstallationQueryVariables},
  "#graphql\nquery GetAppNamespaceMetafields {\n  currentAppInstallation {\n    id\n    metafield(key: \"offline_handle\", namespace: \"offline\") {\n      key\n      value\n    }\n  }\n}\n": {return: GetAppNamespaceMetafieldsQuery, variables: GetAppNamespaceMetafieldsQueryVariables},
  "#graphql\n  query GetGateConfigurations($query: String!, $first: Int!) {\n    gateConfigurations(query: $query, first: $first) {\n      nodes {\n        id\n        name\n        handle\n        requirements: metafield(namespace: \"offline-gate\",\n          key: \"requirements\") {\n            value\n        }\n        reaction: metafield(namespace: \"offline-gate\",\n          key: \"reaction\") {\n            value\n        }\n        discountId: metafield(namespace: \"offline-gate\",\n          key: \"discount-id\") {\n            value\n        }\n        orderLimit: metafield(namespace: \"offline-gate\",\n          key: \"orderLimit\") {\n            value\n        }\n        subjectBindings(first: $first, includeInactive: true) {\n          nodes {\n            id\n            active\n\t    subject {\n\t\t... on Product {\n\t\t\ttitle\n\t\t\tid\n\t\t}\n\t    }\n          }\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": {return: GetGateConfigurationsQuery, variables: GetGateConfigurationsQueryVariables},
  "#graphql\nquery RetrieveProductsGatesMinimal($queryString: String!, $first: Int!){\n  products(query: $queryString, first: $first) {\n    nodes {\n      id\n      gates(includeInactive: true) {\n        id\n        active\n        configuration {\n          handle\n        }\n      }\n    }\n  }\n}\n": {return: RetrieveProductsGatesMinimalQuery, variables: RetrieveProductsGatesMinimalQueryVariables},
  "#graphql\n  query GetShopLocales {\n\tshopLocales {\n\t\tlocale\n    name\n\t\tprimary\n\t\tpublished\n    }\n  }\n": {return: GetShopLocalesQuery, variables: GetShopLocalesQueryVariables},
  "#graphql\n  query GetProductGate($productGid: ID!) {\n\tproduct(id: $productGid) {\n      gates(includeInactive: true) {\n        id\n        active\n        configuration {\n          id\n          name\n          handle\n          requirements: metafield(namespace: \"offline-gate\",\n            key: \"requirements\") {\n              value\n          }\n          reaction: metafield(namespace: \"offline-gate\",\n            key: \"reaction\") {\n              value\n          }\n          orderLimit: metafield(namespace: \"offline-gate\", key: \"orderLimit\") {\n            value\n          }\n        }\n      }\n    }\n  }": {return: GetProductGateQuery, variables: GetProductGateQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation CreateAppMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {\n  metafieldsSet(metafields: $metafieldsSetInput) {\n    metafields {\n      key\n      value\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}\n": {return: CreateAppMetafieldMutation, variables: CreateAppMetafieldMutationVariables},
  "#graphql\nmutation DiscountAutomaticDelete($id: ID!) {\n  discountAutomaticDelete(id: $id) {\n    deletedAutomaticDiscountId\n    userErrors {\n      message\n    }\n  }\n}\n": {return: DiscountAutomaticDeleteMutation, variables: DiscountAutomaticDeleteMutationVariables},
  "#graphql\n  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {\n    discountCreate: discountAutomaticAppCreate(\n      automaticAppDiscount: $discount\n    ) {\n      automaticAppDiscount {\n        discountId\n      }\n      userErrors {\n        code\n        message\n        field\n      }\n    }\n  }\n": {return: CreateAutomaticDiscountMutation, variables: CreateAutomaticDiscountMutationVariables},
  "#graphql\nmutation gateConfigurationUpdate($id: ID!, $metafields: [MetafieldInput!]!) {\n  gateConfigurationUpdate(input: {\n\tid: $id\n\tmetafields: $metafields\n  }) {\n    gateConfiguration {\n      id\n    }\n\tuserErrors {\n\t\tmessage\n\t}\n  }\n}\n": {return: GateConfigurationUpdateMutation, variables: GateConfigurationUpdateMutationVariables},
  "#graphql\nmutation ProductSubjectDelete($input: GateSubjectDeleteInput!) {\n\tgateSubjectDelete(input: $input) {\n    \tuserErrors {\n    \t  field\n    \t  message\n    \t}\n  }\n}\n": {return: ProductSubjectDeleteMutation, variables: ProductSubjectDeleteMutationVariables},
  "#graphql\nmutation GateConfigurationDelete($input: GateConfigurationDeleteInput!) {\n  gateConfigurationDelete(input: $input) {\n    userErrors {\n      field\n      message\n    }\n    deletedGateConfigurationId\n  }\n}\n": {return: GateConfigurationDeleteMutation, variables: GateConfigurationDeleteMutationVariables},
  "#graphql\n  mutation createGateSubject ($gateConfigurationId: ID!, $subject: ID!){\n    gateSubjectCreate(input: {\n      gateConfigurationId: $gateConfigurationId,\n      active: true,\n      subject: $subject\n    }) {\n      gateSubject {\n        id\n        configuration {\n          id\n          name\n          requirements: metafield(namespace: \"offline-gate\",\n            key: \"requirements\") {\n              value\n          }\n          reaction: metafield(namespace: \"offline-gate\",\n            key: \"reaction\") {\n              value\n          }\n          createdAt\n          updatedAt\n        }\n        createdAt\n        updatedAt\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreateGateSubjectMutation, variables: CreateGateSubjectMutationVariables},
  "#graphql\n  mutation updateGateSubject ($gateConfigurationId: ID!, $id: ID!){\n    gateSubjectUpdate(input: {\n      gateConfigurationId: $gateConfigurationId,\n      id: $id\n    }) {\n      gateSubject {\n        id\n        configuration {\n          id\n          name\n          requirements: metafield(namespace: \"offline-gate\",\n            key: \"requirements\") {\n              value\n          }\n          reaction: metafield(namespace: \"offline-gate\",\n            key: \"reaction\") {\n              value\n          }\n          createdAt\n          updatedAt\n        }\n        createdAt\n        updatedAt\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UpdateGateSubjectMutation, variables: UpdateGateSubjectMutationVariables},
  "#graphql\n  mutation CreateGateConfiguration($name: String!, $requirements: String!, $reaction: String!, $orderLimit: String, $gatesHandle: String) {\n    gateConfigurationCreate(input: {\n        name: $name,\n        metafields: [{\n          namespace: \"offline-gate\",\n          key: \"requirements\",\n          type: \"json\",\n          value: $requirements\n        },\n        {\n          namespace: \"offline-gate\",\n          key: \"reaction\",\n          type: \"json\",\n          value: $reaction\n        },\n        {\n          namespace: \"offline-gate\",\n          key: \"orderLimit\",\n          type: \"string\",\n          value: $orderLimit\n        }],\n        handle: $gatesHandle\n      }) {\n      gateConfiguration {\n        id\n        name\n        createdAt\n        updatedAt\n        metafields(namespace: \"offline-gate\", first: 10) {\n          nodes {\n            key\n            value\n            namespace\n            type\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreateGateConfigurationMutation, variables: CreateGateConfigurationMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
