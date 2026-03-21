import { create } from "zustand";
import { PaymentStatus, MenuSummary } from "@/app/types/dashboard";
import { PublicMenu } from "@/app/types/menu";
import { PublicOrder } from "@/app/types/order";
import mockMenus from "@/lib/data/mock-menu.json";
import mockOrders from "@/lib/data/mock-order.json";
import mockCustomers from "@/lib/data/mock-customers.json";

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create customer ID mapping from mock data
const customerIdToNameMap = new Map(
  mockCustomers.map((customer, index) => [
    customer.id,
    {
      id: `customer-${index + 1}`,
      name: customer.name,
      aliases: customer.aliases,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    }
  ])
);

// Find customer name by ID
const getCustomerName = (customerId: string): string => {
  const customer = customerIdToNameMap.get(customerId);
  return customer?.name || "Unknown Customer";
};

// Convert mock data to proper format
const demoMenus: PublicMenu[] = mockMenus.map((menu) => ({
  ...menu,
  date: new Date(menu.date),
  createdAt: new Date(menu.createdAt),
  updatedAt: new Date(menu.updatedAt),
}));

const demoOrders: PublicOrder[] = mockOrders.map((order, index) => ({
  id: `order-${index + 1}`,
  customerName: order.customerName,
  date: new Date(order.date),
  delivery: order.delivery,
  note: order.note || "",
  payment: (order.payment || "UNKNOWN") as "CASH" | "ONLINE" | "UNKNOWN",
  orderItems: order.orderItems.map((item) => ({
    id: item.id,
    menuId: item.menuId,
    amount: item.amount || 0,
  })),
  totalPrice: order.totalPrice,
  sortOrder: order.sortOrder,
  status: order.status as "COMPLETED" | "PENDING",
  createdAt: new Date(order.createdAt),
  updatedAt: new Date(order.updatedAt),
}));

const calculateFinancialData = (orders: PublicOrder[]): PaymentStatus => {
  const total = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const cash = orders
    .filter((order) => order.payment === "CASH")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const online = orders
    .filter((order) => order.payment === "ONLINE")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const unknown = orders
    .filter((order) => order.payment === "UNKNOWN")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  return { total, cash, online, unknown };
};

const calculateMenuSummary = (
  menus: PublicMenu[],
  orders: PublicOrder[],
): MenuSummary[] => {
  return menus.map((menu) => {
    const menuOrders = orders.filter((order) =>
      order.orderItems.some((item) => item.menuId === menu.id),
    );

    const ordered = menuOrders.reduce((sum, order) => {
      const menuItem = order.orderItems.find((item) => item.menuId === menu.id);
      return sum + (menuItem?.amount || 0);
    }, 0);

    const picked = menuOrders
      .filter((order) => order.status === "COMPLETED")
      .reduce((sum, order) => {
        const menuItem = order.orderItems.find(
          (item) => item.menuId === menu.id,
        );
        return sum + (menuItem?.amount || 0);
      }, 0);

    const unpicked = menuOrders
      .filter((order) => order.status === "PENDING")
      .reduce((sum, order) => {
        const menuItem = order.orderItems.find(
          (item) => item.menuId === menu.id,
        );
        return sum + (menuItem?.amount || 0);
      }, 0);

    const special = menuOrders.filter(
      (order) => order.note && order.note.trim() !== "",
    ).length;

    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      menuData: {
        unpicked,
        total: menu.amount,
        ordered,
        sellable: menu.amount - ordered,
        picked,
        require: menu.amount - picked,
        special,
      },
    };
  });
};

const demoFinancialData = calculateFinancialData(demoOrders);
const demoMenuSummary = calculateMenuSummary(demoMenus, demoOrders);

interface DashboardStore {
  // Data
  menus: PublicMenu[];
  orders: PublicOrder[];
  financialData: PaymentStatus;
  menuSummary: MenuSummary[];

  // Actions
  addOrder: (
    order: Omit<PublicOrder, "id" | "createdAt" | "updatedAt">,
  ) => void;
  updateOrder: (id: string, updates: Partial<PublicOrder>) => void;
  deleteOrder: (id: string) => void;
  updateMenu: (id: string, updates: Partial<PublicMenu>) => void;
  addMenu: (menu: Omit<PublicMenu, "id" | "createdAt" | "updatedAt">) => void;
  deleteMenu: (id: string) => void;
  resetToDefault: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  menus: demoMenus,
  orders: demoOrders,
  financialData: demoFinancialData,
  menuSummary: demoMenuSummary,

  // Actions
  addOrder: (newOrder) => {
    const order: PublicOrder = {
      ...newOrder,
      id: generateUniqueId("order"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => {
      const updatedOrders = [...state.orders, order];
      return {
        orders: updatedOrders,
        financialData: calculateFinancialData(updatedOrders),
        menuSummary: calculateMenuSummary(state.menus, updatedOrders),
      };
    });
  },

  updateOrder: (id, updates) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) =>
        order.id === id
          ? { ...order, ...updates, updatedAt: new Date() }
          : order,
      );
      return {
        orders: updatedOrders,
        financialData: calculateFinancialData(updatedOrders),
        menuSummary: calculateMenuSummary(state.menus, updatedOrders),
      };
    });
  },

  deleteOrder: (id) => {
    set((state) => {
      const updatedOrders = state.orders.filter((order) => order.id !== id);
      return {
        orders: updatedOrders,
        financialData: calculateFinancialData(updatedOrders),
        menuSummary: calculateMenuSummary(state.menus, updatedOrders),
      };
    });
  },

  updateMenu: (id, updates) => {
    set((state) => {
      const updatedMenus = state.menus.map((menu) =>
        menu.id === id ? { ...menu, ...updates, updatedAt: new Date() } : menu,
      );
      return {
        menus: updatedMenus,
        menuSummary: calculateMenuSummary(updatedMenus, state.orders),
      };
    });
  },

  addMenu: (newMenu) => {
    const menu: PublicMenu = {
      ...newMenu,
      id: generateUniqueId("menu"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      menus: [...state.menus, menu],
      menuSummary: calculateMenuSummary([...state.menus, menu], state.orders),
    }));
  },

  deleteMenu: (id) => {
    set((state) => {
      const updatedMenus = state.menus.filter((menu) => menu.id !== id);
      return {
        menus: updatedMenus,
        menuSummary: calculateMenuSummary(updatedMenus, state.orders),
      };
    });
  },

  resetToDefault: () => {
    set({
      menus: demoMenus,
      orders: demoOrders,
      financialData: demoFinancialData,
      menuSummary: demoMenuSummary,
    });
  },
}));
