// Cashland Phase 2 — In-memory rate limiting + fraud velocity rules
// Uses an in-memory store (Map) — sufficient for a single-process server.
// In production, replace with Redis for multi-instance deployments.

interface Window { count: number; windowStart: number }

const store = new Map<string, Window>();

function getWindow(key: string, windowMs: number): Window {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || now - existing.windowStart > windowMs) {
    const w = { count: 0, windowStart: now };
    store.set(key, w);
    return w;
  }
  return existing;
}

// Returns true if the request should be blocked
export function rateLimitExceeded(key: string, maxRequests: number, windowMs: number): boolean {
  const w = getWindow(key, windowMs);
  w.count++;
  return w.count > maxRequests;
}

// Cleanup old windows every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of store.entries()) {
    if (now - w.windowStart > 10 * 60 * 1000) store.delete(key);
  }
}, 5 * 60 * 1000);

// ─── VELOCITY FRAUD RULES ─────────────────────────────────────────────────────
// These run on every successful send-money request server-side.
// A flagged transaction is declined with a FRAUD_VELOCITY error.
// Rules are stored in-memory; in production persist flags to DB for audit trail.

const velocityStore = new Map<string, { amounts: number[]; timestamps: number[]; beneficiaries: string[] }>();

function getUserVelocity(userId: string) {
  if (!velocityStore.has(userId)) {
    velocityStore.set(userId, { amounts: [], timestamps: [], beneficiaries: [] });
  }
  return velocityStore.get(userId)!;
}

function pruneOld(velocity: ReturnType<typeof getUserVelocity>, windowMs: number) {
  const cutoff = Date.now() - windowMs;
  const keep = velocity.timestamps.map((t, i) => t > cutoff ? i : -1).filter(i => i >= 0);
  velocity.amounts = keep.map(i => velocity.amounts[i]);
  velocity.timestamps = keep.map(i => velocity.timestamps[i]);
  velocity.beneficiaries = keep.map(i => velocity.beneficiaries[i]);
}

export interface VelocityCheckParams {
  userId: string;
  amountKobo: bigint;
  recipientId: string;
  isNewRecipient: boolean; // first transfer to this recipient
}

export interface VelocityResult {
  blocked: boolean;
  reason?: string;
  flagged: boolean;
  flags: string[];
}

export function checkVelocity(params: VelocityCheckParams): VelocityResult {
  const { userId, amountKobo, recipientId, isNewRecipient } = params;
  const v = getUserVelocity(userId);
  const flags: string[] = [];

  // Prune to 1-hour window
  pruneOld(v, 60 * 60 * 1000);

  const amountNaira = Number(amountKobo) / 100;
  const now = Date.now();

  // Rule 1: More than 5 transfers in 5 minutes
  const fiveMinAgo = now - 5 * 60 * 1000;
  const recentCount = v.timestamps.filter(t => t > fiveMinAgo).length;
  if (recentCount >= 5) {
    return { blocked: true, reason: 'Too many transfers in a short period. Please wait a few minutes.', flagged: true, flags: ['HIGH_FREQUENCY'] };
  }

  // Rule 2: Single transaction over ₦200,000 to a new recipient
  if (isNewRecipient && amountNaira > 200_000) {
    flags.push('LARGE_NEW_RECIPIENT');
  }

  // Rule 3: More than 3 different beneficiaries in 10 minutes
  const tenMinAgo = now - 10 * 60 * 1000;
  const recentBeneficiaries = new Set(
    v.beneficiaries.filter((_, i) => v.timestamps[i] > tenMinAgo)
  );
  recentBeneficiaries.add(recipientId);
  if (recentBeneficiaries.size > 3) {
    flags.push('MANY_BENEFICIARIES');
  }

  // Rule 4: Total 1-hour volume over ₦500,000
  const hourlyVolume = v.amounts.reduce((sum, a) => sum + a, 0) + amountNaira;
  if (hourlyVolume > 500_000) {
    flags.push('HIGH_HOURLY_VOLUME');
  }

  // Rule 5: Round-number large transfer (common in structuring)
  if (amountNaira >= 50_000 && amountNaira % 10_000 === 0) {
    flags.push('ROUND_NUMBER_LARGE');
  }

  // Record this transaction in velocity store
  v.amounts.push(amountNaira);
  v.timestamps.push(now);
  v.beneficiaries.push(recipientId);

  const flagged = flags.length >= 2; // 2+ flags = AML flag for review
  return { blocked: false, flagged, flags };
}

export function recordTransaction(userId: string, amountNaira: number, recipientId: string) {
  const v = getUserVelocity(userId);
  pruneOld(v, 60 * 60 * 1000);
  v.amounts.push(amountNaira);
  v.timestamps.push(Date.now());
  v.beneficiaries.push(recipientId);
}
