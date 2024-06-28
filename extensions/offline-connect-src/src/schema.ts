import { z } from "zod";
import { DiscountType, GateReactionType } from "~/types";

// Enums
const GateConditionLogicEnum = z.enum(["any"]);
const DiscountTypeEnum = z.nativeEnum(DiscountType);
const GateReactionTypeEnum = z.nativeEnum(GateReactionType);

// Complex schemas
const gateConditionSchema = z.object({
  contractAddress: z.string(),
  tokenIds: z.array(z.string()).optional(),
});

const gateRequirementSchema = z.object({
  logic: GateConditionLogicEnum,
  conditions: z.array(gateConditionSchema),
});

const gateReactionSchema = z.object({
  type: GateReactionTypeEnum,
  name: z.string(),
  discount: z
    .object({
      type: DiscountTypeEnum,
      value: z.number(),
    })
    .optional(),
});

const gateConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  orderLimit: z.number().optional(),
  requirements: gateRequirementSchema,
  reactions: gateReactionSchema,
});

const customerSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const linkedCustomerSchema = z.object({
  address: z.string().optional(),
});

const vaultSchema = z.object({
  remove: z.boolean().optional(),
  canMint: z.boolean(),
  hmac: z.string(),
  id: z.string(),
});

const gateContextSchema = z.object({
  walletAddress: z.string().optional(),
  walletVerificationMessage: z.string().optional(),
  walletVerificationSignature: z.string().optional(),
  disconnect: z.boolean().optional(),
  noCustomer: z.boolean().optional(),
  linkedCustomer: linkedCustomerSchema,
  vaults: z.array(vaultSchema).optional(),
});

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  available: z.boolean(),
  price: z.number(),
});

const gateSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  configuration: gateConfigSchema,
});

// Specific schemas
export const getLinkedCustomerSchema = linkedCustomerSchema;

export const connectWalletSchema = gateContextSchema;

export const evaluateGateSchema = connectWalletSchema;

// Export types

export type GetLinkedCustomerSchema = z.infer<typeof getLinkedCustomerSchema>;
export type ConnectWalletSchema = z.infer<typeof connectWalletSchema>;
export type EvaluateGateSchema = z.infer<typeof evaluateGateSchema>;

export type Customer = z.infer<typeof customerSchema>;
export type LinkedCustomer = z.infer<typeof linkedCustomerSchema>;
export type Vault = z.infer<typeof vaultSchema>;
export type GateContext = z.infer<typeof gateContextSchema>;
export type Product = z.infer<typeof productSchema>;
export type Gate = z.infer<typeof gateSchema>;
