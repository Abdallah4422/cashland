// Cashland Phase 1 — Frontend API client
// All calls go through /api/* which Vite proxies to the backend on port 3001.
// The session token is stored in localStorage alongside the session data.

const BASE = '/api';

function getToken(): string | null {
  try {
    return localStorage.getItem('cashland_token_v1');
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem('cashland_token_v1', token);
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem('cashland_token_v1');
  } catch {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown, auth = true) => request<T>('POST', path, body, auth);

// ─── AUTH ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  tag: string;
  kycTier: 1 | 2 | 3;
  kycMethod: string;
  biometrics: boolean;
  createdAt: string;
}

export const auth = {
  sendOtp: (phone: string) =>
    post<{ sent: boolean; devCode?: string }>('/auth/otp/send', { phone }, false),

  verifyOtp: (phone: string, code: string) =>
    post<{ valid: boolean }>('/auth/otp/verify', { phone, code }, false),

  register: (params: {
    phone: string; firstName: string; lastName: string;
    tag: string; pin: string; biometrics?: boolean;
  }) => post<{ user: ApiUser; sessionToken: string }>('/auth/register', params, false),

  login: (phone: string, pin: string) =>
    post<{ user: ApiUser; sessionToken: string }>('/auth/login', { phone, pin }, false),

  logout: () => post<{ ok: boolean }>('/auth/logout', {}),

  me: () => get<{ user: ApiUser }>('/auth/me'),
};

// ─── ACCOUNT ──────────────────────────────────────────────────────────────

export interface Balance {
  ngn: { kobo: string; naira: number };
  usdc: { units: string; usdc: number };
}

export interface VirtualAccount {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  reference: string;
}

export const account = {
  balance: () => get<Balance>('/account/balance'),
  virtual: () => get<VirtualAccount>('/account/virtual'),
};

// ─── LOOKUP ───────────────────────────────────────────────────────────────

export interface LookupResult {
  firstName: string;
  lastName: string;
  tag: string;
  phoneHash?: string;
}

export const lookup = {
  byTag: (tag: string) => get<LookupResult>(`/lookup/tag/${encodeURIComponent(tag.replace(/^@/, ''))}`),
  byPhone: (phone: string) => get<LookupResult>(`/lookup/phone/${encodeURIComponent(phone)}`),
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────

export interface ApiTransaction {
  id: string;
  type: string;
  status: string;
  amountNgn: number;
  note: string | null;
  recipientName: string | null;
  recipientTag: string | null;
  merchantName: string | null;
  txHash: string | null;
  createdAt: string;
  completedAt: string | null;
  direction: 'in' | 'out';
}

export const transactions = {
  list: (limit = 20, offset = 0) =>
    get<ApiTransaction[]>(`/transactions?limit=${limit}&offset=${offset}`),

  send: (params: {
    recipientTag?: string;
    recipientPhone?: string;
    amountNgn: number;
    note?: string;
  }) => post<{ txId: string; newBalance: { naira: number } }>('/transactions/send', params),

  deposit: (amountNgn: number) =>
    post<{ txId: string; reference: string; newBalance: { naira: number } }>('/transactions/deposit', { amountNgn }),

  withdraw: (params: {
    amountNgn: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => post<{ txId: string; reference: string; newBalance: { naira: number } }>('/transactions/withdraw', params),
};

// ─── KYC ──────────────────────────────────────────────────────────────────

export interface KycResult {
  success: boolean;
  tier: 1 | 2 | 3;
  nameMatch: boolean;
  status: string;
  providerRef: string;
  maskedName?: string;
  reason?: string;
}

export const kyc = {
  verifyBvn: (bvn: string) => post<KycResult>('/kyc/bvn', { bvn }),
  verifyNin: (nin: string) => post<KycResult>('/kyc/nin', { nin }),
};

// ─── DISPUTES ─────────────────────────────────────────────────────────────

export const disputes = {
  submit: (params: { transactionId?: string; reason: string; description: string }) =>
    post<{ ref: string; status: string; message: string }>('/disputes', params),

  list: () => get<{ ref: string; transaction_id: string | null; reason: string; status: string; created_at: string }[]>('/disputes'),
};

// ─── HEALTH ───────────────────────────────────────────────────────────────

export const health = {
  check: () => get<{ ok: boolean; ts: string }>('/health'),
};
