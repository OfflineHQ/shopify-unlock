import { assign, createMachine, fromPromise, sendTo } from "xstate";
import { evaluateGate as evaluateGateApi, gateContextClient } from "../gate";

export const OffKeyState = {
  Idle: "Idle", // Waiting for the gate status to be loaded
  Unlocked: "Unlocked", // The gate is unlocked and perk is applied
  Locked: "Locked", // The gate is locked and no perk is applied
  Unlocking: "Unlocking", // The gate is unlocking (perk being evaluated)
  Used: "Used", // The gate has been used and cannot be used again in this context (perk already used)
};

function getMatchingVault({ gateId, vaults }) {
  return vaults.find(
    (vault) => vault.id === `gid://shopify/GateConfiguration/${gateId}`,
  );
}

function gateEvaluation(matchingVault) {
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
}) => {
  console.log("isGateEvaluated", {
    customerId,
    productId,
    gateId,
    walletAddress,
  });
  try {
    const { vaults, walletVerificationSignature } =
      await gateContextClient.read();
    const matchingVault = getMatchingVault({ gateId, vaults });
    const evaluation = gateEvaluation(matchingVault);
    console.log("isGateEvaluated evaluation before", evaluation);
    if (evaluation.owned || evaluation.mintable) {
      return evaluation;
    }
    // for now we are only fetching from our system in case it's not detected in vault or if it is not owned or not mintable
    const { vaults: updatedVaults } = await evaluateGate({
      address: walletAddress,
      message: customerId,
      signature: walletVerificationSignature,
      productId,
      gateId,
    });
    return gateEvaluation(getMatchingVault({ gateId, vaults: updatedVaults }));
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
}) => {
  console.log("evaluateGate", {
    customerId,
    productId,
    gateId,
    walletAddress,
  });
  const { vaults, walletVerificationSignature } =
    await gateContextClient.read();
  try {
    const matchingVault = getMatchingVault({ gateId, vaults });
    const evaluation = gateEvaluation(matchingVault);
    if (evaluation.owned || !evaluation.mintable) {
      throw new Error("Off-key is already owned or not mintable");
    }
    const { vaults: updatedVaults } = await evaluateGateApi({
      address: walletAddress,
      message: customerId,
      signature: walletVerificationSignature,
      productId,
      gateId,
    });
    return gateEvaluation(getMatchingVault({ gateId, vaults: updatedVaults }));
  } catch (error) {
    console.error("Error minting off-key", error);
    throw error;
  }
};

const offKeyMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QHsBmqDSYCeA6AkhADZgDEEyAdmLgJaUBuyA1jbbAPLpbYcDu1CAG0ADAF1EoAA7JYtAC60qkkAA9EAFhEB2XAFY9GgGwBODdoDMFk9Y0AaENkQAOAIz6RniyL3ajrgCZLAF9ghzRMHAJiMgpqOkYWNk5uHH5BIVcJJBAZOUVlHPUELV0DYzNLa1sHJwQAvQDcIw0LAI1nPVdXNqMLI1Dw1LxCEnIqNkTWOhTI3gFIIQDs6VkFJUoVYtL9Q1NzKxszWs1nC1wTAJNtEWcjZ1bXG0GQCJ5osbjJpmn2Ljn0osLCtcmsCpsipodLsKgdqsdHIgjAFnBcrtpAtptJcAiINC83lFRmQwAAnUnIUm4KREACG8lQlIAtjN-jxAcJxCo8utCqBttDyvsqkd7IiENYRLhzEY9CZOhoehZfAMwq9hrgAKqUIjIADGzHoUHG8XoPxohLw2t1BqNCDN+vpG1EYhd3LBGy2iG6T1wFlaNxM-g0ASM2j0J3qnlw4a8VyDAX6ZgJGut+sNlGNZIpVJp9MZpJZlq1OvTdodeqdVBdbpyPPBXoQPpMfoDIiDrhDYYj4vaqIanlxNmRl18oTVlGQEDgKkt7vynshCAAtEZI8u9BcTNud7vt9oAim5h8wPPeRD+ZoApHfJvLtcREZ2xZXD5VUNj2nbZmzw2l25Nz0ToTC6PpnBEJ4TEjAJXE3Ts2j0F97jOEDDzVYsv1YCBf0XS8m3RDwsSuVw7kQow13FWCWz0TwRBgmi+iDQwj3eAAZdNIBwvk1G9AiaKIkwSNlfoKLqCxnF0G4Xw0EDXGxUN+hYqJNVgTi6w9bjigA-RgNA8SIO3SMn3OOSH1DQx-W0cdgiAA */
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
  },
  {
    guards: {
      offKeyAlreadyOwned: ({ event }) => {
        console.log("offKeyAlreadyOwned 6", !!event.output?.owned);
        return !!event.output?.owned;
      },
      offKeyNotMintable: ({ event }) => {
        console.log(
          "offKeyNotMintable",
          !event.output?.mintable &&
            !event.output?.owned &&
            !event.output?.used,
        );
        return (
          !event.output?.mintable && !event.output?.owned && !event.output?.used
        );
      },
      offKeyCanBeMinted: ({ event }) => {
        console.log(
          "offKeyCanBeMinted 5",
          !!event.output?.mintable &&
            !event.output?.used &&
            !event.output?.owned,
        );
        return (
          !!event.output?.mintable &&
          !event.output?.used &&
          !event.output?.owned
        );
      },
    },
    actions: {
      logError: assign({
        error: ({ event }) => event.error,
      }),
      sendUnlockedStateToAuthParent: sendTo(
        ({ context }) => context.authParentRef,
        ({ context, event }) => ({
          type: "UNLOCKED",
          // TODO, maybe send more context like linked gateId, tokenId and other stuff (voucher applied etc) ?
        }),
      ),
      sendUnlockedStateToIframe: sendTo(
        ({ system }) => {
          return system.get("unlockIframe");
        },
        ({ context, event }) => ({
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
        ({ context, event }) => ({
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
        ({ context, event }) => ({
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
        ({ context, event }) => ({
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
    actors: {
      isGateEvaluated: fromPromise(({ input }) => isGateEvaluated(input)),
      evaluateGate: fromPromise(({ input }) => evaluateGate(input)),
    },
  },
);

export default offKeyMachine;
