import { create } from 'zustand';

const useAlertStore = create((set) => ({
  badgeCount: 0,
  increment: () => set((s) => ({ badgeCount: s.badgeCount + 1 })),
  reset:     () => set({ badgeCount: 0 }),
}));

export default useAlertStore;
