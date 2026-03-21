import { create } from 'zustand';
import { PaymentStatus, MenuSummary } from '@/app/types/dashboard';
import { PublicMenu } from '@/app/types/menu';
import { PublicOrder } from '@/app/types/order';

// Demo data for today
const today = new Date().toISOString().split('T')[0];

const demoMenus: PublicMenu[] = [
  {
    id: 'menu-1',
    name: 'ข้าวผัด',
    date: new Date(today),
    price: 50,
    amount: 20,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'menu-2',
    name: 'กะเพราหมูกรอบ',
    date: new Date(today),
    price: 60,
    amount: 15,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'menu-3',
    name: 'ผัดซีอิ๊ว',
    date: new Date(today),
    price: 55,
    amount: 10,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const demoOrders: PublicOrder[] = [
  {
    id: 'order-1',
    customerName: 'สมชาย ใจดี',
    date: new Date(today),
    delivery: false,
    note: 'ไม่ใส่ผัก',
    payment: 'CASH',
    orderItems: [
      {
        id: 'item-1',
        menuId: 'menu-1',
        amount: 2,
      },
      {
        id: 'item-2',
        menuId: 'menu-2',
        amount: 1,
      },
    ],
    totalPrice: 160,
    sortOrder: 0,
    status: 'COMPLETED',
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: 'order-2',
    customerName: 'สมหญิง รักดี',
    date: new Date(today),
    delivery: true,
    note: 'เผ็ดมากๆ',
    payment: 'ONLINE',
    orderItems: [
      {
        id: 'item-3',
        menuId: 'menu-2',
        amount: 1,
      },
    ],
    totalPrice: 60,
    sortOrder: 1,
    status: 'PENDING',
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: 'order-3',
    customerName: 'วิชัย มั่นคง',
    date: new Date(today),
    delivery: false,
    note: '',
    payment: 'UNKNOWN',
    orderItems: [
      {
        id: 'item-4',
        menuId: 'menu-3',
        amount: 3,
      },
    ],
    totalPrice: 165,
    sortOrder: 2,
    status: 'PENDING',
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: 'order-4',
    customerName: 'มานี ขยันหมด',
    date: new Date(today),
    delivery: false,
    note: 'เพิ่มไข่',
    payment: 'CASH',
    orderItems: [
      {
        id: 'item-5',
        menuId: 'menu-1',
        amount: 1,
      },
      {
        id: 'item-6',
        menuId: 'menu-3',
        amount: 2,
      },
    ],
    totalPrice: 160,
    sortOrder: 3,
    status: 'COMPLETED',
    updatedAt: new Date(),
    createdAt: new Date(),
  },
];

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const calculateFinancialData = (orders: PublicOrder[]): PaymentStatus => {
  const total = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const cash = orders
    .filter(order => order.payment === 'CASH')
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const online = orders
    .filter(order => order.payment === 'ONLINE')
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const unknown = orders
    .filter(order => order.payment === 'UNKNOWN')
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  return { total, cash, online, unknown };
};

const calculateMenuSummary = (menus: PublicMenu[], orders: PublicOrder[]): MenuSummary[] => {
  return menus.map(menu => {
    const menuOrders = orders.filter(order => 
      order.orderItems.some(item => item.menuId === menu.id)
    );

    const ordered = menuOrders.reduce((sum, order) => {
      const menuItem = order.orderItems.find(item => item.menuId === menu.id);
      return sum + (menuItem?.amount || 0);
    }, 0);

    const picked = menuOrders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => {
        const menuItem = order.orderItems.find(item => item.menuId === menu.id);
        return sum + (menuItem?.amount || 0);
      }, 0);

    const unpicked = menuOrders
      .filter(order => order.status === 'PENDING')
      .reduce((sum, order) => {
        const menuItem = order.orderItems.find(item => item.menuId === menu.id);
        return sum + (menuItem?.amount || 0);
      }, 0);

    const special = menuOrders.filter(order => order.note && order.note.trim() !== '').length;

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
  addOrder: (order: Omit<PublicOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, updates: Partial<PublicOrder>) => void;
  deleteOrder: (id: string) => void;
  updateMenu: (id: string, updates: Partial<PublicMenu>) => void;
  addMenu: (menu: Omit<PublicMenu, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
      id: generateUniqueId('order'),
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
      const updatedOrders = state.orders.map(order =>
        order.id === id
          ? { ...order, ...updates, updatedAt: new Date() }
          : order
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
      const updatedOrders = state.orders.filter(order => order.id !== id);
      return {
        orders: updatedOrders,
        financialData: calculateFinancialData(updatedOrders),
        menuSummary: calculateMenuSummary(state.menus, updatedOrders),
      };
    });
  },

  updateMenu: (id, updates) => {
    set((state) => {
      const updatedMenus = state.menus.map(menu =>
        menu.id === id
          ? { ...menu, ...updates, updatedAt: new Date() }
          : menu
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
      id: generateUniqueId('menu'),
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
      const updatedMenus = state.menus.filter(menu => menu.id !== id);
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
