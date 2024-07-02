import IframeResizer from "@iframe-resizer/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSelector } from "@xstate/react";
import type { IFramePage } from "iframe-resizer";
import { useEffect, useMemo } from "react";
import type { SettingsCssVariables } from "~/types";
import { AuthMachineContext, AuthMachineProvider } from "./AuthMachineProvider";
import type { UnlockIframeActor } from "./machines/unlockIframeMachine";
import type { Customer } from "./schema";
import { UnlockIframeStatus } from "./types";
import { hexToHsl } from "./utils/colors";

export interface AppConnectProps {
  customer?: Customer;
  loginUrl?: string;
  settingsCssVariables: SettingsCssVariables;
}

const App = ({ settingsCssVariables, customer, loginUrl }: AppConnectProps) => {
  const authActorRef = AuthMachineContext.useActorRef();
  const unlockIframeRef = authActorRef.system.get(
    "unlockIframe",
  ) as UnlockIframeActor;
  const isChildIframeReady = useSelector(
    unlockIframeRef,
    (snapshot) => snapshot.context.childIsReady,
  );
  const walletAddress = AuthMachineContext.useSelector(
    (snapshot) => snapshot.context.walletAddress,
  );
  const isInitMessageToIframeNotSent = AuthMachineContext.useSelector(
    (snapshot) => !snapshot.context.initMessageToIframeSent,
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

  useEffect(() => {
    if (isChildIframeReady && isInitMessageToIframeNotSent) {
      let dataToSend = {
        customer,
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
    console.log("App init data connect", { customer });
    authActorRef.send({
      type: "SET_INIT_DATA",
      customerId: customer?.id,
    });
  }, [customer?.id]);

  // Memoize the iframe to prevent re-renders
  const walletConnectIframe = useMemo(() => {
    if (isIframeIdle) {
      return null;
    }
    const unlockAppUrl = process.env.UNLOCK_APP_URL;
    //TODO. Find new URL for simple connect ?
    const baseUrl = `${unlockAppUrl}/en/shopify/`;
    let src = baseUrl;
    if (walletAddress) {
      src += `/${walletAddress}`;
    }
    return (
      <IframeResizer
        license="GPLv3"
        className="offline--iframe"
        forwardRef={(iframeRef: IFramePage) => {
          unlockIframeRef.send({
            type: "IFRAME_LOADED",
            iframeRef,
          });
        }}
        tabIndex={0}
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
    );
  }, [isIframeIdle]); // make sure to load the iframe only once

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

export const AppConnect = ({
  settingsCssVariables,
  customer,
  loginUrl,
}: AppConnectProps) => {
  console.log("App gates:", window.myAppGates);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthMachineProvider>
        <App
          settingsCssVariables={settingsCssVariables}
          customer={customer}
          loginUrl={loginUrl}
        />
      </AuthMachineProvider>
    </QueryClientProvider>
  );
};
const queryClient = new QueryClient();
