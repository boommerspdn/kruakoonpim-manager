import { format } from "date-fns";

export const swrKeys = {
  orders: (date?: Date) =>
    `/api/order?date=${format(date ?? new Date(), "yyyy-MM-dd")}`,
  menu: (date?: Date) =>
    `/api/menu?date=${format(date ?? new Date(), "yyyy-MM-dd")}`,
  dashboard: (date?: Date) =>
    `/api/dashboard?date=${format(date ?? new Date(), "yyyy-MM-dd")}`,
  customers: () => "/api/customers",
};
