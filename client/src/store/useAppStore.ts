import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  onboardingDone: boolean;
  pinnedCategories: string[];
  completeOnboarding: () => void;
  togglePinnedCategory: (category: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      pinnedCategories: [],
      completeOnboarding: () => set({ onboardingDone: true }),
      togglePinnedCategory: (category) => {
        const current = get().pinnedCategories;
        set({
          pinnedCategories: current.includes(category)
            ? current.filter((c) => c !== category)
            : [...current, category],
        });
      },
    }),
    { name: 'finance-app' },
  ),
);
