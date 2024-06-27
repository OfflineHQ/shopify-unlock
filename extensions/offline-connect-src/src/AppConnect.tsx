import { useEffect, useState } from "react";
import { gateContextClient } from "./gate";
import type { AppConnectProps, GateContext } from "./types";

export const AppConnect = ({
  customer,
  loginUrl,
  settingsCssVariables,
}: AppConnectProps) => {
  const [gateContext, setGateContext] = useState<GateContext | null>(null);
  console.log({ customer, loginUrl, settingsCssVariables });
  useEffect(() => {
    async function test() {
      const gateContext = await gateContextClient.read();
      console.log({ gateContext });
      setGateContext(gateContext);
    }
    test();
  }, []);
  return <div>AppConnect Offline test : {gateContext?.walletAddress}</div>;
};
