import ReactDOM from "react-dom/client";

import { AppUnlock } from "./AppUnlock";

// The element ID is defined in app-block.liquid
const container = document.getElementById("offline-unlock");
const customerWalletAddress = container?.dataset.customer_wallet_address;
const formattedOriginalPrice = container?.dataset.formatted_original_price;
if (
  window.myAppGates?.length > 0 &&
  customerWalletAddress &&
  container &&
  container.dataset.customer_id &&
  container.dataset.locale &&
  formattedOriginalPrice
) {
  const locale = container.dataset.locale.toUpperCase();
  const customer = {
    id: container.dataset.customer_id,
    email: container.dataset.customer_email,
    firstName: container.dataset.customer_first_name,
    lastName: container.dataset.customer_last_name,
  };
  const product = {
    id: container.dataset.product_id as string,
    title: container.dataset.product_title as string,
    available: container.dataset.product_available === "true",
    price: parseFloat(container.dataset.product_price || "0"),
  };
  ReactDOM.createRoot(container).render(
    <AppUnlock
      customer={customer}
      product={product}
      walletAddress={customerWalletAddress}
      formattedOriginalPrice={formattedOriginalPrice}
    />,
  );
} else {
  if (container) container.innerHTML = "";
}
