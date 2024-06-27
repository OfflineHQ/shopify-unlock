import { useEffect, useState } from "react";
import { gateContextClient } from "./gate";

export type Customer = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type SettingsCssVariables = {
  [key: string]: string;
};

export interface AppConnectProps {
  customer?: Customer;
  loginUrl?: string;
  settingsCssVariables?: SettingsCssVariables;
}

export interface LinkedCustomer {
  address?: string;
}

export interface Vault {
  canMint: boolean;
  hmac: string;
  id: string;
}

export type GateContext = {
  vaults?: Vault[];
  linkedCustomer: LinkedCustomer;
  walletAddress: string;
  walletVerificationMessage: boolean;
  walletVerificationSignature: string;
};

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
