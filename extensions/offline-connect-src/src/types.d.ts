export type SettingsCssVariables = {
  [key: string]: string;
};

export interface AppConnectProps {
  customer?: Customer;
  loginUrl?: string;
  settingsCssVariables?: SettingsCssVariables;
}

declare global {
  interface Window {
    myAppGates: Gate[];
  }
}
