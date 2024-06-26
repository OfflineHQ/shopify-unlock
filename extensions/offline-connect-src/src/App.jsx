import IframeResizer from "@iframe-resizer/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector } from "@xstate/react";
import { useEffect, useMemo } from "react";
import { AuthMachineContext, AuthMachineProvider } from "./AuthMachineProvider";
import { disableBuyButtons, enableBuyButtons, getGate } from "./gate";
import { UnlockIframeStatus } from "./machines/unlockIframeMachine";
import { hexToHsl } from "./utils/colors";

// const UNLOCK_APP_URL = process.env.UNLOCK_APP_URL;

const _App = ({ settingsCssVariables, customer, loginUrl, product }) => {
  const authActorRef = AuthMachineContext.useActorRef();
  const unlockIframeRef = authActorRef.system.get("unlockIframe");
  const isChildIframeReady = useSelector(
    unlockIframeRef,
    (snapshot) => snapshot.context.childIsReady,
  );
  const walletAddress = AuthMachineContext.useSelector(
    (snapshot) => snapshot.context.walletAddress,
  );
  const isReconnected = AuthMachineContext.useSelector(
    (snapshot) => snapshot.context.isReconnected,
  );
  const isInitMessageToIframeNotSent = AuthMachineContext.useSelector(
    (snapshot) => !snapshot.context.initMessageToIframeSent,
  );
  const isUnlocked = AuthMachineContext.useSelector(
    (snapshot) => snapshot.context.isUnlocked,
  );
  const isIframeIdle = useSelector(unlockIframeRef, (snapshot) =>
    snapshot.matches(UnlockIframeStatus.Idle),
  );

  console.log("authActorRef:", authActorRef);
  console.log("unlockIframeRef", unlockIframeRef);
  console.log("isIframeIdle:", isIframeIdle);

  unlockIframeRef.on("CONNECT_TO_SHOPIFY", () => {
    if (loginUrl) window.location.href = loginUrl; // Directly setting the window location to navigate
  });

  const {
    requirements,
    reaction,
    configuration: { id: gateConfigurationGid },
  } = getGate();
  const gateId = gateConfigurationGid.split("/").pop();
  useEffect(() => {
    if (isChildIframeReady && isInitMessageToIframeNotSent) {
      let dataToSend = {
        customer,
        product,
        cssVariablesAndClasses: {
          cssVariables: {
            "--primary": hexToHsl(settingsCssVariables.offline_primary_color),
            "--secondary": hexToHsl(
              settingsCssVariables.offline_secondary_color,
            ),
            "--radius": settingsCssVariables.offline_border_radius,
            "--off-btn-height": settingsCssVariables.offline_button_height,
            "--off-btn-font-size":
              settingsCssVariables.offline_button_font_size,
            "--off-btn-letter-spacing":
              settingsCssVariables.offline_button_letter_spacing,
            "--off-btn-padding": settingsCssVariables.offline_button_padding,
            "--off-avatar-size": settingsCssVariables.offline_avatar_size,
            "--off-key-info-height":
              settingsCssVariables.offline_gate_status_banner_height,
          },
          classes: "",
          fontFamily: settingsCssVariables.offline_font_family,
        },
      };
      authActorRef.send({
        type: "SEND_MESSAGE_TO_IFRAME",
        ...dataToSend,
      });
    }
  }, [isChildIframeReady, isInitMessageToIframeNotSent]);

  useEffect(() => {
    console.log("App init data test67", { customer, product, gateId });
    if (product?.id && gateId) {
      authActorRef.send({
        type: "SET_INIT_DATA",
        customerId: customer?.id,
        productId: product?.id,
        gateId,
      });
    }
  }, [customer?.id, gateId, product?.id]);

  useEffect(() => {
    console.log("isUnlocked effect: ", isUnlocked, reaction);
    if (reaction?.type === "exclusive_access") {
      if (isUnlocked) {
        enableBuyButtons();
      } else {
        disableBuyButtons();
      }
    }
  }, [gateId, reaction?.type, isUnlocked]);

  // Memoize the iframe to prevent re-renders
  const walletConnectIframe = useMemo(() => {
    console.log({ gateId, unlockIframeRef, isIframeIdle });
    if (!gateId || isIframeIdle) {
      return null;
    }
    const unlockAppUrl = process.env.UNLOCK_APP_URL;
    const baseUrl = `${unlockAppUrl}/en/shopify/${gateId}`;
    let src = baseUrl;
    if (walletAddress) {
      src += `/${walletAddress}`;
    }
    return (
      <IframeResizer
        license="GPLv3"
        className="offline--iframe"
        forwardRef={(iframeRef) => {
          unlockIframeRef.send({
            type: "IFRAME_LOADED",
            iframeRef,
          });
        }}
        // checkOrigin={
        //   UNLOCK_APP_URL?.startsWith("http://localhost")
        //     ? false
        //     : [
        //         UNLOCK_APP_URL,
        //         UNLOCK_APP_URL.includes("://www.")
        //           ? UNLOCK_APP_URL.replace("://www.", "://")
        //           : UNLOCK_APP_URL.replace("://", "://www."),
        //       ]
        // }
        tabIndex="0"
        inPageLinks
        onMessage={(messageData) => {
          console.log("Message received from iframe", messageData);
          if (messageData?.message?.type === "READY") {
            unlockIframeRef.send({
              type: "IFRAME_CHILD_IS_READY",
            });
          } else {
            unlockIframeRef.send({
              type: "RECEIVE_MESSAGE",
              message: messageData.message,
            });
          }
        }}
        src={src}
        style={{ width: "100%", height: "220px" }}
      />
      // <iframe
      //   title="Offline Unlock"
      //   id="unlockIframe"
      //   className="offline--iframe"
      //   allowFullScreen
      //   tabIndex="0" /* Make iframe focusable */
      //   width="100%"
      //   src={src}
      //   onLoad={() => {
      //     console.log("Shopify Host, iframe loaded");
      //     unlockIframeRef.send({ type: "IFRAME_LOADED" });
      //     // setupOfflineIframe();
      //   }}
      // />
    );
  }, [gateId, isIframeIdle]); // make sure to load the iframe only once unless gateId changes

  return (
    <div
      className="offline"
      style={{
        maxWidth: settingsCssVariables.offline_max_width || "100%",
      }}
    >
      <div className="offline--iframe-container">
        {walletConnectIframe}
        {!isChildIframeReady && (
          <div className="offline--skeleton">
            <div className="offline--skeleton-content" />
          </div>
        )}
      </div>
    </div>
  );
};

export const App = ({ settingsCssVariables, customer, loginUrl, product }) => {
  console.log("App gates:", window.myAppGate);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthMachineProvider>
        <_App
          settingsCssVariables={settingsCssVariables}
          customer={customer}
          loginUrl={loginUrl}
          product={product}
        />
      </AuthMachineProvider>
    </QueryClientProvider>
  );
};
const queryClient = new QueryClient();
