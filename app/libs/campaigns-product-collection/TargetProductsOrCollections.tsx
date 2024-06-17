import { useAppBridge } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  InlineGrid,
  Text,
} from "@shopify/polaris";
import type { Field } from "@shopify/react-form";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Collection, Product } from "~/types/admin.types";
import SelectedProductsTable from "./SelectedProductsTable";

interface ProductField extends Field<Product[]> {
  value: Product[];
}
interface CollectionField extends Field<Collection[]> {
  value: Collection[];
}
interface TargetProductsOrCollectionsProps {
  products: ProductField;
  collections: CollectionField;
  isProductSelection: boolean | null;
  setIsProductSelection: Dispatch<SetStateAction<boolean | null>>;
}

export const TargetProductsOrCollections = ({
  products,
  collections,
  isProductSelection,
  setIsProductSelection,
}: TargetProductsOrCollectionsProps) => {
  const shopify = useAppBridge();
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    products.value.map((product) => product.id),
  );

  const selectProducts = useCallback(async () => {
    console.log({ products: products.value });
    const updatedSelection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      filter: {
        variants: false,
      },
      selectionIds: products.value.map((product) => ({
        id: product.id,
      })),
    });

    if (updatedSelection) {
      console.log("Updated selection", updatedSelection);
      // @ts-ignore
      products.onChange(updatedSelection);
      setIsProductSelection(true);
      setSelectedProducts(
        updatedSelection.map((product: Product) => product.id),
      );
    }
  }, [shopify, products, setIsProductSelection]);

  const selectCollections = useCallback(async () => {
    console.log({ collections: collections.value });
    const updatedSelection = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
      action: "select",
      selectionIds: collections.value.map((collection) => ({
        id: collection.id,
      })),
    });
    if (updatedSelection) {
      // @ts-ignore
      collections.onChange(updatedSelection);
      setIsProductSelection(false);
    }
  }, [shopify, collections, setIsProductSelection]);

  useEffect(() => {
    if (products.value.length > 0 || collections.value.length > 0) {
      setIsProductSelection(products.value.length > 0);
    }
  }, [products.value, collections.value, setIsProductSelection]);

  function clearSelection() {
    console.log("Clearing selection");
    products.reset();
    collections.reset();
    setIsProductSelection(null);
    setSelectedProducts([]);
  }

  return (
    <Card roundedAbove="sm" background="bg-surface-secondary">
      <BlockStack gap="200">
        <InlineGrid columns="1fr auto">
          <Text as="h3" variant="headingLg">
            Target Products or Collections
          </Text>
          {isProductSelection === null ? (
            <ButtonGroup>
              <Button variant="plain" onClick={selectCollections}>
                Select Collections
              </Button>
              <Button variant="plain" onClick={selectProducts}>
                Select Products
              </Button>
            </ButtonGroup>
          ) : (
            <ButtonGroup>
              <Button
                variant="plain"
                onClick={
                  isProductSelection ? selectProducts : selectCollections
                }
              >
                {isProductSelection ? "Add Products" : "Add Collections"}
              </Button>
              <Button variant="plain" onClick={clearSelection}>
                Clear
              </Button>
            </ButtonGroup>
          )}
        </InlineGrid>
      </BlockStack>
      <Box paddingBlockStart="200" paddingBlockEnd="400">
        <Text as="p" variant="bodyLg" tone="subdued">
          Select the products or collections that will be targeted for those
          perks in your campaign.
          <br />
          <br />
          Please note that you cannot have the same product or collection
          selected twice in the same campaign.
        </Text>
      </Box>
      <Divider />
      <Box paddingBlockStart="400" paddingBlockEnd="400">
        {isProductSelection === null ? (
          <InlineGrid gap="800" columns={2}>
            <Button onClick={selectCollections}>Select Collections</Button>
            <Button variant="primary" onClick={selectProducts}>
              Select Products
            </Button>
          </InlineGrid>
        ) : (
          isProductSelection &&
          products.value.length > 0 && (
            <SelectedProductsTable
              products={products.value}
              selectedProducts={selectedProducts}
              setSelectedProducts={setSelectedProducts}
            />
          )
        )}
      </Box>
    </Card>
  );
};
