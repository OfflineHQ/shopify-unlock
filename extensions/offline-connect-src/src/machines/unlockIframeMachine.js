import { iframeResizer } from "iframe-resizer";

export const UnlockIframeStatus = {
  Idle: "idle", // waiting for the session data to be loaded
  IframeLoading: "iframe-loading", // loading the iframe
  IframeLoaded: "iframe-loaded", // iframe is loaded but waiting for a signal from the iframe app that it is ready
  IsReady: "is-ready", // iframe app is ready to receive messages
  SendingMessage: "sending-message", // sending a message to the iframe app
  Error: "error", // an error occurred during the process
};

import {
  assign,
  createMachine,
  emit,
  enqueueActions,
  fromPromise,
  sendTo,
} from "xstate";

const UNLOCK_APP_URL = process.env.UNLOCK_APP_URL;

export const SendMessageType = {
  READY: 'READY',
  DISCONNECT: 'DISCONNECT',
  SIGNATURE: 'SIGNATURE',
  OFF_KEY_MINT: 'OFF_KEY_MINT',
  CONNECT_STATUS: 'CONNECT_STATUS',
  CONNECT_TO_SHOPIFY: 'CONNECT_TO_SHOPIFY',
}

async function onMessage({ message }, self) {
  console.log("Shopify IframeResizer message:", { message, self });
  if (!message?.type) {
    console.warn("No message type found in message", message);
    return;
  }
  switch (message.type) {
    // The user is connecting to his wallet
    case SendMessageType.SIGNATURE:
      self.send({
        type: "SEND_MESSAGE_TO_AUTH",
        data: { type: "CONNECT_WALLET", value: message.value },
      });
      break;
    // The user is asking to be disconnected from his wallet
    case SendMessageType.DISCONNECT:
      self.send({ type: "SEND_MESSAGE_TO_AUTH", data: { type: "DISCONNECT" } });
      break;
    // The user is asking for the status of the connection (send it back to the iframe)
    case SendMessageType.CONNECT_STATUS:
      console.log("CONNECT_STATUS", message);
      // const context = self.getSnapshot();
      // const authStatus = context.authMachine.getSnapshot();
      // console.log("CONNECT_STATUS", {context, authStatus});
      // self.send({
      //   type: "SEND_MESSAGE",
      //   data: { type: "CONNECT_STATUS", value: {
      //     status: ['connecting', 'connected', 'error', 'disconnected'].includes(authStatus.value) ? authStatus.value : 'disconnected',
      //     address: authStatus.context.walletAddress,
      //   } },
      // });
      break;
    // The user click the button to redirect to the login of the shopify
    case SendMessageType.CONNECT_TO_SHOPIFY:
      self.send({
        type: "CONNECT_TO_SHOPIFY",
      });
      break;
    default:
      console.warn("Unlock iframe message not handled:", message);
      break;
  }
}

function setupUnlockIframe({ unlockIframe, self }) {
  console.log("setupUnlockIframe", unlockIframe, self);
  return new Promise((resolve, reject) => {
    if (unlockIframe) {
      console.log("Unlock iframe already setup");
      resolve(unlockIframe);
    } else {
      console.log("Setting up Unlock iframe with:", UNLOCK_APP_URL);
      try {
        const instances = iframeResizer(
          {
            log: false,
            minHeight: 220,
            checkOrigin: UNLOCK_APP_URL?.startsWith("http://localhost")
              ? false
              : [
                  UNLOCK_APP_URL,
                  UNLOCK_APP_URL.includes("://www.")
                    ? UNLOCK_APP_URL.replace("://www.", "://")
                    : UNLOCK_APP_URL.replace("://", "://www."),
                ],
            heightCalculationMethod: "lowestElement",
            onInit: (iframe) => {
              console.log("Unlock iframe initialized", iframe, instance);
              // onInitHandler();
              resolve(instance);
            },
            onMessage: (props) => onMessage(props, self),
          },
          "#unlockIframe"
        );
        const instance = instances?.[0]?.iFrameResizer;
        console.log("Unlock iframe instance:", instance);
        if (!instance) {
          throw new Error("Iframe instance not found");
        }
      } catch (error) {
        console.error("Failed to initialize iframe", error);
        reject(error);
      }
    }
  });
}

