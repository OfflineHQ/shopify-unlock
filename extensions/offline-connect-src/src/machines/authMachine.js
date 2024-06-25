import {
  assign,
  createMachine,
  fromPromise,
  sendTo,
  spawnChild,
  stopChild,
} from "xstate";
import { connectWallet, gateContextClient, getLinkedCustomer } from "../gate";
import offKeyMachine from "./offKeyMachine";
import unlockIframeMachine from "./unlockIframeMachine";

export const ShopifyCustomerStatus = {
  Idle: "idle", // Waiting for inital data to be loaded (customerId if user connected)
  Initializing: "initializing", // waiting for the store session and customer data to be loaded
  NoCustomer: "noCustomer", // no customer data is available, user need to connect to his customer account first
  FetchError: "fetchError", // an error occurred during the process of fetching store session and customer data
  Disconnected: "disconnected", // the user is disconnected, waiting for the user to connect to his wallet
  Disconnecting: "disconnecting", // the user is disconnecting from his wallet
  Connecting: "connecting", // the user is connecting to his wallet
  Connected: "connected", // the user is connected to his wallet
  ConnectError: "error", // an error occurred during the process of connecting to the wallet
};

async function initStoreSessionAndCustomer(customerId) {
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
      await gateContextClient.write({ disconnect: true, noCustomer: true });
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

async function connectCustomerWallet({
  linkedCustomer: existingCustomer,
  productId,
  gateId,
  data,
}) {
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
  await gateContextClient.write({ disconnect: true });
}

const authMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QEMCuAXAFgYgJIDEAlAQQFkBRAfQoGUbiBxKw8gYXNwDVyARAbQAMAXUSgADgHtYAS3TSJAO1EgAHogCM6gBwBOAHQBWACwBmAQCYAbNYGX1JywBoQATw3mAvh+dose6RAANmDYNOQAKpS4AHK4kTzE4cSCIkggkjJyispqCPYChgJF6pYmAOxWBgJaTq6IRkbmevbmZeo6ZZ0CBupGXj4YmP4KstLIgdIAXtIKUNgQimDDAG4SANZLvkMzo+NTM1AIM6sAxshZCikpyhmj2Wm5lj16OgZmHQZvT53Obggm5n0LR0Rg61m0BjK-RAW2Guwm01m80WK3Wm0GcLke0Rh2OEjOFyu6lS4ikdyUDw0FiMeieRksOksZS0NUs5gMv0QnxMei0RiKOgEIK0b3MfW8MIxOyxCIOyIUSzxGz0sOlY1lsyOClO53kl2EfHMJPSZIuOUQpTKzV6lj5nzsOkdnIQ1itBlK6gMWnMvQaUIlqpGMv2SLAACcwxIw3oxIFzgAzKMAWxVUqD6pDuO1+N1iiuwhupr15pdz1e7zK3O+ZWdRjKPOqXqe7R6gs8AYxCgkrFQsHQEiT4dC5GiPGo5DojCo4QA8lEiGRyNc0rczZS8ppLHpK50rIKBEZISZneZAS83uoBADjAYdCZIdDYRBpLATooFSd0JBsKwZ9FomwkQAOrEAAMqBETLqSmTFuunosnopj1vWJgdMyJhGM6miNLSPqtJoXq6Eyj4Ys+r7vmAn7fmEo7jpOTCULO84kBQUEmjB9ygLkmglNukIVAyRSHjWdR5AIvTbr0IKVjo3qgjoJF+G+CgfnISILAqqLKrCymqQcWo6oSBoFiuRacaoiDmAInSGKh1S6Bh6jmFoWEWE0Po9FZpRaCYqEmIpQy6ZRalzOGkbRrGCbJqmSkUZ++l4gSer5saq6wVxlnWW6dksneRhOS5omaHezQ+vyQqgo0HQBXoQVURAw60bQ9AMUxBAsUuJnQeSJbmL5+i+YRVQAk5dbOroWiSVZrxerebLqDVdVfg1PC4DQv7-oBbFpeZuQ+m0iGAtYRg1BeDTjXyei+aypgWPBCkdn4ZFLXKGmKtm2mkS+L2aolub6kI21mRSGWluo54VlW-Gud0ej2ZCbLdFVBg1c9cUhdgYVRjGcboImYYpk+33owl2ZJXmxmpcDJbNhDQqVl80NFU5BiIcKZQdOoHPev6Ax+PGYDoCcmDkBGUbYCw4SEAAmkDHEgxZYlFHDzIHvNFS2OotanoYIosj5jJPP5j1DFjYY-n+AGsMBYEQeEcs9eueH6LY7JCiYIqqyJfzYU0834fBRH+hKXYQHAyhbIW8slgAtFromvIhZ0GJUtgnTVATBFHjug2Nomgk07piqeljWZ6Jhcxn6bYgc2drqDVk0vYBWCiyFg+eYzqti8HPVB7DQnbzkp+F2PZ9gO4Z1+lisFQUtr1lUl54flzr3pN94glYWiemKFio8TKnBZAU+7e4ZRbkU5RHRhWhlI0WG9DyTlOW0geMuKfOBSTswnwr3EczyNoQoLBXjsH1WoPtiq4XsCCUu1R2Qf2Hl-Q+9Vf69XvE0LQjYiLb1aA4VyrRrTenBMYMBQ8ibkRQSFNB64MIFC5pzBod5SiNlchJYwJRBqcIEjVAWQsRZizDDQ0Gs9aS33vOJO6Yp45-BOvoOsugdDYVLtYY2n89Bm2EYrPqKdeTYMZLg+sED3BCkMDaYwflSiWC8F4IAA */
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
            actions: "assignFetchError",
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
          }) => ({
            linkedCustomer,
            customerId,
            productId,
            gateId,
            data: event.data,
          }),
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
        guard: "offKeyActorNotSpawned",
        on: {
          SEND_MESSAGE_TO_IFRAME: {
            actions: [
              "sendConnectedStateToIframe",
              "assignInitMessageToIframeSent",
            ],
            guards: ["initMessageToIframeNotSent"],
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
  },
  {
    guards: {
      isConnected: ({ event }) => event.output?.walletAddress,
      isDisconnected: ({ event }) => !event.output?.walletAddress,
      haveNoCustomerId: ({ event }) => !event.output?.customerId,
      initMessageToIframeNotSent: ({ context }) =>
        !context.initMessageToIframeSent,
    },
    actors: {
      initStoreSessionAndCustomer: fromPromise(({ input }) =>
        initStoreSessionAndCustomer(input.customerId),
      ),
      connectCustomerWallet: fromPromise(({ input }) =>
        connectCustomerWallet(input),
      ),
      disconnectCustomerWallet: fromPromise(({ input }) =>
        disconnectCustomerWallet(input),
      ),
    },
    actions: {
      setUnlocked: assign({
        isUnlocked: true,
      }),
      assignGateContext: assign({
        productId: ({ event }) => event.productId,
        gateId: ({ event }) => event.gateId,
      }),
      logError: ({ event }) => console.error(event),
      assignFetchError: assign({
        fetchError: ({ event }) => event.error,
      }),
      assignConnectError: assign({
        connectError: ({ event }) => event.error,
      }),
      reset: assign({
        linkedCustomer: null,
        walletAddress: null,
        isUnlocked: false,
      }),
      assignCustomerId: assign({
        customerId: ({ event }) => event.customerId,
      }),
      assignConnected: assign({
        linkedCustomer: ({ event }) => event.output.linkedCustomer,
        walletAddress: ({ event }) => event.output.walletAddress,
      }),
      assignDisconnected: assign({
        linkedCustomer: ({ event, context }) =>
          event.output?.linkedCustomer || context.linkedCustomer,
        walletAddress: null,
        isUnlocked: false,
      }),
      // // Used here to trigger an assign to the iframe url the address of the wallet if the user is already connected
      // assignReconnected: assign({
      //   isReconnected: true,
      // }),
      spawnIframeActor: spawnChild(unlockIframeMachine, {
        systemId: "unlockIframe",
        input: ({ self }) => ({
          authParentRef: self,
        }),
      }),
      spawnOffKeyActor: assign({
        brandOffKeyRef: ({ spawn, context, self }) =>
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
          }),
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
        ({ context, event }) => ({
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
        }),
      ),
      sendConnectedStateToIframe: sendTo(
        ({ system }) => system.get("unlockIframe"),
        ({ context, event }) => {
          let dataToSend = {
            connectStatus: {
              status: ShopifyCustomerStatus.Connected,
              address: context.walletAddress,
            },
            linkedCustomer: context.linkedCustomer,
          };
          if (event.customer) {
            dataToSend.customer = event.customer;
          }
          if (event.product) {
            dataToSend.product = event.product;
          }
          if (event.cssVariablesAndClasses) {
            dataToSend.cssVariablesAndClasses = event.cssVariablesAndClasses;
          }
          console.log("sendConnectedStateToIframe", dataToSend);
          return {
            type: "SEND_MESSAGE",
            data: {
              type: "ALL",
              value: {
                ...dataToSend,
              },
            },
          };
        },
      ),
      assignInitMessageToIframeSent: assign({
        initMessageToIframeSent: true,
      }),
    },
  },
);

export default authMachine;
