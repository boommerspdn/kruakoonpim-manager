import { z } from "zod";

export const saveOrderItemSchema = z.object({
  id: z.string(),
  menuId: z.string(),
  menuName: z.string(),
  amount: z.coerce.number(),
});

export type SaveOrderItem = z.infer<typeof saveOrderItemSchema>;

export const saveOrderSchema = z.object({
  finalCustomerId: z.string().optional(),
  inputName: z.string(),
  customerName: z.string(),
  note: z.string().optional(),
  delivery: z.boolean().optional(),
  sortOrder: z.number(),
  orderItems: z.array(saveOrderItemSchema),
});

export type SaveOrder = z.infer<typeof saveOrderSchema>;

export const saveOrdersRequestSchema = z.object({
  menus: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.coerce.number(),
      price: z.coerce.number(),
    })
  ),
  orders: z.array(saveOrderSchema),
});

export type SaveOrdersRequest = z.infer<typeof saveOrdersRequestSchema>;

export interface CustomerLookup {
  id: string;
  name: string;
  aliases: string[];
}

export interface MenuMapping {
  originalId: string;
  newId: string;
}

export interface ProcessedOrderData {
  order: SaveOrder;
  customerId: string;
  menuIdMap: Map<string, string>;
}
