import { create } from 'zustand';
import { Customer, CustomerFormValues, PublicCustomer } from '@/app/types/customer';
import mockCustomers from '@/lib/data/mock-customers.json';

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Demo customer data
const demoCustomers: PublicCustomer[] = mockCustomers.map((customer, index) => ({
  ...customer,
  id: `customer-${index + 1}`,
  createdAt: new Date(customer.createdAt),
  updatedAt: new Date(customer.updatedAt),
}));

interface CustomerStore {
  // Data
  customers: PublicCustomer[];
  
  // Actions
  addCustomer: (customer: CustomerFormValues) => void;
  updateCustomer: (id: string, updates: CustomerFormValues) => void;
  deleteCustomer: (id: string) => void;
  resetToDefault: () => void;
  getCustomerByName: (name: string) => PublicCustomer | undefined;
  getCustomerByAlias: (alias: string) => PublicCustomer | undefined;
  searchCustomers: (query: string) => PublicCustomer[];
  getCustomerByOriginalId: (originalId: string) => PublicCustomer | undefined;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  // Initial state
  customers: demoCustomers,

  // Actions
  addCustomer: (customerData) => {
    const customer: PublicCustomer = {
      id: generateUniqueId('customer'),
      name: customerData.name || '',
      aliases: customerData.aliases || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      customers: [...state.customers, customer].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers
        .map((customer) =>
          customer.id === id
            ? {
                ...customer,
                ...updates,
                name: updates.name || customer.name,
                aliases: updates.aliases || customer.aliases,
                updatedAt: new Date(),
              }
            : customer,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((customer) => customer.id !== id),
    }));
  },

  resetToDefault: () => {
    set({
      customers: demoCustomers,
    });
  },

  getCustomerByName: (name) => {
    return get().customers.find((customer) => 
      customer.name.toLowerCase() === name.toLowerCase()
    );
  },

  getCustomerByAlias: (alias) => {
    return get().customers.find((customer) =>
      customer.aliases.some((a) => a.toLowerCase() === alias.toLowerCase())
    );
  },

  searchCustomers: (query) => {
    const { customers } = get();
    if (!query.trim()) return customers;
    
    const lowercaseQuery = query.toLowerCase();
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.aliases.some((alias) => alias.toLowerCase().includes(lowercaseQuery))
    );
  },

  // Helper to get customer by original ID from mock data
  getCustomerByOriginalId: (originalId: string) => {
    return get().customers.find((customer) => customer.id === originalId);
  },
}));

// Export helper for other stores
export const getCustomerNameById = (customerId: string): string => {
  const customer = demoCustomers.find((c) => c.id === customerId);
  return customer?.name || "Unknown Customer";
};
