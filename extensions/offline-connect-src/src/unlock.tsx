import ReactDOM from "react-dom/client";

import "./index.css";

import { AppUnlock } from "./AppUnlock";

console.log({ myAppGates: window.myAppGates });

// The element ID is defined in app-block.liquid
const container = document.getElementById("offline-unlock");
if (window.myAppGates?.length > 0 && container) {
  const settingsCssVariables = JSON.parse(
    container.dataset.settings_css_variables || "{}",
  );
  let customer;
  if (container.dataset.customer_id) {
    customer = {
      id: container.dataset.customer_id,
      email: container.dataset.customer_email,
      firstName: container.dataset.customer_first_name,
      lastName: container.dataset.customer_last_name,
    };
  }
  let product = {
    id: container.dataset.product_id as string,
    title: container.dataset.product_title as string,
    available: container.dataset.product_available === "true",
    price: parseFloat(container.dataset.product_price || "0"),
  };
  ReactDOM.createRoot(container).render(
    <AppUnlock
      settingsCssVariables={settingsCssVariables}
      customer={customer}
      loginUrl={container.dataset.account_login_url}
      product={product}
    />,
  );
} else {
  if (container) container.innerHTML = "";
}
