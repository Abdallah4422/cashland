// Cashland FX Rates — multi-currency support
// NGN/USDC rate is fetched live from the Cashland backend (/api/fx-rate),
// which pulls from Coingecko every 5 minutes.
// USD and GBP rates use USDC peg and a static GBP/USD cross rate.

import { useState, useEffect, useCallback } from 'react';

export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  NGN: 'Naira',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
};

const FALLBACK_NGN = 1559;
const GBP_PER_USDC = 0.79;  // approximate GBP/USD cross
const EUR_PER_USDC = 0.92;  // approximate EUR/USD cross

export interface FxRates {
  rates: Record<Currency, number>;
  updatedAt: Date;
  isRefreshing: boolean;
  refresh: () => void;
}

let globalRates: Record<Currency, number> = {
  NGN: FALLBACK_NGN,
  USD: 1.00,
  EUR: EUR_PER_USDC,
  GBP: GBP_PER_USDC,
};
let globalUpdatedAt = new Date(0);
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function fetchLiveRates(): Promise<void> {
  try {
    const res = await fetch('/api/fx-rate', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { ngnPerUsdc?: number };
    const ngn = data?.ngnPerUsdc;
    if (ngn && ngn > 500 && ngn < 10000) {
      globalRates = { NGN: ngn, USD: 1.00, EUR: EUR_PER_USDC, GBP: GBP_PER_USDC };
      globalUpdatedAt = new Date();
      notifyListeners();
    }
  } catch {
    // keep using last cached or fallback rates — no console noise
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;

function startRefreshTimer() {
  if (refreshTimer) return;
  void fetchLiveRates();
  refreshTimer = setInterval(() => { void fetchLiveRates(); }, 5 * 60 * 1000);
}

export function useFxRates(): FxRates {
  const [, forceRender] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const cb = () => forceRender(n => n + 1);
    listeners.add(cb);
    startRefreshTimer();
    return () => { listeners.delete(cb); };
  }, []);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchLiveRates().then(() => { setIsRefreshing(false); });
  }, []);

  return { rates: globalRates, updatedAt: globalUpdatedAt, isRefreshing, refresh };
}

// ── Formatting helpers ──────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: Currency, decimals = 2): string {
  const sym = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);
  const opts: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };
  const formatted = sym + abs.toLocaleString('en-US', opts);
  return amount < 0 ? '-' + formatted : formatted;
}

// Convert a Naira amount to another currency via USDC
export function convertFromNgn(ngnAmount: number, toCurrency: Currency, rates: Record<Currency, number>): number {
  if (toCurrency === 'NGN') return ngnAmount;
  const usdc = ngnAmount / rates.NGN;
  return usdc * rates[toCurrency];
}

// Convert from any currency back to NGN
export function convertToNgn(amount: number, fromCurrency: Currency, rates: Record<Currency, number>): number {
  if (fromCurrency === 'NGN') return amount;
  const usdc = amount / rates[fromCurrency];
  return usdc * rates.NGN;
}

// Convert USDC directly to any currency
export function usdcToCurrency(usdc: number, currency: Currency, rates: Record<Currency, number>): number {
  return usdc * rates[currency];
}

// Format a USDC balance in the chosen currency
export function formatUsdcAs(usdc: number, currency: Currency, rates: Record<Currency, number>): string {
  const converted = usdcToCurrency(usdc, currency, rates);
  const decimals = currency === 'NGN' ? 2 : 2;
  return formatCurrency(converted, currency, decimals);
}

// Show all equivalents for an amount in NGN
export function getFxBreakdown(ngnAmount: number, rates: Record<Currency, number>): string {
  const usd = convertFromNgn(ngnAmount, 'USD', rates);
  const eur = convertFromNgn(ngnAmount, 'EUR', rates);
  const gbp = convertFromNgn(ngnAmount, 'GBP', rates);
  return `$${usd.toFixed(2)} · €${eur.toFixed(2)} · £${gbp.toFixed(2)}`;
}

// Currency preference stored in localStorage
const PREF_KEY = 'cashland_currency';

export function loadCurrencyPref(): Currency {
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === 'NGN' || v === 'USD' || v === 'EUR' || v === 'GBP') return v;
  } catch { /* ignore */ }
  return 'NGN';
}

export function saveCurrencyPref(c: Currency): void {
  try { localStorage.setItem(PREF_KEY, c); } catch { /* ignore */ }
}
