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
  reaction: gateReactionSchema,
});

const customerSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const linkedCustomerSchema = z.object({
  address: z.string().nullable(),
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
  vaults: z.array(vaultSchema).optional(),
});

export const connectedSchema = z.object({
  walletAddress: z.string().min(1),
  walletVerificationMessage: z.string().min(1),
  walletVerificationSignature: z.string().min(1),
  linkedCustomer: linkedCustomerSchema,
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

export const evaluateGateSchema = z
  .object({
    vaults: z.array(vaultSchema),
  })
  .strict();

// Export types

export type GetLinkedCustomerSchema = z.infer<typeof getLinkedCustomerSchema>;
export type ConnectWalletSchema = z.infer<typeof connectWalletSchema>;
export type EvaluateGateSchema = z.infer<typeof evaluateGateSchema>;

export type Customer = z.infer<typeof customerSchema>;
export type LinkedCustomer = z.infer<typeof linkedCustomerSchema>;
export type Vault = z.infer<typeof vaultSchema>;
export type GateContext = z.infer<typeof gateContextSchema>;
export type GateContectWrite = Partial<GateContext>;
export type Product = z.infer<typeof productSchema>;
export type Gate = z.infer<typeof gateSchema>;
