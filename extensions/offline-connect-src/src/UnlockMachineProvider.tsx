// import { createBrowserInspector } from "@statelyai/inspect";
import { createActorContext } from "@xstate/react";
import type { Context } from "./machines/offKeyMachine";
import offKeyMachine from "./machines/offKeyMachine";

// export const inspector = createBrowserInspector();

export const UnlockMachineContext = createActorContext(offKeyMachine, {
  //   inspect: inspector.inspect,
  systemId: "offKey",
});

export function UnlockMachineProvider({
  children,
  context,
}: {
  children: React.ReactNode;
  context: Omit<Context, "authParentRef" | "error">;
}) {
  return (
    <UnlockMachineContext.Provider
      options={{
        input: context,
      }}
    >
      {children}
    </UnlockMachineContext.Provider>
  );
}
