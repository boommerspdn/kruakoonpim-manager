import z from "zod";

export type Customer = {
  id: string;
  name: string;
  aliases: string[];
};

export const getCustomer = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PublicCustomer = z.infer<typeof getCustomer>;

export const customerFormValues = z.object({
  name: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});
export type CustomerFormValues = z.infer<typeof customerFormValues>;
