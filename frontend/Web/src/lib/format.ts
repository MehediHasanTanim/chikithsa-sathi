export function formatDate(value: Date | string, locale = 'en-BD') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Dhaka' }).format(
    new Date(value),
  );
}

export function formatTime(value: Date | string, locale = 'en-BD') {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(
    new Date(value),
  );
}

export function formatCurrency(value: number, locale = 'en-BD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}
