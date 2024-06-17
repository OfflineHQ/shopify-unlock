import { IndexTable, Text, Thumbnail } from "@shopify/polaris";
import type { Dispatch, SetStateAction } from "react";
import React from "react";
import type { Product } from "~/types/admin.types";

interface SelectedProductsTableProps {
  products: Product[];
  selectedProducts: string[];
  setSelectedProducts: Dispatch<SetStateAction<string[]>>;
}

const SelectedProductsTable: React.FC<SelectedProductsTableProps> = ({
  products,
  selectedProducts,
  setSelectedProducts,
}) => {
  const resourceName = {
    singular: "product",
    plural: "products",
  };
  const rowMarkup = products.map(
    ({ id, title, images, handle, variants, totalInventory }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
        selected={selectedProducts?.includes(id)}
      >
        <IndexTable.Cell>
          <Thumbnail source={images?.[0]?.originalSrc || ""} alt={handle} />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {totalInventory}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {`${variants?.[0]?.price} €` || "N/A"}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={products.length}
      selectedItemsCount={selectedProducts.length}
      onSelectionChange={(selectionType, toggleType, selection, position) => {
        console.log({ selectionType, toggleType, selection, position });
        if (selectionType === "page") {
          setSelectedProducts(
            toggleType ? products.map((product) => product.id) : [],
          );
        } else if (selectionType === "single") {
          setSelectedProducts(
            toggleType
              ? [...selectedProducts, selection as string]
              : selectedProducts.filter((id) => id !== selection),
          );
        }
      }}
      headings={[
        { title: "Image" },
        { title: "Product Name" },
        { title: "Stock" },
        { title: "Price", alignment: "end" },
      ]}
    >
      {rowMarkup}
    </IndexTable>
  );
};

export default SelectedProductsTable;
