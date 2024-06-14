import { useAppBridge } from "@shopify/app-bridge-react";
import { Button } from "@shopify/polaris";
import type { Field } from "@shopify/react-form";
import { useCallback } from "react";
import type { Collection, Product } from "~/types/admin.types";

interface ProductField extends Field<Product[]> {
  value: Product[];
}
interface CollectionField extends Field<Collection[]> {
  value: Collection[];
}
interface TargetProductsOrCollectionsProps {
  products: ProductField;
  collections: CollectionField;
}

export const TargetProductsOrCollections = ({
  products,
  collections,
}: TargetProductsOrCollectionsProps) => {
  const shopify = useAppBridge();
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
      // @ts-ignore
      products.onChange(updatedSelection);
    }
  }, [shopify, products]);
  return <Button onClick={selectProducts}>Select Products</Button>;
};
