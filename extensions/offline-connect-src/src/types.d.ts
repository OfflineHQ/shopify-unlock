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

export enum UnlockIframeStatus {
  Idle = "idle", // waiting for the session data to be loaded
  IframeLoading = "iframe-loading", // loading the iframe
  IframeLoaded = "iframe-loaded", // iframe is loaded but waiting for a signal from the iframe app that it is ready
  IsReady = "is-ready", // iframe app is ready to receive messages
  SendingMessage = "sending-message", // sending a message to the iframe app
  Error = "error", // an error occurred during the process
}

export enum SendMessageType {
  READY = "READY",
  DISCONNECT = "DISCONNECT",
  SIGNATURE = "SIGNATURE",
  OFF_KEY_MINT = "OFF_KEY_MINT",
  CONNECT_STATUS = "CONNECT_STATUS",
  CONNECT_TO_SHOPIFY = "CONNECT_TO_SHOPIFY",
}

export enum ShopifyCustomerStatus {
  Idle = "idle", // Waiting for inital data to be loaded (customerId if user connected)
  Initializing = "initializing", // waiting for the store session and customer data to be loaded
  NoCustomer = "noCustomer", // no customer data is available, user need to connect to his customer account first
  FetchError = "fetchError", // an error occurred during the process of fetching store session and customer data
  Disconnected = "disconnected", // the user is disconnected, waiting for the user to connect to his wallet
  Disconnecting = "disconnecting", // the user is disconnecting from his wallet
  Connecting = "connecting", // the user is connecting to his wallet
  Connected = "connected", // the user is connected to his wallet
  ConnectError = "error", // an error occurred during the process of connecting to the wallet
}
