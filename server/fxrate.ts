// Cashland FX Rate — live NGN/USDC from Coingecko
// Refreshes every 5 minutes. Falls back to env NGN_PER_USDC or 1559.

const FALLBACK_RATE = Number(process.env.NGN_PER_USDC ?? '1559');
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn';

let cachedRate: number = FALLBACK_RATE;
let lastFetched: Date = new Date(0);
let consecutiveFailures = 0;

export async function getLiveNgnPerUsdc(): Promise<number> {
  const now = new Date();
  const age = now.getTime() - lastFetched.getTime();

  if (age < REFRESH_INTERVAL_MS && cachedRate > 0) {
    return cachedRate;
  }

  try {
    const res = await fetch(COINGECKO_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`Coingecko HTTP ${res.status}`);

    const data = await res.json() as { 'usd-coin'?: { ngn?: number } };
    const rate = data?.['usd-coin']?.ngn;

    if (!rate || rate < 500 || rate > 5000) {
      throw new Error(`Suspicious rate from Coingecko: ${rate}`);
    }

    cachedRate = rate;
    lastFetched = now;
    consecutiveFailures = 0;
    console.log(`[fxrate] Updated NGN/USDC: ₦${rate.toLocaleString()}`);
    return rate;

  } catch (e) {
    consecutiveFailures++;
    console.warn(`[fxrate] Coingecko fetch failed (attempt ${consecutiveFailures}):`, e instanceof Error ? e.message : e);
    // Return cached rate (may be stale) or fallback
    return cachedRate > 0 ? cachedRate : FALLBACK_RATE;
  }
}

// Returns metadata about the current rate for the /health and /fx-rate endpoints
export function getFxRateMeta() {
  return {
    ngnPerUsdc: cachedRate,
    lastFetched: lastFetched.toISOString(),
    ageSeconds: Math.round((Date.now() - lastFetched.getTime()) / 1000),
    source: lastFetched.getTime() === 0 ? 'fallback' : 'coingecko',
    consecutiveFailures,
  };
}

// Eagerly warm the cache on module load
getLiveNgnPerUsdc().catch(() => {/* fallback already set */});
