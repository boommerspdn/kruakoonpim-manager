export type GeminiResponse = {
  menus: {
    id: string;
    name: string;
    price: number;
    amount: number;
  }[];
  orders: {
    id: string;
    customerName: string;
    note: string | null;
    delivery: boolean;
    payment: "ONLINE" | "CASH" | "UNKNOWN";
    sortOrder: number;
    orderItems: {
      menuId: string;
      amount: number;
    }[];
  }[];
};

export type ApiResponse = {
  success: boolean;
  data?: GeminiResponse;
  error?: string;
};
