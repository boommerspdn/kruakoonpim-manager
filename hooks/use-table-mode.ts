import { create } from "zustand";

type TableModeStoreState = {
  tableMode: "edit" | "default";
};

type TableModeStoreActions = {
  setTableMode: (value: "edit" | "default") => void;
};

type TableModeStore = TableModeStoreState & TableModeStoreActions;

export const useTableModeStore = create<TableModeStore>((set) => ({
  tableMode: "default",
  setTableMode: (value) => set({ tableMode: value }),
}));
