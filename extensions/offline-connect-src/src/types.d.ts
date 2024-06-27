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

export interface Product {
  id: string;
  title: string;
  available: boolean;
  price: number;
}

export type Gate = {
  id: string;
  active: boolean;
  configuration: GateConfig;
};

declare global {
  interface Window {
    myAppGates: Gate[];
  }
}
