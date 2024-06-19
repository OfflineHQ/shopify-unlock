import { z } from "zod";

// Define classical enums
export enum CampaignTypeEnum {
  Open = "open",
  Targeted = "targeted",
  Tiered = "tiered",
}

export enum RedemptionLimitEnum {
  NoLimit = "no_limit",
  SetLimit = "set_limit",
}

export enum PerkTypeEnum {
  Discount = "discount",
  ExclusiveAccess = "exclusive_access",
}

export enum DiscountTypeEnum {
  Percentage = "percentage",
  Amount = "amount",
}

// Create array versions from enums
export const campaignTypeEnum = Object.values(CampaignTypeEnum);
export const redemptionLimitEnum = Object.values(RedemptionLimitEnum);
export const perkTypeEnum = Object.values(PerkTypeEnum);
export const discountTypeEnum = Object.values(DiscountTypeEnum);

export const campaignFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name cannot be empty" }),
    campaignType: z.nativeEnum(CampaignTypeEnum),
    redemptionLimit: z.nativeEnum(RedemptionLimitEnum),
    orderLimit: z
      .number()
      .min(0, { message: "Order limit cannot be negative" })
      .optional(),
    perkType: z.nativeEnum(PerkTypeEnum),
    discountType: z.nativeEnum(DiscountTypeEnum).optional(),
    discount: z
      .number()
      .min(0, { message: "Discount cannot be negative" })
      .optional(),
    products: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.redemptionLimit === "set_limit" && !data.orderLimit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Order limit cannot be empty",
        path: ["orderLimit"],
      });
    }

    if (data.perkType === "discount" && !data.discount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount cannot be empty",
        path: ["discount"],
      });
    }

    if (
      data.discountType === "percentage" &&
      data.discount &&
      data.discount > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount cannot be greater than 100%",
        path: ["discount"],
      });
    }

    const isProductSelection = data.products.length > 0;

    if (isProductSelection && data.products.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Products cannot be empty",
        path: ["products"],
      });
    }
  });

export type CampaignFormData = z.infer<typeof campaignFormSchema>;
