// useUserSession — localStorage-persisted user session for Cashland prototype
// Survives page refresh, tab close, and browser restart.
// In production this would be a server-side JWT + encrypted device token.

export interface UserSession {
  phone: string;
  firstName: string;
  lastName: string;
  tag: string;
  kycTier: 1 | 2 | 3;
  kycMethod: 'bvn' | 'nin' | 'none';
  pinHash: string; // SHA-256 hex of the PIN — never store raw PIN
  biometrics: boolean;
  createdAt: string; // ISO date
  lastActiveAt: string; // ISO date
}

const KEY = 'cashland_session_v1';

export function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function updateSession(patch: Partial<UserSession>): void {
  const existing = loadSession();
  if (!existing) return;
  saveSession({ ...existing, ...patch, lastActiveAt: new Date().toISOString() });
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// Lightweight PIN hash — prototype only.
// In production, use bcrypt/argon2 server-side.
export async function hashPin(pin: string): Promise<string> {
  const buf = new TextEncoder().encode('cashland:' + pin);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}

// Touch the lastActiveAt timestamp on every meaningful user action
export function touchSession(): void {
  updateSession({ lastActiveAt: new Date().toISOString() });
}
