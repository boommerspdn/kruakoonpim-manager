import { PublicCustomer } from "@/app/types/customer";
import { create } from "zustand";

interface useCustomerModalStore<T> {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  data: T | null;
  setData: (object: T) => void;
}

export const useCustomerModal = create<
  useCustomerModalStore<PublicCustomer | null>
>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  data: null,
  setData: (data: PublicCustomer | null) => set(() => ({ data: data })),
}));
