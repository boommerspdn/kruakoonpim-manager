import { z } from "zod";

export const inputMenuSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "จำเป็นต้องใส่ชื่อเมนู"),
  amount: z.coerce.number().min(1).nullish(),
  price: z.coerce.number().min(1).nullish(),
  sortOrder: z.coerce.number().optional(),
});

export type CreateMenu = z.infer<typeof inputMenuSchema>;

export const storeMenuSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "จำเป็นต้องใส่ชื่อเมนู"),
  amount: z.coerce.number().min(1),
  price: z.coerce.number().min(1),
  sortOrder: z.coerce.number().optional(),
});
export type StoreMenu = z.infer<typeof storeMenuSchema>;

export const formMenuSchema = z.object({
  menu: z.array(inputMenuSchema),
});
export type FormMenu = z.infer<typeof formMenuSchema>;

export const publicMenuSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.date(),
  price: z.coerce.number(),
  amount: z.coerce.number(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PublicMenu = z.infer<typeof publicMenuSchema>;

export const postMenuSchema = z.array(
  z.object({
    name: z.string(),
    price: z.coerce.number(),
    amount: z.coerce.number(),
  }),
);
export type PostMenu = z.infer<typeof postMenuSchema>;

export const putMenuItemSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    price: z.coerce.number(),
    amount: z.coerce.number(),
    sortOrder: z.coerce.number(),
  }),
);
export type PutMenuItem = z.infer<typeof putMenuItemSchema>;

export const patchMenuSchema = z.object({
  toCreate: z.array(
    z.object({
      name: z.string(),
      amount: z.coerce.number(),
      price: z.coerce.number(),
      sortOrder: z.number(),
    }),
  ),
  toUpdate: z.array(
    z.object({
      id: z.string(),
      changes: z.object({
        name: z.string().optional(),
        amount: z.coerce.number().optional(),
        price: z.coerce.number().optional(),
        sortOrder: z.number().optional(),
      }),
    }),
  ),
  toDeleteIds: z.array(z.string()),
});
export type PatchMenu = z.infer<typeof patchMenuSchema>;

export const publicMenuNameSchema = z.object({
  name: z.string(),
});
export type PublicMenuName = z.infer<typeof publicMenuNameSchema>;
