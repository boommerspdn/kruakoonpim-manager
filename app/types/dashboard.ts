import { z } from "zod";
import { paymentStatusSchema } from "./order";

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
