'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'light' | 'dark' | 'system';
export type AppLocale = 'en' | 'bn';

type AppState = {
  theme: AppTheme;
  locale: AppLocale;
  selectedChamberId: string | null;
  selectedChamberName: string | null;
  sidebarCollapsed: boolean;
  setTheme: (theme: AppTheme) => void;
  setLocale: (locale: AppLocale) => void;
  setSelectedChamber: (id: string | null, name: string | null) => void;
  toggleSidebar: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: 'en',
      selectedChamberId: null,
      selectedChamberName: null,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setSelectedChamber: (selectedChamberId, selectedChamberName) =>
        set({ selectedChamberId, selectedChamberName }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'chambercare-app' },
  ),
);
