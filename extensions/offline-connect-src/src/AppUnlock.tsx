import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { OffKeyState } from "~/types";
import {
  disableBuyButtons,
  enableBuyButtons,
  getGate,
  updatePriceDisplay,
} from "./gate";
import type { Customer, Gate, Product } from "./schema";
import {
  UnlockMachineContext,
  UnlockMachineProvider,
} from "./UnlockMachineProvider";

const App = ({
  customer,
  product,
  gate,
  formattedOriginalPrice,
}: AppUnlockProps & { gate: Gate }) => {
  const isUnlocked = UnlockMachineContext.useSelector((snapshot) =>
    snapshot.matches(OffKeyState.Unlocked),
  );
  const reaction = gate.configuration?.reaction;
  useEffect(() => {
    console.log("isUnlocked effect: ", isUnlocked, reaction);
    if (isUnlocked) {
      if (reaction?.type === "exclusive_access") {
        enableBuyButtons();
      }
      if (reaction?.discount) {
        updatePriceDisplay(reaction.discount, formattedOriginalPrice);
      }
    } else if (reaction?.type === "exclusive_access") {
      disableBuyButtons();
    }
  }, [reaction?.type, isUnlocked]);

  return null;
};

export interface AppUnlockProps {
  customer: Customer;
  product: Product;
  walletAddress: string;
  formattedOriginalPrice: string;
}

export const AppUnlock = (args: AppUnlockProps) => {
  console.log("App gates:", window.myAppGates);
  const gate: Gate = getGate();
  const gateId = gate?.configuration?.id?.split("/").pop();
  if (!gateId) {
    return null;
  }
  const context = {
    customerId: args.customer.id,
    productId: args.product.id,
    walletAddress: args.walletAddress,
    gateId,
  };
  return (
    // TODO, use a global query client in connect-modal instead to have a global cache.
    <QueryClientProvider client={queryClient}>
      <UnlockMachineProvider context={context}>
        <App {...args} gate={gate} />
      </UnlockMachineProvider>
    </QueryClientProvider>
  );
};
const queryClient = new QueryClient();
