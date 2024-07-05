import { from, interval } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import type { ActorRefFrom } from "xstate";

import {
  assertEvent,
  assign,
  fromObservable,
  fromPromise,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from "xstate";
import type { CssVariablesAndClasses } from "~/types";
import { ShopifyCustomerStatus } from "~/types";
import { connectWallet, gateContextClient } from "../gate";
import type { Customer, GateContext, LinkedCustomer, Product } from "../schema";
import { connectedSchema } from "../schema";
import offKeyMachine from "./offKeyMachine";
import unlockIframeMachine from "./unlockIframeMachine";

const pollConnectionState = fromObservable(({ input }) => {
  return interval(2000).pipe(
    switchMap(() => from(gateContextClient.read())),
    map((res) => {
      const event = {
        type: "CONNECTION_STATE_UPDATED",
        walletAddress: res?.walletAddress,
        walletVerificationMessage: res?.walletVerificationMessage,
        walletVerificationSignature: res?.walletVerificationSignature,
      };
      return event;
    }),
  );
});

const authMachine = setup({
  types: {
    context: {} as {
      initMessageToIframeSent: boolean;
      customerId?: string;
      productId?: string;
      gateId?: string;
      linkedCustomer: LinkedCustomer | null;
      walletAddress: string | null;
      fetchError?: Error;
      connectError?: Error;
      brandOffKeyRef: ActorRefFrom<typeof offKeyMachine> | null;
      isUnlocked: boolean;
    },
    events: {} as
      | {
          type: "SET_INIT_DATA";
          customerId?: string;
          productId?: string;
          gateId?: string;
          linkedCustomer: LinkedCustomer;
        }
      | {
          type: "CONNECT_WALLET";
          data: { address: string; message: string; signature: string };
        }
      | { type: "DISCONNECT" }
      | { type: "RETRY" }
      | {
          type: "SEND_MESSAGE_TO_IFRAME";
          customer?: Customer;
          product?: Product;
          cssVariablesAndClasses?: CssVariablesAndClasses;
          additionalData?: {
            signUpCTAText: string;
          };
        }
      | { type: "IFRAME_MESSAGE_RECEIVED"; data: { type: string; value?: any } }
      | { type: "UNLOCKED" }
      | {
          type: "CONNECTION_STATE_UPDATED";
          walletAddress: string | null;
          linkedCustomer: LinkedCustomer | null;
          walletVerificationMessage: string | null;
          walletVerificationSignature: string | null;
        },
    input: {} as {
      customerId: string;
      productId: string;
      gateId: string;
      error?: Error;
    },
  },
  actors: {
    initStoreSessionAndCustomer: fromPromise(
      async ({
        input,
      }: {
        input: {
          customerId: string | undefined;
          linkedCustomer: LinkedCustomer | null;
        };
      }) => {
        return initStoreSessionAndCustomer(input);
      },
    ),
    connectCustomerWallet: fromPromise(
      async ({ input }: { input: ConnectCustomerWalletInput }) => {
        return connectCustomerWallet(input);
      },
    ),
    disconnectCustomerWallet: fromPromise(async () => {
      return disconnectCustomerWallet();
    }),
    pollConnectionState,
  },
  actions: {
    setUnlocked: assign({ isUnlocked: true }),
    assignGateContext: assign({
      productId: ({ event }) => {
        assertEvent(event, "SET_INIT_DATA");
        return event.productId;
      },
      gateId: ({ event }) => {
        assertEvent(event, "SET_INIT_DATA");
        return event.gateId;
      },
    }),
    logError: ({ event }) => console.error(event),
    assignFetchError: assign({
      fetchError: ({ event }) => (event as any).error,
    }),
    assignConnectError: assign({
      connectError: ({ event }) => (event as any).error,
    }),
    reset: assign({
      linkedCustomer: null,
      walletAddress: null,
      isUnlocked: false,
    }),
    assignCustomerId: assign({
      customerId: ({ event }) => {
        assertEvent(event, "SET_INIT_DATA");
        return event.customerId;
      },
    }),
    assignLinkedCustomer: assign({
      linkedCustomer: ({ event }) => {
        assertEvent(event, ["SET_INIT_DATA"]);
        return event.linkedCustomer;
      },
    }),
    assignConnected: assign({
      linkedCustomer: ({ event }) => (event as any).output.linkedCustomer,
      walletAddress: ({ event }) => (event as any).output.walletAddress,
    }),
    assignDisconnected: assign({
      linkedCustomer: ({ event, context }) =>
        (event as any)?.output?.linkedCustomer || context.linkedCustomer,
      walletAddress: null,
      isUnlocked: false,
    }),
    // // Used here to trigger an assign to the iframe url the address of the wallet if the user is already connected
    // assignReconnected: assign({
    //   isReconnected: true,
    // }),
    // @ts-ignore
    spawnIframeActor: spawnChild(unlockIframeMachine, {
      id: "unlockIframe",
      systemId: "unlockIframe",
      input: ({ self }) => ({
        authParentRef: self,
      }),
    }),
    spawnOffKeyActor: assign({
      // @ts-ignore
      brandOffKeyRef: ({ spawn, context, self }) =>
        !context.brandOffKeyRef && context.gateId && context.productId
          ? // @ts-ignore
            spawn(offKeyMachine, {
              id: "brandOffKey",
              systemId: "brandOffKey",
              input: {
                authParentRef: self,
                walletAddress: context.walletAddress,
                productId: context.productId,
                gateId: context.gateId,
                customerId: context.customerId,
              },
            })
          : context.brandOffKeyRef,
    }),
    stopOffKeyActor: stopChild("brandOffKey"),
    deleteOffKeyActor: assign({
      brandOffKeyRef: null,
    }),
    // https://stately.ai/docs/system#cheatsheet-register-an-invoked-actor-with-the-system
    startUnlockIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      (_) => ({ type: "AUTH_INITIALIZED" }),
    ),
    sendDisconnectedStateToIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      ({ context, event }) => {
        return {
          type: "SEND_MESSAGE",
          data: {
            type: "ALL",
            value: {
              connectStatus: {
                status: ShopifyCustomerStatus.Disconnected,
                address: context.walletAddress,
              },
              linkedCustomer: context.linkedCustomer,
              customer: (event as any).customer,
              product: (event as any).product,
              cssVariablesAndClasses: (event as any).cssVariablesAndClasses,
              additionalData: (event as any).additionalData,
              offKeyStatus: {
                status: "",
              },
            },
          },
        };
      },
    ),
    sendConnectedStateToIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      ({ context, event }) => {
        const dataToSend = {
          connectStatus: {
            status: ShopifyCustomerStatus.Connected,
            address: context.walletAddress,
          },
          linkedCustomer: context.linkedCustomer,
          customer: (event as any).customer,
          product: (event as any).product,
          cssVariablesAndClasses: (event as any).cssVariablesAndClasses,
          additionalData: (event as any).additionalData,
        };
        console.log("sendConnectedStateToIframe", dataToSend);
        return {
          type: "SEND_MESSAGE",
          data: {
            type: "ALL",
            value: dataToSend,
          },
        };
      },
    ),
    assignInitMessageToIframeSent: assign({
      initMessageToIframeSent: true,
    }),
    setConnectedFromPoll: assign({
      walletAddress: ({ event }) => {
        assertEvent(event, "CONNECTION_STATE_UPDATED");
        return event.walletAddress;
      },
      linkedCustomer: ({ event }) => {
        assertEvent(event, "CONNECTION_STATE_UPDATED");
        return event.linkedCustomer;
      },
    }),
  },
  guards: {
    isConnected: ({ event }) => (event as any)?.output?.walletAddress,
    isDisconnected: ({ event }) => !(event as any)?.output?.walletAddress,
    haveNoCustomerId: ({ event }) => !(event as any)?.output?.customerId,
    initMessageToIframeNotSent: ({ context }) =>
      !context.initMessageToIframeSent,
    offKeyActorNotSpawned: ({ context }) => !context.brandOffKeyRef,
    connectionPollConnected: ({ event }) => {
      assertEvent(event, "CONNECTION_STATE_UPDATED");
      return (
        !!event.walletAddress &&
        !!event.linkedCustomer &&
        !!event.walletVerificationMessage &&
        !!event.walletVerificationSignature
      );
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgYgJIDEAlAQQFkBRAfQoGUbiBxKw8gYXNwDVyARAbQAMAXUSgADgHtYAS3TSJAO1EgAHogCMAJgA0IAJ4bNAXxO6FEiHGVosyyTLmLlahJoCcAOjcAOACwBmAFYAdn91APVvADYQ3QMEdXV-D19AsN8opICY4O8TEyA */
  id: "auth",
  initial: ShopifyCustomerStatus.Idle,
  context: {
    initMessageToIframeSent: false,
    customerId: undefined,
    productId: undefined,
    gateId: undefined,
    linkedCustomer: null,
    walletAddress: null,
    fetchError: undefined,
    connectError: undefined,
    brandOffKeyRef: null,
    isUnlocked: false,
    connectionPollRef: null,
  },
  // for systemId check https://dev.to/ibrocodes/unleashing-the-power-of-actors-in-frontend-application-development-a9b
  entry: ["spawnIframeActor"],
  on: {
    IFRAME_MESSAGE_RECEIVED: {
      actions: ({ event, self }) => {
        const { data } = event;
        console.log(
          "Received IFRAME_MESSAGE_RECEIVED event from iframe:",
          event,
        );
        if (!data || !data.type) {
          console.warn(
            "Received invalid message for IFRAME_MESSAGE_RECEIVED:",
            data,
          );
          return;
        }
        switch (data.type) {
          case "CONNECT_WALLET":
            self.send({
              type: "CONNECT_WALLET",
              data: data.value,
            });
            break;
          case "DISCONNECT":
            self.send({ type: "DISCONNECT" });
            break;
          default:
            console.warn(
              "Received unknown message type for IFRAME_MESSAGE_RECEIVED:",
              data,
            );
            break;
        }
      },
    },
  },
  states: {
    [ShopifyCustomerStatus.Idle]: {
      on: {
        SET_INIT_DATA: {
          target: ShopifyCustomerStatus.Initializing,
          actions: [
            "reset",
            "assignCustomerId",
            "assignLinkedCustomer",
            "assignGateContext",
          ],
        },
      },
    },
    [ShopifyCustomerStatus.Initializing]: {
      invoke: {
        src: "initStoreSessionAndCustomer",
        input: ({ context: { customerId, linkedCustomer } }) => ({
          customerId,
          linkedCustomer,
        }),
        onDone: [
          {
            target: ShopifyCustomerStatus.NoCustomer,
            guard: "haveNoCustomerId",
            actions: ["startUnlockIframe"],
          },
          {
            target: ShopifyCustomerStatus.Connected,
            guard: "isConnected",
            actions: ["assignConnected", "startUnlockIframe"],
          },
          {
            target: ShopifyCustomerStatus.Disconnected,
            actions: ["assignDisconnected", "startUnlockIframe"],
          },
        ],
        onError: {
          target: ShopifyCustomerStatus.FetchError,
          actions: ["assignFetchError"],
        },
      },
    },
    [ShopifyCustomerStatus.NoCustomer]: {
      type: "atomic", // steel need the iframe so not final
      on: {
        SEND_MESSAGE_TO_IFRAME: {
          actions: [
            "sendDisconnectedStateToIframe",
            "assignInitMessageToIframeSent",
          ],
          guard: "initMessageToIframeNotSent",
        },
      },
    },
    [ShopifyCustomerStatus.Disconnected]: {
      invoke: {
        src: "pollConnectionState",
        id: "connectionPoller",
        onSnapshot: {
          actions: ({ event, self }) => {
            if (!event.snapshot.context) {
              return;
            }
            const res = connectedSchema.safeParse(event.snapshot.context);
            if (!res.success) {
              return;
            }
            self.send({
              type: "CONNECTION_STATE_UPDATED",
              ...res.data,
            });
          },
        },
      },
      on: {
        CONNECT_WALLET: ShopifyCustomerStatus.Connecting,
        SEND_MESSAGE_TO_IFRAME: {
          actions: [
            "sendDisconnectedStateToIframe",
            "assignInitMessageToIframeSent",
          ],
          guard: "initMessageToIframeNotSent",
        },
        CONNECTION_STATE_UPDATED: [
          {
            guard: "connectionPollConnected",
            target: ShopifyCustomerStatus.Connected,
            actions: ["setConnectedFromPoll"],
          },
        ],
      },
    },
    [ShopifyCustomerStatus.Connecting]: {
      invoke: {
        src: "connectCustomerWallet",
        input: ({
          context: { linkedCustomer, customerId, productId, gateId },
          event,
        }) => {
          if (!linkedCustomer || !customerId) {
            throw new Error("linkedCustomer and customerId are required");
          }
          return {
            linkedCustomer,
            customerId,
            productId,
            gateId,
            data: (event as any).data,
          };
        },
        onDone: {
          target: ShopifyCustomerStatus.Connected,
          actions: ["assignConnected", "sendConnectedStateToIframe"],
        },
        onError: {
          target: ShopifyCustomerStatus.ConnectError,
          actions: "assignConnectError",
        },
      },
    },
    [ShopifyCustomerStatus.Connected]: {
      entry: ["spawnOffKeyActor"],
      on: {
        SEND_MESSAGE_TO_IFRAME: {
          actions: [
            "sendConnectedStateToIframe",
            "assignInitMessageToIframeSent",
          ],
          guard: "initMessageToIframeNotSent",
        },
        DISCONNECT: {
          target: ShopifyCustomerStatus.Disconnecting,
        },
        UNLOCKED: {
          actions: ["setUnlocked"],
        },
      },
    },
    [ShopifyCustomerStatus.Disconnecting]: {
      invoke: {
        src: "disconnectCustomerWallet",
        input: ({ context: { linkedCustomer }, event }) => {
          if (!linkedCustomer) {
            throw new Error("linkedCustomer is required");
          }
          return {
            linkedCustomer,
          };
        },
        onDone: {
          target: ShopifyCustomerStatus.Disconnected,
          actions: [
            "assignDisconnected",
            "stopOffKeyActor",
            "deleteOffKeyActor",
            "sendDisconnectedStateToIframe",
          ],
        },
        onError: {
          target: ShopifyCustomerStatus.Disconnected,
          actions: [
            "logError",
            "assignDisconnected",
            "stopOffKeyActor",
            "deleteOffKeyActor",
            "sendDisconnectedStateToIframe",
          ],
        },
      },
    },
    [ShopifyCustomerStatus.FetchError]: {
      on: {
        RETRY: ShopifyCustomerStatus.Initializing,
      },
    },
    [ShopifyCustomerStatus.ConnectError]: {
      on: {
        CONNECT_WALLET: ShopifyCustomerStatus.Connecting,
      },
    },
  },
});

