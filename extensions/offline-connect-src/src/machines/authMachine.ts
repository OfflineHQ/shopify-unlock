import type { ActorRefFrom } from "xstate";
import {
  assertEvent,
  assign,
  fromPromise,
  sendTo,
  setup,
  spawnChild,
  stopChild,
} from "xstate";
import type { CssVariablesAndClasses } from "~/types";
import { ShopifyCustomerStatus } from "~/types";
import { connectWallet, gateContextClient, getLinkedCustomer } from "../gate";
import type { Customer, LinkedCustomer, Product } from "../schema";
import offKeyMachine from "./offKeyMachine";
import unlockIframeMachine from "./unlockIframeMachine";

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
        }
      | { type: "IFRAME_MESSAGE_RECEIVED"; data: { type: string; value?: any } }
      | { type: "UNLOCKED" },
    input: {} as {
      customerId: string;
      productId: string;
      gateId: string;
      error?: Error;
    },
  },
  actors: {
    initStoreSessionAndCustomer: fromPromise(
      async ({ input }: { input: { customerId: string | undefined } }) => {
        // Implementation remains the same
        return initStoreSessionAndCustomer(input.customerId);
      },
    ),
    connectCustomerWallet: fromPromise(
      async ({ input }: { input: ConnectCustomerWalletInput }) => {
        // Implementation remains the same
        return connectCustomerWallet(input);
      },
    ),
    disconnectCustomerWallet: fromPromise(async () => {
      // Implementation remains the same
      return disconnectCustomerWallet();
    }),
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
        console.log("assignCustomerId", event.customerId);
        return event.customerId;
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
        !context.brandOffKeyRef
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
        assertEvent(event, "SEND_MESSAGE_TO_IFRAME");
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
              customer: event.customer,
              product: event.product,
              cssVariablesAndClasses: event.cssVariablesAndClasses,
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
  },
  guards: {
    isConnected: ({ event }) => (event as any)?.output?.walletAddress,
    isDisconnected: ({ event }) => !(event as any)?.output?.walletAddress,
    haveNoCustomerId: ({ event }) => !(event as any)?.output?.customerId,
    initMessageToIframeNotSent: ({ context }) =>
      !context.initMessageToIframeSent,
    offKeyActorNotSpawned: ({ context }) => !context.brandOffKeyRef,
  },
}).createMachine({
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
          actions: ["reset", "assignCustomerId", "assignGateContext"],
        },
      },
    },
    [ShopifyCustomerStatus.Initializing]: {
      invoke: {
        src: "initStoreSessionAndCustomer",
        input: ({ context: { customerId } }) => ({
          customerId,
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
            actions: [
              "assignConnected",
              // "assignReconnected",
              "startUnlockIframe",
            ],
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
      on: {
        CONNECT_WALLET: ShopifyCustomerStatus.Connecting,
        SEND_MESSAGE_TO_IFRAME: {
          actions: [
            "sendDisconnectedStateToIframe",
            "assignInitMessageToIframeSent",
          ],
          guard: "initMessageToIframeNotSent",
        },
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

async function initStoreSessionAndCustomer(customerId: string | undefined) {
  try {
    console.log("initStoreSessionAndCustomer before gateContextClient", {
      customerId,
      gateContextClient,
    });
    let walletAddress;
    let linkedCustomer;
    let associatedCustomerId;
    const res = await gateContextClient.read();
    if (res) {
      walletAddress = res.walletAddress;
      linkedCustomer = res.linkedCustomer;
      associatedCustomerId = res.walletVerificationMessage;
    }
    console.log("initStoreSessionAndCustomer", {
      customerId,
      associatedCustomerId,
      walletAddress,
      linkedCustomer,
    });
    let sessionUpdated = false;
    // If the customer ID is different from the associated customer ID, we completely reset the store session (wallet, vaults and linkedCustomer)
    if (customerId !== associatedCustomerId) {
      await gateContextClient.write({
        disconnect: true,
        noCustomer: true,
        linkedCustomer: {},
      });
      sessionUpdated = true;
    }
    try {
      if (
        customerId &&
        (!linkedCustomer ||
          sessionUpdated ||
          (walletAddress && linkedCustomer?.address !== walletAddress))
      ) {
        await getLinkedCustomer();
        sessionUpdated = true;
      }
    } catch (error) {
      // TODO: check for what to do in case of error from our api, auto-heal in some cases ?
      console.error(
        "initStoreSessionAndCustomer getLinkedCustomer error:",
        error,
      );
      throw error;
    }
    if (sessionUpdated) {
      const res = await gateContextClient.read();
      console.log("initStoreSessionAndCustomer after gateContextClient", {
        res,
      });
      return {
        walletAddress: res?.walletAddress,
        linkedCustomer: res?.linkedCustomer,
        customerId,
      };
    }
    return {
      walletAddress,
      linkedCustomer,
      customerId: associatedCustomerId,
    };
  } catch (error) {
    console.error("initStoreSessionAndCustomer error:", error);
    throw error;
  }
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
      existingCustomer,
      gateId,
    });
    const res = await gateContextClient.read();
    console.log("connectCustomerWallet context res", res);
    return {
      walletAddress: res?.walletAddress,
      linkedCustomer: res?.linkedCustomer,
    };
  } catch (error) {
    console.error("connectCustomerWallet error:", error);
    throw error;
  }
}

async function disconnectCustomerWallet() {
  console.log("disconnectCustomerWallet");
  await gateContextClient.write({ disconnect: true, linkedCustomer: {} });
}
