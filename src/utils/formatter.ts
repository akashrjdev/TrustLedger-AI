import { RiskLevel, InvestigationStatus } from '../types';

/**
 * Formats currency in Indian numbering format (e.g. ₹1,25,000)
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const val = Number(amount || 0);
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${val.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
}

/**
 * Formats date into readable string, e.g. 21 Nov 2026, 04:30 PM
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats simple date, e.g. 21 Nov 2026
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Masks bank account number, keeping last 4 digits (e.g. *******4819)
 */
export function maskBankAccount(accountNo: string): string {
  if (!accountNo) return '—';
  const clean = accountNo.trim();
  if (clean.length <= 4) return clean;
  return '*'.repeat(Math.max(4, clean.length - 4)) + clean.slice(-4);
}

/**
 * Returns Tailwind classNames for RiskLevel badges
 */
export function getRiskBadgeClasses(level: RiskLevel): { bg: string; text: string; border: string; label: string } {
  switch (level) {
    case 'Safe':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        label: 'Safe',
      };
    case 'Suspicious':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-300',
        label: 'Suspicious',
      };
    case 'High Risk':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'High Risk',
      };
    case 'Blocked':
      return {
        bg: 'bg-rose-950',
        text: 'text-white',
        border: 'border-rose-900',
        label: 'Blocked',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        label: level,
      };
  }
}

/**
 * Returns status badge classes for InvestigationStatus
 */
export function getInvestigationBadgeClasses(status: InvestigationStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Under Investigation':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
    case 'Confirmed Fraud':
      return { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400' };
    case 'False Positive':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'Resolved':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
  }
}
