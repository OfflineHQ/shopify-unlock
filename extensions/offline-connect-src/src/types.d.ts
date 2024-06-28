import type { SettingsCssVariables } from "~/types";

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
