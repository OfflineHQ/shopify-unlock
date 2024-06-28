import { evaluateGate as evaluateGateApi, gateContextClient } from "@/gate";
import type { Vault } from "@/schema";
import type { ActorRef } from "xstate";
import { assign, fromPromise, sendTo, setup } from "xstate";
import { OffKeyState } from "~/types";

// Define types for the context
type Context = {
  authParentRef: ActorRef<any, any, any>;
  error: unknown;
  walletAddress: string;
  gateId: string;
  productId: string;
  customerId: string;
};

// Define types for events
type Event =
  | { type: "UNLOCKED" }
  | {
      type: "SEND_MESSAGE";
      data: { type: "OFF_KEY_STATE"; value: { status: OffKeyState } };
    };

function getMatchingVault({
  gateId,
  vaults,
}: {
  gateId: string;
  vaults: Vault[];
}) {
  return vaults.find(
    (vault) => vault.id === `gid://shopify/GateConfiguration/${gateId}`,
  );
}

function gateEvaluation(matchingVault: Vault | undefined) {
  if (matchingVault) {
    if (matchingVault.hmac) {
      return {
        owned: true,
        mintable: false,
        used: false,
      };
    } else if (matchingVault.canMint) {
      return {
        owned: false,
        mintable: true,
        used: false,
      };
    }
  }
  return {
    owned: false,
    mintable: false,
    used: false,
  };
}

export const isGateEvaluated = async ({
  customerId,
  productId,
  gateId,
  walletAddress,
}: Omit<Context, "authParentRef" | "error">) => {
  console.log("isGateEvaluated", {
    customerId,
    productId,
    gateId,
    walletAddress,
  });
  try {
    const context = await gateContextClient.read();
    const matchingVault = getMatchingVault({
      gateId,
      vaults: context?.vaults || [],
    });
    const evaluation = gateEvaluation(matchingVault);
    console.log("isGateEvaluated evaluation before", evaluation);
    if (evaluation.owned || evaluation.mintable) {
      return evaluation;
    }
    return evaluateGate({
      walletAddress,
      customerId,
      productId,
      gateId,
    });
  } catch (error) {
    console.error("Error checking if off-key is owned", error);
    throw error;
  }
};

export const evaluateGate = async ({
  customerId,
  productId,
  gateId,
  walletAddress,
}: Omit<Context, "authParentRef" | "error">) => {
  console.log("evaluateGate", {
    customerId,
    productId,
    gateId,
    walletAddress,
  });
  const context = await gateContextClient.read();
  if (!context?.walletVerificationSignature) {
    throw new Error("No wallet verification signature found");
  }
  try {
    const matchingVault = getMatchingVault({
      gateId,
      vaults: context?.vaults || [],
    });
    const evaluation = gateEvaluation(matchingVault);
    if (evaluation.owned || !evaluation.mintable) {
      throw new Error("Off-key is already owned or not mintable");
    }
    const { vaults: updatedVaults } = await evaluateGateApi({
      address: walletAddress,
      message: customerId,
      signature: context?.walletVerificationSignature,
      productId,
      gateId,
    });
    return gateEvaluation(
      getMatchingVault({ gateId, vaults: updatedVaults || [] }),
    );
  } catch (error) {
    console.error("Error minting off-key", error);
    throw error;
  }
};

// Set up the machine with proper types
const offKeyMachine = setup({
  types: {} as {
    context: Context;
    events: Event;
    input: Omit<Context, "error">;
  },
  actors: {
    isGateEvaluated: fromPromise(
      ({ input }: { input: Omit<Context, "authParentRef" | "error"> }) =>
        isGateEvaluated(input),
    ),
    evaluateGate: fromPromise(
      ({ input }: { input: Omit<Context, "authParentRef" | "error"> }) =>
        evaluateGate(input),
    ),
  },
  guards: {
    offKeyAlreadyOwned: ({ event }) => {
      return !!(event as any).output?.owned;
    },
    offKeyNotMintable: ({ event }) => {
      return (
        !(event as any).output?.mintable &&
        !(event as any).output?.owned &&
        !(event as any).output?.used
      );
    },
    offKeyCanBeMinted: ({ event }) => {
      return (
        !!(event as any).output?.mintable &&
        !(event as any).output?.used &&
        !(event as any).output?.owned
      );
    },
  },
  actions: {
    logError: assign({
      error: ({ event }) => (event as any).error,
    }),
    sendUnlockedStateToAuthParent: sendTo(
      ({ context }) => context.authParentRef,
      () => ({
        type: "UNLOCKED",
      }),
    ),
    sendUnlockedStateToIframe: sendTo(
      ({ system }) => {
        return system.get("unlockIframe");
      },
      () => ({
        type: "SEND_MESSAGE",
        data: {
          type: "OFF_KEY_STATE",
          value: {
            status: OffKeyState.Unlocked,
          },
        },
      }),
    ),
    sendLockedStateToIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      () => ({
        type: "SEND_MESSAGE",
        data: {
          type: "OFF_KEY_STATE",
          value: {
            status: OffKeyState.Locked,
          },
        },
      }),
    ),
    sendUsedStateToIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      () => ({
        type: "SEND_MESSAGE",
        data: {
          type: "OFF_KEY_STATE",
          value: {
            status: OffKeyState.Used,
          },
        },
      }),
    ),
    sendUnlockingStateToIframe: sendTo(
      ({ system }) => system.get("unlockIframe"),
      () => ({
        type: "SEND_MESSAGE",
        data: {
          type: "OFF_KEY_STATE",
          value: {
            status: OffKeyState.Unlocking,
          },
        },
      }),
    ),
  },
}).createMachine({
  id: "offKey",
  initial: OffKeyState.Idle,
  context: ({ input }) => ({
    authParentRef: input.authParentRef,
    error: undefined,
    walletAddress: input.walletAddress,
    gateId: input.gateId,
    productId: input.productId,
    customerId: input.customerId,
  }),
  states: {
    [OffKeyState.Idle]: {
      invoke: {
        src: "isGateEvaluated",
        input: ({
          context: { customerId, productId, gateId, walletAddress },
        }) => ({
          customerId,
          productId,
          gateId,
          walletAddress,
        }),
        onDone: [
          {
            target: OffKeyState.Unlocking,
            guard: "offKeyCanBeMinted",
          },
          {
            target: OffKeyState.Locked,
            guard: "offKeyNotMintable",
          },
          {
            target: OffKeyState.Unlocked,
            guard: "offKeyAlreadyOwned",
          },
          {
            target: OffKeyState.Used,
          },
        ],
        onError: {
          target: OffKeyState.Locked,
          actions: "logError",
        },
      },
    },
    [OffKeyState.Unlocking]: {
      entry: "sendUnlockingStateToIframe",
      invoke: {
        src: "evaluateGate",
        input: ({
          context: { customerId, productId, gateId, walletAddress },
        }) => ({
          customerId,
          productId,
          gateId,
          walletAddress,
        }),
        onDone: {
          target: OffKeyState.Unlocked,
        },
        onError: {
          target: OffKeyState.Locked,
          actions: ["logError"],
        },
      },
    },
    [OffKeyState.Unlocked]: {
      entry: ["sendUnlockedStateToIframe", "sendUnlockedStateToAuthParent"],
      type: "final",
    },
    [OffKeyState.Locked]: {
      entry: "sendLockedStateToIframe",
      type: "final",
    },
    [OffKeyState.Used]: {
      entry: "sendUsedStateToIframe",
      type: "final",
    },
  },
});

export default offKeyMachine;