export type AuthMachine = typeof authMachine;
export type AuthActor = ActorRefFrom<AuthMachine>;

export default authMachine;

async function initStoreSessionAndCustomer({
  customerId,
  linkedCustomer,
}: {
  customerId: string | undefined;
  linkedCustomer: LinkedCustomer | null;
}) {
  try {
    console.log("Initializing store session and customer", { customerId });

    const currentContext = await gateContextClient.read();
    console.log("Current context", currentContext);

    const needsReset = shouldResetSession({
      customerId,
      context: currentContext,
      linkedCustomer,
    });
    console.log("needsReset", needsReset);

    if (needsReset) {
      //TODO, may need to remove item from cart if correspond to the one with gate.
      await resetSession();
    }
    const updatedContext = needsReset
      ? await gateContextClient.read()
      : currentContext;
    console.log("updatedContext", updatedContext);
    return {
      walletAddress: updatedContext?.walletAddress,
      linkedCustomer,
      customerId: customerId || updatedContext?.walletVerificationMessage,
    };
  } catch (error) {
    console.error("Error initializing store session and customer:", error);
    throw error;
  }
}

function shouldResetSession({
  customerId,
  context,
  linkedCustomer,
}: {
  customerId: string | undefined;
  context: GateContext | null;
  linkedCustomer: LinkedCustomer | null;
}): boolean {
  // We need to reset the session if:
  return (
    // - The customerId is different from the one in the context (validated on walletVerificationMessage)
    (context?.walletVerificationMessage &&
      customerId !== context?.walletVerificationMessage) ||
    // - The walletAddress from the context is different from the one in the linkedCustomer
    (context?.walletAddress &&
      context?.walletAddress !== linkedCustomer?.address) ||
    false
  );
}

