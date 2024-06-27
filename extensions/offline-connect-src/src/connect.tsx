import ReactDOM from "react-dom/client";

import "./index.css";

import { AppConnect } from "./AppConnect";

const container = document.getElementById("offline-connect");
if (container) {
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
  ReactDOM.createRoot(container).render(
    <AppConnect
      settingsCssVariables={settingsCssVariables}
      customer={customer}
      loginUrl={container.dataset.account_login_url}
    />,
  );
}
