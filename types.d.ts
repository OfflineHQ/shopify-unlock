export enum GateConditionLogic {
  Any = "any",
}

export enum DiscountType {
  Percentage = "percentage",
  Amount = "amount",
}

export enum CampaignType {
  Open = "open",
  Targeted = "targeted",
  Tiered = "tiered",
}
export type GateCondition = {
  contractAddress: string;
  tokenIds?: string[];
};
export type GateRequirement = {
  logic: GateConditionLogic;
  conditions: GateCondition[];
};

export enum GateReactionType {
  ExclusiveAccess = "exclusive_access",
  Discount = "discount",
}

export type GateReaction = {
  type: GateReactionType;
  name: string;
  discount?: {
    type: DiscountType;
    value: number;
  };
};

export type GateConfig = {
  id: string;
  name: string;
  handle: string;
  orderLimit?: number;
  requirements: GateRequirement;
  reactions: GateReaction;
};

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

export enum OffKeyState {
  Idle = "Idle", // Waiting for the gate status to be loaded
  Unlocked = "Unlocked", // The gate is unlocked and perk is applied
  Locked = "Locked", // The gate is locked and no perk is applied
  Unlocking = "Unlocking", // The gate is unlocking (perk being evaluated)
  Used = "Used", // The gate has been used and cannot be used again in this context (perk already used)
}

export interface CssVariablesAndClasses {
  cssVariables: {
    "--primary": string;
    "--secondary": string;
    "--radius": string;
    "--off-btn-height": string;
    "--off-btn-font-size": string;
    "--off-btn-letter-spacing": string;
    "--off-btn-padding": string;
    "--off-avatar-size": string;
    "--off-key-info-height": string;
  };
  classes: string;
  fontFamily: string;
}

export interface SettingsCssVariables {
  offline_primary_color: string;
  offline_secondary_color: string;
  offline_border_radius: string;
  offline_button_height: string;
  offline_button_font_size: string;
  offline_button_letter_spacing: string;
  offline_button_padding: string;
  offline_avatar_size: string;
  offline_gate_status_banner_height: string;
  offline_font_family: string;
  offline_max_width: string;
}
