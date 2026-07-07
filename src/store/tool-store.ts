import { create } from "zustand";

interface ToolStore {
  activeToolId: string | null;
  setActiveTool: (id: string | null) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
  activeToolId: null,
  setActiveTool: (id) => set({ activeToolId: id }),
}));