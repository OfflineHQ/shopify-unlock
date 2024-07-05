import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import ConnectModalUI from "~/components/connect-modal/connect-modal-ui";
import { useMediaQuery } from "~/hooks/use-media-query";
import "~/styles/globals.css";
import { AppConnect } from "./AppConnect";

// Custom hook to manage drawer state
const useDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = (isOpen: boolean) => setIsOpen(isOpen);
  return { isOpen, open, close };
};

const ConnectModal: React.FC = () => {
  const { isOpen, open, close } = useDrawer();
  const [triggerContainer, setTriggerContainer] = useState<HTMLElement | null>(
    null,
  );
  const isDesktop = useMediaQuery("(min-width: 768px)");
  console.log("isDesktop 9", isDesktop);
  // const [product, setProduct] = useState<any>(null);
  const container = document.getElementById("offline-connect-modal");
  if (!container) return null;
  const triggerSelector = container.dataset.trigger_selector;

  useEffect(() => {
    const handleTriggerLoaded = (event: CustomEvent) => {
      console.log("event", event);
      if (!triggerSelector) return;
      const getContainer: HTMLElement | null = document.querySelector(
        triggerSelector.replace(/"/g, ""),
      );
      console.log("getContainer", getContainer);
      if (getContainer) setTriggerContainer(getContainer);
    };

    if (!triggerContainer && triggerSelector) {
      window.addEventListener(
        "offlineTriggerModalSetup",
        handleTriggerLoaded as EventListener,
      );
    }

    return () => {
      window.removeEventListener(
        "offlineTriggerModalSetup",
        handleTriggerLoaded as EventListener,
      );
    };
  }, [triggerContainer, triggerSelector]);

  useEffect(() => {
    setTriggerContainer(
      document.querySelector(
        triggerSelector?.replace(/"/g, "") || "",
      ) as HTMLElement,
    );
    // Expose the open function to the global scope
    window.offlineConnect = { openModal: open };
  }, [open]);

  const customer = container.dataset.customer_id
    ? {
        id: container.dataset.customer_id,
        email: container.dataset.customer_email,
        firstName: container.dataset.customer_first_name,
        lastName: container.dataset.customer_last_name,
      }
    : undefined;
  const customerWalletAddress = container.dataset.customer_wallet_address;
  if (triggerContainer && customer && !customerWalletAddress) {
    const settingsCssVariables = JSON.parse(
      triggerContainer.dataset.settings_css_variables || "{}",
    );

    const locale = container.dataset.locale;
    const defaultLocale = "EN";

    console.log("locale", locale);

    const signupContent = JSON.parse(container.dataset.signup_content || "{}");

    console.log("signupContent", signupContent);

    const product = triggerContainer.dataset.product_id
      ? {
          // @ts-ignore
          id: triggerContainer.dataset.product_id as string,
          // @ts-ignore
          title: triggerContainer.dataset.product_title as string,
          // @ts-ignore
          price: parseInt(triggerContainer.dataset.product_price as string),
          available: triggerContainer.dataset.product_available === "true",
        }
      : null;
    console.log(
      "customerWalletAddress",
      customerWalletAddress,
      "triggerContainer",
      triggerContainer,
      "product",
      product,
    );
    const signupContentLocale =
      locale && signupContent[locale?.toUpperCase()]
        ? signupContent[locale?.toUpperCase()]
        : signupContent[defaultLocale.toUpperCase()];
    return (
      <ConnectModalUI
        isDesktop={isDesktop}
        closeBtnClasses="button button--secondary"
        open={isOpen}
        onOpenChange={close}
        content={signupContentLocale.signUpContent}
        cta={
          <AppConnect
            settingsCssVariables={settingsCssVariables}
            customer={customer}
            signUpCTAText={signupContentLocale.signUpCTAText}
            product={product}
            loginUrl={container.dataset.account_login_url as string}
            linkedCustomerAddress={customerWalletAddress || null}
            onConnected={() => window.location.reload()} //TODO: query params for success to display something
          />
        }
        closeText={signupContentLocale.cancelText}
      />
    );
  }
  return null;
};

const container = document.getElementById("offline-connect-modal");
if (container) {
  ReactDOM.createRoot(container).render(<ConnectModal />);
}
