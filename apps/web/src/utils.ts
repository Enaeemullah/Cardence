export const fmt = {
  money: (minorUnits: string | null | undefined, currency = 'USD'): string => {
    if (minorUnits == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      Number(minorUnits) / 100,
    );
  },
  date: (iso: string | null | undefined): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  },
  datetime: (iso: string | null | undefined): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  },
  id: (id: string): string => id.slice(0, 8) + '…',
  expiry: (month: number, year: number): string =>
    `${String(month).padStart(2, '0')}/${year}`,
};
