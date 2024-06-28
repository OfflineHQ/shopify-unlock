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
