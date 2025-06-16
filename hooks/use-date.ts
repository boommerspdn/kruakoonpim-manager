import { create } from "zustand";

type dateStoreState = {
  date: Date | undefined;
};

type dateStoreActions = {
  setDate: (newDate: Date | undefined) => void;
};

type dateStore = dateStoreState & dateStoreActions;

export const useDateStore = create<dateStore>((set) => ({
  date: new Date(),
  setDate: (newDate) => set({ date: newDate }),
}));
