import { z } from "zod";

// Schema for StorefrontRequest
export const storefrontRequestSchema = z.object({
  customerId: z.string().optional(),
  shopDomain: z.string().min(1),
});
export const storefrontRequestSchemaWithCustomerId =
  storefrontRequestSchema.extend({
    customerId: z.string().min(1),
  });

// Schema for ProductGateRequest
const productGateRequestSchema = z.object({
  productGid: z.string().nullable(),
  gateConfigurationGid: z.string().nullable(),
});
const requiredProductGateRequestSchema = productGateRequestSchema.extend({
  productGid: z.string().min(1),
  gateConfigurationGid: z.string().min(1),
});
const existingCustomerSchema = z.object({
  address: z.string().nullable(),
});

// Connect
const baseConnectSchema = z.object({
  address: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
});

export const connectParamsSchema = baseConnectSchema
  .extend(productGateRequestSchema.shape)
  .extend({ existingCustomer: existingCustomerSchema });

export const connectArgsSchema = connectParamsSchema.extend(
  storefrontRequestSchema.shape,
);

export type ConnectParamsSchema = z.infer<typeof connectParamsSchema>;
export type ConnectArgsSchema = z.infer<typeof connectArgsSchema>;

// Evaluate Gate

export const evaluateGateParamsSchema = baseConnectSchema.extend(
  requiredProductGateRequestSchema.shape,
);
export const evaluateGateArgsSchema = evaluateGateParamsSchema.extend(
  storefrontRequestSchemaWithCustomerId.shape,
);

export type EvaluateGateParamsSchema = z.infer<typeof evaluateGateParamsSchema>;
export type EvaluateGateArgsSchema = z.infer<typeof evaluateGateArgsSchema>;
