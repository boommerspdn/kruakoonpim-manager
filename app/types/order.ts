import { z } from "zod";

export const orderItemsSchema = z.array(
  z.object({
    id: z.string(),
    menuId: z.string(),
    amount: z.coerce.number().optional(),
    price: z.coerce.number().optional(),
  }),
);

export type OrderItems = z.infer<typeof orderItemsSchema>;

export const paymentSchema = z
  .enum(["CASH", "ONLINE", "UNKNOWN", "PENDING"])
  .optional();

export type Payment = z.infer<typeof paymentSchema>;

export const orderStatusSchema = z.enum(["COMPLETED", "PENDING"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const publicOrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  date: z.date().optional(),
  delivery: z.boolean().optional(),
  note: z.string(),
  payment: paymentSchema.optional(),
  orderItems: orderItemsSchema,
  totalPrice: z.number().optional(),
  sortOrder: z.number().optional(),
  status: orderStatusSchema.optional(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
  _status: z.enum(["created"]).optional(),
});

export type PublicOrder = z.infer<typeof publicOrderSchema>;
