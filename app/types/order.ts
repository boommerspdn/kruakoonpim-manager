import { z } from "zod";

export const orderItemsSchema = z.array(
  z.object({
    id: z.string(),
    menuId: z.string(),
    amount: z.coerce.number().nullish().optional(),
  }),
);

export type OrderItems = z.infer<typeof orderItemsSchema>;

export const paymentSchema = z.enum(["CASH", "ONLINE", "UNKNOWN"]).nullish();

export type Payment = z.infer<typeof paymentSchema>;

export const orderStatusSchema = z.enum(["COMPLETED", "PENDING"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const publicOrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  date: z.date().optional(),
  delivery: z.boolean(),
  note: z.string(),
  payment: paymentSchema,
  orderItems: orderItemsSchema,
  totalPrice: z.number().optional(),
  sortOrder: z.number().optional(),
  status: orderStatusSchema,
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export type PublicOrder = z.infer<typeof publicOrderSchema>;

export const createOrderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z
    .string()
    .min(1, { message: "ชื่อลูกค้าต้องมีมากกว่า 1 ตัวอักษร" }),
  date: z.date().optional(),
  delivery: z.boolean().optional(),
  note: z.string().optional().nullable(),
  payment: paymentSchema,
  status: orderStatusSchema,
  orderItems: z.array(
    z.object({
      id: z.string().optional(),
      menuId: z.string(),
      menuName: z.string(),
      amount: z.coerce.number().optional(),
    }),
  ),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;

export const orderItemObjectSchema = z.object({
  menuId: z.string(),
  menuName: z.string(),
  amount: z.coerce.number(),
});

export type OrderItemObject = z.infer<typeof orderItemObjectSchema>;

export const patchOrderItemSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  date: z.date(),
  delivery: z.boolean(),
  note: z.string(),
  payment: paymentSchema.optional(),
  status: orderStatusSchema.optional(),
  orderItems: z.object({
    toCreate: z.array(orderItemObjectSchema),
    toUpdate: z.array(
      z.object({
        id: z.string(),
        changes: orderItemObjectSchema.partial(),
      }),
    ),
    toDeleteIds: z.array(z.string()),
  }),
});

export type PatchOrderItem = z.infer<typeof patchOrderItemSchema>;

export const rowSwapBodySchema = z.object({
  active: z.string(),
  over: z.string(),
});

export type RowSwapBody = z.infer<typeof rowSwapBodySchema>;

export const storeOrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  inputName: z.string().min(1, { message: "ชื่อต้องมีมากกว่า 1 ตัวอักษร" }),
  delivery: z.boolean(),
  note: z.string().optional().nullish(),
  payment: paymentSchema,
  orderItems: z.array(z.object({ menuId: z.string(), amount: z.number() })),
  sortOrder: z.number().optional(),
  pageNumber: z.number().optional(),
});

export type StoreOrder = z.infer<typeof storeOrderSchema>;
