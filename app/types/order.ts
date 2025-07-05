import { z } from "zod";

export const orderItems = z.array(
  z.object({
    id: z.string(),
    menuId: z.string(),
    amount: z.number(),
    price: z.number(),
  }),
);

export type OrderItems = z.infer<typeof orderItems>;

export const paymentStatusSchema = z.object({
  total: z.number(),
  cash: z.number(),
  online: z.number(),
  unknown: z.number(),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const orderStatusSchema = z.enum(["COMPLETED", "PENDING"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const publicOrder = z.object({
  id: z.string(),
  customerName: z.string(),
  date: z.date(),
  delivery: z.boolean(),
  note: z.string(),
  payment: paymentStatusSchema,
  orderItems: orderItems,
  totalPrice: z.number(),
  sortOrder: z.number(),
  status: orderStatusSchema,
  updatedAt: z.date(),
  createdAt: z.date(),
});

export type PublicOrder = z.infer<typeof publicOrder>;
