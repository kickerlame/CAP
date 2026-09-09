// ============================================================
// VPPT — src/utils/formatters.ts
// Formatters for currency, dates, percentages, and metrics.
// ============================================================

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'RM 0.00';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return 'RM 0.00';
  return `RM ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';
  const val = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US').format(val);
}

export function formatPct(val: number | string | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || val === '') return '0.0%';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatHours(hours: number | string | null | undefined): string {
  if (hours === null || hours === undefined || hours === '') return '—';
  const h = typeof hours === 'number' ? hours : parseFloat(String(hours));
  if (isNaN(h)) return '—';
  if (h < 24) return `${h.toFixed(1)} hrs`;
  const days = (h / 24).toFixed(1);
  return `${days} days (${h.toFixed(0)} hrs)`;
}
