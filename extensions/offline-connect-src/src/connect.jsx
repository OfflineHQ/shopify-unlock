import React from "react";
import ReactDOM from "react-dom";

import "./index.css";

import { App } from "./App";

console.log({ myAppGates: window.myAppGates });

// The element ID is defined in app-block.liquid
const container = document.getElementById("offline-unlock");
if (window.myAppGates?.length > 0) {
  const settingsCssVariables = JSON.parse(
    container.dataset.settings_css_variables,
  );
  let customer = null;
  if (container.dataset.customer_id) {
    customer = {
      id: container.dataset.customer_id,
      email: container.dataset.customer_email,
      firstName: container.dataset.customer_first_name,
      lastName: container.dataset.customer_last_name,
    };
  }
  let product = {
    id: container.dataset.product_id,
    title: container.dataset.product_title,
    available: container.dataset.product_available === "true",
  };
  ReactDOM.createRoot(container).render(
    <App
      settingsCssVariables={settingsCssVariables}
      customer={customer}
      loginUrl={container.dataset.account_login_url}
      product={product}
    />,
  );
} else {
  container.innerHTML = "";
}
