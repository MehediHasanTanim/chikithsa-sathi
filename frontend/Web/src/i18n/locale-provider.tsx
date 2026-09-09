'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { translations, type TranslationKey } from '@/i18n/translations';
import { useAppStore } from '@/stores/app-store';

type LocaleContextValue = {
  locale: 'en' | 'bn';
  setLocale: (locale: 'en' | 'bn') => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  useEffect(() => {
    document.documentElement.lang = locale === 'bn' ? 'bn' : 'en';
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: (key) => translations[locale][key] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
