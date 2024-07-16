import IframeResizer from "@iframe-resizer/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@udecode/cn";
import { useSelector } from "@xstate/react";
import type { IFramePage } from "iframe-resizer";
import { useEffect, useMemo } from "react";
import { SettingsCssVariables, ShopifyCustomerStatus } from "~/types";
import { AuthMachineContext, AuthMachineProvider } from "./AuthMachineProvider";
import { getGate } from "./gate";
import type { UnlockIframeActor } from "./machines/unlockIframeMachine";
import type { Customer, Product } from "./schema";
import { UnlockIframeStatus } from "./types";
import { hexToHsl } from "./utils/colors";

export interface AppConnectProps {
  customer: Customer;
  loginUrl: string;
  settingsCssVariables: SettingsCssVariables;
  signUpCTAText: string;
  product: Product | null;
  linkedCustomerAddress: string | null;
  onConnected: () => void;
}

const App = ({
  settingsCssVariables,
  customer,
  signUpCTAText,
  product,
  loginUrl,
  linkedCustomerAddress,
  onConnected,
}: AppConnectProps) => {
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

  const isConnected = useSelector(authActorRef, (snapshot) =>
    snapshot.matches(ShopifyCustomerStatus.Connected),
  );

  useEffect(() => {
    if (isConnected) {
      onConnected();
    }
  }, [isConnected, onConnected]);

  const { reaction, configuration } = getGate();
  const gateId = configuration?.id?.split("/").pop() || undefined;

  console.log("authActorRef:", authActorRef);
  console.log("unlockIframeRef", unlockIframeRef);
  console.log("isIframeIdle:", isIframeIdle);
  console.log("isConnected:", isConnected);

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
        additionalData: {
          signUpCTAText,
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
      linkedCustomer: {
        address: linkedCustomerAddress,
      },
      productId: product?.id,
      gateId,
    });
  }, [customer?.id, gateId, product?.id]);

  // Memoize the iframe to prevent re-renders
  const walletConnectIframe = useMemo(() => {
    if (isIframeIdle) {
      return null;
    }
    const unlockAppUrl = process.env.UNLOCK_APP_URL;
    //TODO. Find new URL for simple connect ?
    const baseUrl = `${unlockAppUrl}/shopify/v1/connect`;
    let src = baseUrl;
    return (
      <IframeResizer
        license="GPLv3"
        forwardRef={(iframeRef: IFramePage) => {
          unlockIframeRef.send({
            type: "IFRAME_LOADED",
            iframeRef,
          });
        }}
        allow="publickey-credentials-get; publickey-credentials-create"
        height={settingsCssVariables.offline_button_height}
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
        style={{
          width: "100%",
          border: "none",
          padding: 0,
          pointerEvents: "auto",
          backgroundColor: "transparent",
        }}
      />
    );
  }, [isIframeIdle]); // make sure to load the iframe only once

  return (
    <div
      style={{
        maxWidth: settingsCssVariables.offline_max_width || "100%",
        height: settingsCssVariables.offline_button_height,
      }}
      className="offline-w-full offline-relative"
    >
      {walletConnectIframe}
      {!isChildIframeReady && (
        <div
          className={cn(
            "offline-absolute offline-inset-0 offline-z-10",
            "offline-animate-pulse offline-rounded-md offline-bg-muted",
            `offline-h-[${settingsCssVariables.offline_button_height}]`,
          )}
        />
      )}
    </div>
  );
};

export const AppConnect = (props: AppConnectProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthMachineProvider>
        <App {...props} />
      </AuthMachineProvider>
    </QueryClientProvider>
  );
};
const queryClient = new QueryClient();
