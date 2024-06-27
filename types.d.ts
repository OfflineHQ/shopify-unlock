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
