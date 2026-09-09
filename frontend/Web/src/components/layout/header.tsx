'use client';

import {
  Bell,
  ChevronDown,
  CircleHelp,
  Menu,
  Moon,
  Search,
  Sun,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { useLocale } from '@/i18n/locale-provider';
import { useAppStore } from '@/stores/app-store';

export function Header({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const setChamber = useAppStore((state) => state.setSelectedChamber);
  const [chamber, setChamberValue] = useState('City Care Chamber');
  return (
    <header className="care-header">
      <Button
        variant="ghost"
        size="sm"
        className="care-menu-button"
        onClick={onOpenNavigation}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <div className="care-search">
        <Search className="size-4" />
        <Input
          placeholder="Search patients, appointments, prescriptions..."
          aria-label={t('search')}
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="care-header-spacer" />
      <label className="care-chamber-select">
        <MapPin className="size-4" />
        <Select
          aria-label={t('selectChamber')}
          value={chamber}
          onChange={(event) => {
            setChamberValue(event.target.value);
            setChamber(event.target.value, event.target.value);
          }}
        >
          <option>City Care Chamber</option>
          <option>Popular Medical Center</option>
          <option>Health Point Clinic</option>
        </Select>
        <ChevronDown className="size-4" />
      </label>
      <div className="care-date">
        <CalendarDays className="size-4" />
        <span>
          <b>Today</b>
          <small>Sun, 7 Sep 2026</small>
        </span>
      </div>
      <div className="care-header-icon">
        <Bell className="size-[18px]" />
        <i>3</i>
      </div>
      <Button variant="ghost" size="sm" className="care-header-icon" aria-label="Help and support">
        <CircleHelp className="size-[18px]" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="care-theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </Button>
      <Select
        aria-label="Language"
        className="care-language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'en' | 'bn')}
      >
        <option value="en">EN</option>
        <option value="bn">বাং</option>
      </Select>
      <div className="care-profile">
        <span>DR</span>
        <div>
          <b>Dr. Arafat Rahman</b>
          <small>MBBS, FCPS (Medicine)</small>
        </div>
        <ChevronDown className="size-4" />
      </div>
    </header>
  );
}
