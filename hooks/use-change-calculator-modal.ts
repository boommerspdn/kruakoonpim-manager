import { create } from "zustand";

interface ChangeCalculatorData {
  customerName: string;
  totalPrice: number;
}

interface UseChangeCalculatorModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  data: ChangeCalculatorData | null;
  setData: (data: ChangeCalculatorData | null) => void;
}

export const useChangeCalculatorModal = create<UseChangeCalculatorModalStore>(
  (set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    data: null,
    setData: (data) => set({ data }),
  }),
);
