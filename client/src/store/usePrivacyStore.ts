import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrivacyState {
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
  setAmountsHidden: (hidden: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      amountsHidden: false,
      toggleAmountsHidden: () => set((s) => ({ amountsHidden: !s.amountsHidden })),
      setAmountsHidden: (hidden) => set({ amountsHidden: hidden }),
    }),
    { name: 'finance-privacy' },
  ),
);