async function resetSession() {
  await gateContextClient.write({
    disconnect: true,
    walletAddress: "",
    vaults: [],
  });
  console.log("Session reset");
}

interface ConnectCustomerWalletInput {
  linkedCustomer?: LinkedCustomer;
  productId: string | undefined;
  gateId: string | undefined;
  data: { address: string; message: string; signature: string };
}

async function connectCustomerWallet({
  linkedCustomer: existingCustomer,
  productId,
  gateId,
  data,
}: ConnectCustomerWalletInput) {
  try {
    console.log("connectCustomerWallet", {
      existingCustomer,
      data,
    });
    const { address, message, signature } = data;
    await connectWallet({
      address,
      message,
      signature,
      productId,
      gateId,
    });
    const res = await gateContextClient.read();
    console.log("connectCustomerWallet context res", res);
    return {
      walletAddress: res?.walletAddress,
      linkedCustomer: { address: res?.walletAddress },
    };
  } catch (error) {
    console.error("connectCustomerWallet error:", error);
    throw error;
  }
}

async function disconnectCustomerWallet() {
  console.log("disconnectCustomerWallet");
  try {
    const response = await fetch("/cart/clear.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      await gateContextClient.write({
        disconnect: true,
        walletAddress: "",
        vaults: [],
      });
      // Soft reload the page
      window.location.reload();
    } else {
      console.error("Failed to clear cart:", response.statusText);
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}
