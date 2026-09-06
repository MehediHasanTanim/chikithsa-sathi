export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';

/** Dates are persisted as UTC; this is for presentation only. */
export function formatInBangladeshTime(date: Date, locale = 'en-BD'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: BANGLADESH_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function nowUtc(): Date {
  return new Date();
}
