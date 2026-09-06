const BANGLADESH_MOBILE_PATTERN = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

export function normalizeBangladeshPhone(phone: string): string {
  const normalized = phone.replace(/[\s()-]/g, '');
  if (normalized.startsWith('01')) return `+880${normalized.slice(1)}`;
  if (normalized.startsWith('8801')) return `+${normalized}`;
  return normalized;
}

export function isBangladeshPhone(phone: string): boolean {
  return BANGLADESH_MOBILE_PATTERN.test(phone.replace(/[\s()-]/g, ''));
}
