// import { createBrowserInspector } from "@statelyai/inspect";
import { createActorContext } from "@xstate/react";
import authMachine from "./machines/authMachine";

// const { inspect } = createBrowserInspector();

export const AuthMachineContext = createActorContext(authMachine, {
  // inspect,
  system: "auth",
});

export function AuthMachineProvider({ children }) {
  return <AuthMachineContext.Provider>{children}</AuthMachineContext.Provider>;
}
