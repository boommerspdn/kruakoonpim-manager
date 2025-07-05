import { z } from "zod";

export const paymentStatusSchema = z.object({
  total: z.number(),
  cash: z.number(),
  online: z.number(),
  unknown: z.number(),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const menuSummary = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  menuData: z.object({
    unpicked: z.number(),
    total: z.number(),
    ordered: z.number(),
    sellable: z.number(),
    picked: z.number(),
    require: z.number(),
    special: z.number(),
  }),
});

export type MenuSummary = z.infer<typeof menuSummary>;

export const publicDashboard = z.object({
  financial: paymentStatusSchema,
  menuSummary: z.array(menuSummary),
});

export type publicDashboard = z.infer<typeof publicDashboard>;
