import { CampaignType, GateReactionType, DiscountType } from "@/types";
import { z } from "zod";

// Define classical enums

export enum RedemptionLimitEnum {
  NoLimit = "no_limit",
  SetLimit = "set_limit",
}

// Create array versions from enums
export const campaignTypeEnum = Object.values(CampaignType);
export const redemptionLimitEnum = Object.values(RedemptionLimitEnum);
export const perkTypeEnum = Object.values(GateReactionType);
export const discountTypeEnum = Object.values(DiscountType);

export const campaignFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name cannot be empty" }),
    campaignType: z.nativeEnum(CampaignType),
    redemptionLimit: z.nativeEnum(RedemptionLimitEnum),
    orderLimit: z
      .number()
      .min(0, { message: "Order limit cannot be negative" })
      .optional(),
    perkType: z.nativeEnum(GateReactionType),
    discountType: z.nativeEnum(DiscountType).optional(),
    discount: z
      .number()
      .min(0, { message: "Discount cannot be negative" })
      .optional(),
    products: z.array(z.any()),
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