async function sendMessageToIframe({ iframeParentRef, type, value }) {
  const unlockIframe = iframeParentRef.getSnapshot()?.context?.unlockIframe;
  const childIsReady = iframeParentRef.getSnapshot()?.context?.childIsReady;
  console.log(`sendMessageToIframe`, iframeParentRef, unlockIframe, type, value);
  if (unlockIframe && childIsReady) {
    console.log(`Sending message to iframe for ${type}`, value);
    try {
      await unlockIframe.sendMessage({ type, value });
    } catch (error) {
      console.error(`Error sending message to iframe for ${type}`, error);
      throw error;
    }
  } else {
    console.error(
      `No unlockIframe or child not ready, message not sent for type: ${type}`
    );
    throw new Error(`No unlockIframe or child not ready, message not sent for type: ${type}`);
  }
}

const sendMessageMachine = createMachine({
  id: "sendMessage",
  initial: "sending",
  context: ({ input }) => ({
    iframeParentRef: input.iframeParentRef,
    type: input.type,
    value: input.value,
    retries: 0,
  }),
  states: {
    sending: {
      invoke: {
        id: "sendMessageToIframe",
        src: "sendMessageToIframe",
        input: ({ context }) => ({
          iframeParentRef: context.iframeParentRef,
          type: context.type,
          value: context.value,
        }),
        onDone: "success",
        onError: [
          {
            target: "retry",
            guard: ({context}) => context.retries < 10,
            actions: assign({ retries: ({context}) => context.retries + 1 }),
          },
          { target: "failure" },
        ],
      },
    },
    retry: {
      after: {
        RETRY_DELAY: "sending",
      },
    },
    success: {
      type: "final",
    },
    failure: {
      type: "final",
    },
  },
},
  {
    delays: {
      RETRY_DELAY: ({ context }) => {
        return context.retries < 3 ? 800 : context.retries * 1000; // Gradual delay based on the number of retries
      },
    },
    actors: {
      sendMessageToIframe: fromPromise(({ input }) => sendMessageToIframe(input)),
    },
  }
);

const unlockIframeMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QFcB2AbA9gYwNYEkAzAJwEMBbMAYgCUBRAYTvwDU6B9AWToGUeBBAOJ0A2gAYAuolAAHTLACWAFwWZU0kAA9EARgAcANgB0BnQHZ9AVjOWAnGNsAmMXoA0IAJ6IAzGJ1HvO28zW289RzNHawMAXxj3NCw8IjJKKh46ADkAES5eAWFxKSQQOUUVNQ1tBH0xI0dfABYDCzMzPTso9y8EZ0ajewMo22tGy0dGx1j4kEScAhIKagycvL4hDgAVAHl2fgBVTYAJIo0y5VV1EuqdOyM9RuDAnVsdF6Hu3RcjMe8dR1s7UiQx03jiCQw8xSSyoDG2mUyjE27B27B4R22AAV8AAxACapxK5wqV1ANwsAUeNketlseg6OkanxqjnBs0hyUWlCMCgg6GoB2O7HwmXwm3w-AAMvgAFp0bKE2TyC6Va66AzGZ6WOwGcYhMSPZkGJxGcwvFxhRwTP5suac1JgHlcsAAWiwpAgClQUCouJo-G47El2342XlitKypJVV0FJs7VulgMYzE1mZjUiAX+4xzDW13jBMztCwdPNgLuIYA9HlovDomwjxMuMZqGoClkTtl1EXshs8iCTeiMZl1BkCLkZXdZbNQmAgcA0xehlDOUebaoQLp0zLC-T0-0aeicb0MGttHJLSx5fLAq-K67JiDa9w7SYL1hcD0cRpNLXNekta0dHPJJL25BRnTdTAPS9KA7xVUktB8NsqUaJwohHZpvCZfsEAMb5HH0TCcweZMQKhZ0ywrKsIB6JV71VR8EAzZlLD8AJIkaFxjSGR5tTiOIgA */
    id: "unlockIframe",
    initial: UnlockIframeStatus.Idle,
    context: ({ input }) => ({
      authParentRef: input.authParentRef,
      unlockIframe: null,
      errorCreateIframe: undefined,
      error: undefined,
      childIsReady: false,
    }),
    on: {
      RECEIVE_MESSAGE: {
        actions: "receiveMessage",
      },
      IFRAME_CHILD_IS_READY: {
        actions: "setChildIsReady",
      },
      SEND_MESSAGE: {
        actions: "enqueueSendMessages",
      },
      SEND_MESSAGE_TO_AUTH: {
        actions: ["sendEventToAuth"],
      },
      CONNECT_TO_SHOPIFY: {
        actions: ["emitConnectToShopify"],
      },
    },
    states: {
      [UnlockIframeStatus.Idle]: {
        on: {
          AUTH_INITIALIZED: UnlockIframeStatus.IframeLoading,
        },
      },
      [UnlockIframeStatus.IframeLoading]: {
        on: {
          IFRAME_LOADED: {
            target: UnlockIframeStatus.IsReady,
            actions: ["assignUnlockIframe"],
          },
        },
      },
      // [UnlockIframeStatus.IframeLoaded]: {
      //   invoke: {
      //     id: "setupUnlockIframe",
      //     src: "setupUnlockIframe",
      //     input: ({ context, self }) => ({
      //       self,
      //       unlockIframe: context.unlockIframe,
      //     }),
      //     onDone: {
      //       target: UnlockIframeStatus.IsReady,
      //       actions: ["assignUnlockIframe", "clearErrorCreateIframe"],
      //     },
      //     onError: {
      //       target: UnlockIframeStatus.Error,
      //       actions: "assignErrorCreateIframe",
      //     },
      //   },
      // },
      [UnlockIframeStatus.IsReady]: {
        on: {
          RESET: {
            target: UnlockIframeStatus.IframeLoading,
            actions: ["clearError", "clearUnlockIframe"],
          },
        },
      },
      // [UnlockIframeStatus.Error]: {
      //   // TODO: may need a number of attempts mechanism to avoid infinite loop, ref: https://stately.ai/docs/delayed-transitions#dynamic-delays
      //   after: {
      //     1000: {
      //       target: UnlockIframeStatus.IframeLoading,
      //       actions: "clearError",
      //     },
      //   },
      // },
    },
  },
  {
    actors: {
      // setupUnlockIframe: fromPromise(({ input }) => setupUnlockIframe(input)),
      
    },
    actions: {
      receiveMessage: ({event, self}) => onMessage({message:event.message}, self),
      setChildIsReady: assign({
        childIsReady: (_) => true,
      }),
      clearError: assign({
        error: (_) => undefined,
      }),
      assignError: assign({
        error: ({ event }) => event.error,
      }),
      clearUnlockIframe: assign({
        unlockIframe: (_) => null,
      }),
      assignUnlockIframe: assign({
        unlockIframe: ({ event }) => event.iframeRef,
      }),
      sendEventToAuth: sendTo(
        ({ context }) => context.authParentRef,
        ({ event }) => ({
          type: "IFRAME_MESSAGE_RECEIVED",
          data: event?.data,
        })
      ),
      emitConnectToShopify: emit({
        type: "CONNECT_TO_SHOPIFY",
      }),
      // https://stately.ai/docs/actions#enqueue-actions, if a message with same data.type sent, it will replace the current one, also it handle the retry in case it fail to send to the iframe
      enqueueSendMessages: enqueueActions(({ enqueue, context, event }) => {
        const { data } = event;
        enqueue.spawnChild(sendMessageMachine, {
          input: ({self}) => ({
            iframeParentRef: self,
            type: data.type,
            value: data.value,
          }),
          id: data.type, // ensure only one message of the same type is sent at a time
        });
      }),
    },
  }
);

export default unlockIframeMachine;
