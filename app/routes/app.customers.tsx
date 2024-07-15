import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Badge, Button, IndexTable, Page, Text } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import type { IndexTableHeading } from "@shopify/polaris/build/ts/src/components/IndexTable";
import type { NonEmptyArray } from "@shopify/polaris/build/ts/src/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteWalletAddresses } from "~/libs/customers/delete-customers-metafield-wallet.server";
import type { CustomerWithWalletAddress } from "~/libs/customers/get-customers-with-wallet-address.server";
import { getCustomersWithWalletAddress } from "~/libs/customers/get-customers-with-wallet-address.server";
import { authenticate } from "~/shopify.server";

enum CustomerActionsEnum {
  DeassociateWalletAddresses = "DEASSOCIATE_WALLET_ADDRESSES",
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const {
    customers,
    action,
  }: { customers: CustomerWithWalletAddress[]; action: CustomerActionsEnum } =
    await request.json();

  switch (action) {
    case CustomerActionsEnum.DeassociateWalletAddresses:
      await deleteWalletAddresses({
        graphql: admin.graphql,
        customerIds: customers.map(
          (customer: CustomerWithWalletAddress) => customer.id,
        ),
      });
      break;
  }

  return json({ status: "success", action });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;

  const { customers, hasNextPage, endCursor } =
    await getCustomersWithWalletAddress({
      graphql: admin.graphql,
      cursor,
    });

  return json({ customers, hasNextPage, endCursor });
};

export default function Customers() {
  const { customers, hasNextPage, endCursor } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const isSubmitting = fetcher.state === "submitting";

  const customersWithWalletAddress = useMemo(
    () => customers.filter((customer) => customer.walletAddress),
    [customers],
  );

  const selectedCustomersWithWalletAddress = useMemo(
    () =>
      customersWithWalletAddress.filter((customer) =>
        selectedCustomers.includes(customer.id),
      ),
    [customersWithWalletAddress, selectedCustomers],
  );

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Action completed successfully");
      navigate("/app/customers");
    }
  }, [fetcher.data]);

  const handleBulkDeassociate = useCallback(() => {
    fetcher.submit(
      {
        customers: selectedCustomersWithWalletAddress,
        action: CustomerActionsEnum.DeassociateWalletAddresses,
      },
      { method: "POST", encType: "application/json" },
    );
  }, [selectedCustomersWithWalletAddress, fetcher]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      navigate(`/app/customers?cursor=${endCursor}`);
    }
  }, [hasNextPage, endCursor, navigate]);

  const handlePreviousPage = useCallback(() => {
    navigate(`/app/customers`);
  }, [navigate]);

  const resourceName = {
    singular: "customer",
    plural: "customers",
  };

  const tableHeadings: NonEmptyArray<IndexTableHeading> = [
    { title: "Email" },
    { title: "Wallet Address" },
  ];

  const rowMarkup = customers.map(({ id, email, walletAddress }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedCustomers.includes(id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {email}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{walletAddress || "—"}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  const promotedBulkActions =
    selectedCustomersWithWalletAddress.length > 0
      ? [
          {
            content: "De-associate Wallet Addresses",
            destructive: true,
            icon: DeleteIcon,
            onAction: handleBulkDeassociate,
          },
        ]
      : [];

  return (
    <Page
      title="Customers"
      primaryAction={{
        content: "Refresh",
        onAction: () => navigate("/app/customers"),
      }}
    >
      <IndexTable
        resourceName={resourceName}
        itemCount={customers.length}
        selectedItemsCount={selectedCustomers.length}
        onSelectionChange={(selectionType, toggleType, selection) => {
          if (selectionType === "page") {
            setSelectedCustomers(
              toggleType ? customers.map((customer) => customer.id) : [],
            );
          } else if (selectionType === "single") {
            setSelectedCustomers(
              toggleType
                ? [...selectedCustomers, selection as string]
                : selectedCustomers.filter(
                    (selected) => selected !== selection,
                  ),
            );
          }
        }}
        headings={tableHeadings}
        promotedBulkActions={promotedBulkActions}
        lastColumnSticky
        loading={isSubmitting}
      >
        {rowMarkup}
      </IndexTable>
      <div style={{ marginTop: "1rem" }}>
        <Badge progress={hasNextPage ? "incomplete" : "complete"}>
          {hasNextPage ? "More customers available" : "All customers loaded"}
        </Badge>
      </div>
      {hasNextPage && (
        <div style={{ marginTop: "1rem" }}>
          <Button onClick={handlePreviousPage}>Previous Page</Button>
          <Button onClick={handleNextPage}>Next Page</Button>
        </div>
      )}
    </Page>
  );
}
