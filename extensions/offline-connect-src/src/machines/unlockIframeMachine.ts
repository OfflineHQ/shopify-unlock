import { SendMessageType, UnlockIframeStatus } from "@/types";
import type { IFramePage } from "iframe-resizer";
import type { ActorRef, ActorRefFrom } from "xstate";
import {
  assign,
  emit,
  enqueueActions,
  fromPromise,
  sendTo,
  setup,
} from "xstate";

async function onMessage(message: any, self: any) {
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

interface SendMessageToIframeInput {
  iframeParentRef: any;
  type: SendMessageType;
  value: any;
}

async function sendMessageToIframe({
  iframeParentRef,
  type,
  value,
}: SendMessageToIframeInput) {
  const unlockIframe = iframeParentRef.getSnapshot()?.context?.unlockIframe;
  const childIsReady = iframeParentRef.getSnapshot()?.context?.childIsReady;
  console.log(
    `sendMessageToIframe`,
    iframeParentRef,
    unlockIframe,
    type,
    value,
  );
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
      `No unlockIframe or child not ready, message not sent for type: ${type}`,
    );
    throw new Error(
      `No unlockIframe or child not ready, message not sent for type: ${type}`,
    );
  }
}

type SendMessageContext = {
  iframeParentRef: ActorRef<any, any>;
  type: SendMessageType;
  value: any;
  retries: number;
};

type SendMessageEvent =
  | { type: "RETRY" }
  | { type: "SEND_SUCCESS" }
  | { type: "SEND_FAILURE" };

const sendMessageMachine = setup({
  types: {} as {
    context: SendMessageContext;
    events: SendMessageEvent;
    input: Omit<SendMessageContext, "retries">;
  },
  actions: {
    incrementRetries: assign({
      retries: ({ context }) => context.retries + 1,
    }),
  },
  guards: {
    canRetry: ({ context }) => context.retries < 10,
  },
  actors: {
    sendMessageToIframe: fromPromise(
      async ({ input }: { input: SendMessageToIframeInput }) => {
        await sendMessageToIframe(input);
      },
    ),
  },
  delays: {
    RETRY_DELAY: ({ context }) => {
      return context.retries < 3 ? 800 : context.retries * 1000; // Gradual delay based on the number of retries
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SzAOwgWTrAhjAdCugJapQDEEA9qmPqQG5UDWdRm2eYAKlQJIAzAE44AtmADaABgC6iUAAcqsYgBdiNeSAAeiACwA2AMwAaEAE9EADiP4A7AFYAvk7PsssXAXakKYIUJUQvgKADY4qgJBooRoHJ5cvIIi4tJySCBKKuqaGboIhqYWiABMRgCc9s6uIO6c3nG+5P6BwWERUUIxdQkwScJikgCM6YrKahqoWvmFZpYIQ3p6VS5ucR5edEJgqkLm5NqwqhF0OAKq-gAUAEoAotzXAJoA+gAitwAyAIKPAJTkPU2+G2u3MaS0WQmuVA+QMegc9iGVkcc0QQ3KJXwJWqNVQVAgcC0gK4EPGOSmeUQAFoDKiEDTVrV1vU2I0yKTspNpvoSnT0QZ8EY7AYHAZsYziQQQXsOVCKTDrCVliUrENsXTsQLFkYSiVykMDIbDXYJczemwAK4AYyt2Fl5O5CCsSqxqvVxSdQ3w1TW6A2XHwAhwxFCFu29q5lKdLpVaocfL0mJxTiAA */
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
            guard: ({ context }) => context.retries < 10,
            actions: assign({
              retries: ({ context }) => context.retries + 1,
            }),
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
});

// Define types for the context
type Context = {
  authParentRef: ActorRef<any, any, any>;
  unlockIframe: IFramePage | null;
  errorCreateIframe: unknown;
  error: unknown;
  childIsReady: boolean;
};

// Define types for events
type Event =
  | { type: "RECEIVE_MESSAGE"; message: any }
  | { type: "IFRAME_CHILD_IS_READY" }
  | { type: "SEND_MESSAGE"; data: { type: SendMessageType; value: any } }
  | { type: "SEND_MESSAGE_TO_AUTH"; data: { type: string; value?: any } }
  | { type: "CONNECT_TO_SHOPIFY" }
  | { type: "AUTH_INITIALIZED" }
  | { type: "IFRAME_LOADED"; iframeRef: IFramePage }
  | { type: "RESET" };

const unlockIframeMachine = setup({
  types: {} as {
    context: Context;
    events: Event;
    input: Pick<Context, "authParentRef">;
  },
  actors: {
    sendMessageToIframe: fromPromise(
      ({ input }: { input: SendMessageToIframeInput }) =>
        sendMessageToIframe(input),
    ),
  },
  actions: {
    receiveMessage: ({ event, self }) =>
      onMessage((event as any).message, self),
    setChildIsReady: assign({
      childIsReady: (_) => true,
    }),
    clearError: assign({
      error: (_) => undefined,
    }),
    assignError: assign({
      error: ({ event }) => (event as any).error,
    }),
    clearUnlockIframe: assign({
      unlockIframe: (_) => null,
    }),
    assignUnlockIframe: assign({
      unlockIframe: ({ event }) => (event as any).iframeRef,
    }),
    sendEventToAuth: sendTo(
      ({ context }) => context.authParentRef,
      ({ event }) => ({
        type: "IFRAME_MESSAGE_RECEIVED",
        data: (event as any)?.data,
      }),
    ),
    emitConnectToShopify: emit({
      type: "CONNECT_TO_SHOPIFY",
    }),
    // https://stately.ai/docs/actions#enqueue-actions, if a message with same data.type sent, it will replace the current one, also it handle the retry in case it fail to send to the iframe
    enqueueSendMessages: enqueueActions(({ enqueue, event }) => {
      if (event.type === "SEND_MESSAGE" && "data" in event) {
        const { data } = event;
        // @ts-ignore
        enqueue.spawnChild(sendMessageMachine, {
          input: ({ self }) => ({
            iframeParentRef: self,
            type: data.type,
            value: data.value,
          }),
          id: data.type, // ensure only one message of the same type is sent at a time
        });
      }
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFcB2AbA9gYwNYEkAzAJwEMBbMAYgCUBRAYTvwDU6B9AWToGUeBBAOJ0A2gAYAuolAAHTLACWAFwWZU0kAA9EAZgAcAOgDsRnQBYzANksBWIzYCcYywEYANCACeuh0YN6XACYrB0C9QMDLMQdLAF9YjzQsPCIySip8ADEafm52BgAJfAAZABF2fB52en5SgE1xKSQQOUUVNQ1tBBc-FzM9CzExGxs9PWizD28EHTEXAx1HHVMjFz7ovXjEjBwCEgpqHjoAOXLuPiFRSQ1W5VV1Zq6dQIW9S1MRo2GAswcpxECYjMBiclkCRh+w1GNh0WxASV2qQOVCOpy4vAEwnYABUAPLsfgAVWxBUaN3kdw6j0QQQMQ3pDIZfX+3TEhjMMJcOicX3BoTMcIRKX26QYuOOx0Y2Jx+J4BVxAAUsg1rs1bu0HqAuoEdAYbAynGZgjZfiYWUF4gkQKhMBA4BohXs0mByW17p1EJZgRCgo4xoCnG8Wb8HAZIiMvXpOUFApbYkA */
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
});

export default unlockIframeMachine;

export type UnlockIframeMachine = typeof unlockIframeMachine;
export type UnlockIframeActor = ActorRefFrom<UnlockIframeMachine>;
