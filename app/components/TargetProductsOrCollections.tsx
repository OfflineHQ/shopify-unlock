import { useAppBridge } from "@shopify/app-bridge-react";
import { Button } from "@shopify/polaris";
import { useCallback } from "react";

export const TargetProductsOrCollections = ({ products }) => {
  const shopify = useAppBridge();
  const selectProducts = useCallback(async () => {
    console.log({ products:products.value });
    const updatedSelection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      selectionIds: products.value.map((product) => ({ id: product.id, variants: product.variants })),
    });

    if (updatedSelection) {
      console.log({ updatedSelection });
      products.onChange(updatedSelection);
    }
  }, [shopify, products]);
  return (
    <Button onClick={selectProducts}>
      Select Products
    </Button>
  );
};