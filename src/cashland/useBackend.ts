// Cashland Phase 1 — React hook for backend integration
// Provides: auth state, live balance, transaction history, send/receive/deposit/withdraw actions.
// Falls back gracefully if the backend is offline (prototype-mode).

import { useState, useEffect, useRef } from 'react';
import {
  auth as authApi, account as accountApi, transactions as txApi,
  lookup as lookupApi, kyc as kycApi, disputes as disputesApi,
  setToken, clearToken,
  type ApiUser, type Balance, type ApiTransaction, type LookupResult, type KycResult,
} from './api.js';
import { saveSession, clearSession, type UserSession } from './useUserSession.js';

export type BackendStatus = 'checking' | 'online' | 'offline';

export interface BackendState {
  status: BackendStatus;
  user: ApiUser | null;
  balance: Balance | null;
  transactions: ApiTransaction[];
  loading: boolean;
  error: string | null;
}

export interface BackendActions {
  sendOtp: (phone: string) => Promise<{ devCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  register: (params: {
    phone: string; firstName: string; lastName: string;
    tag: string; pin: string; biometrics?: boolean;
  }) => Promise<ApiUser>;
  login: (phone: string, pin: string) => Promise<ApiUser>;
  logout: () => Promise<void>;
  lookupRecipient: (tagOrPhone: string) => Promise<LookupResult | null>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  send: (params: { recipientTag?: string; recipientPhone?: string; amountNgn: number; note?: string }) => Promise<{ txId: string; newBalance: number }>;
  deposit: (amountNgn: number) => Promise<{ txId: string; newBalance: number }>;
  withdraw: (params: { amountNgn: number; bankName: string; accountNumber: string; accountName: string }) => Promise<{ txId: string; newBalance: number }>;
  verifyBvn: (bvn: string) => Promise<KycResult>;
  verifyNin: (nin: string) => Promise<KycResult>;
  submitDispute: (params: { transactionId?: string; reason: string; description: string }) => Promise<{ ref: string }>;
}

const POLL_INTERVAL = 30_000;

export function useBackend(): BackendState & BackendActions {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [user, setUser] = useState<ApiUser | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [txs, setTxs] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep latest status/user in a ref so callbacks don't need to close over state
  const statusRef = useRef(status);
  statusRef.current = status;
  const userRef = useRef(user);
  userRef.current = user;

  // ── Balance / transaction fetchers (stable refs, no useCallback deps issue) ──
  async function doRefreshBalance() {
    if (statusRef.current === 'offline') return;
    try {
      const b = await accountApi.balance();
      setBalance(b);
    } catch { /* silent */ }
  }

  async function doRefreshTransactions() {
    if (statusRef.current === 'offline') return;
    try {
      const list = await txApi.list(30, 0);
      setTxs(list);
    } catch { /* silent */ }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      try {
        const base: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
        const res = await fetch(`${base}/health`);
        if (!res.ok) throw new Error('offline');
        setStatus('online');
        statusRef.current = 'online';

        const token = localStorage.getItem('cashland_token_v1');
        if (token) {
          try {
            const { user: u } = await authApi.me();
            setUser(u);
            userRef.current = u;
            await doRefreshBalance();
            await doRefreshTransactions();
          } catch {
            clearToken();
          }
        }
      } catch {
        setStatus('offline');
        statusRef.current = 'offline';
        console.warn('[useBackend] Backend offline — running in prototype mode');
      }
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll balance while logged in ─────────────────────────────────────────
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    pollRef.current = setInterval(() => { void doRefreshBalance(); }, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function sendOtp(phone: string) {
    const res = await authApi.sendOtp(phone);
    return { devCode: res.devCode };
  }

  async function verifyOtp(phone: string, code: string) {
    const res = await authApi.verifyOtp(phone, code);
    return res.valid;
  }

  async function register(params: {
    phone: string; firstName: string; lastName: string;
    tag: string; pin: string; biometrics?: boolean;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(params);
      setToken(res.sessionToken);
      setUser(res.user);
      const session: UserSession = {
        phone: params.phone,
        firstName: params.firstName,
        lastName: params.lastName,
        tag: params.tag,
        kycTier: 1,
        kycMethod: 'none',
        pinHash: '',
        biometrics: params.biometrics ?? false,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      saveSession(session);
      await doRefreshBalance();
      return res.user;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function login(phone: string, pin: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(phone, pin);
      setToken(res.sessionToken);
      setUser(res.user);
      await doRefreshBalance();
      await doRefreshTransactions();
      return res.user;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearToken();
    clearSession();
    setUser(null);
    setBalance(null);
    setTxs([]);
  }

  // ── Lookup ────────────────────────────────────────────────────────────────
  async function lookupRecipient(tagOrPhone: string): Promise<LookupResult | null> {
    if (statusRef.current === 'offline') return null;
    try {
      if (tagOrPhone.startsWith('@') || /^[a-zA-Z]/.test(tagOrPhone)) {
        return await lookupApi.byTag(tagOrPhone);
      }
      return await lookupApi.byPhone(tagOrPhone);
    } catch {
      return null;
    }
  }

  // ── Money ─────────────────────────────────────────────────────────────────
  async function send(params: { recipientTag?: string; recipientPhone?: string; amountNgn: number; note?: string }) {
    const res = await txApi.send(params);
    await doRefreshBalance();
    await doRefreshTransactions();
    return { txId: res.txId, newBalance: res.newBalance.naira };
  }

  async function deposit(amountNgn: number) {
    const res = await txApi.deposit(amountNgn);
    await doRefreshBalance();
    await doRefreshTransactions();
    return { txId: res.txId, newBalance: res.newBalance.naira };
  }

  async function withdraw(params: { amountNgn: number; bankName: string; accountNumber: string; accountName: string }) {
    const res = await txApi.withdraw(params);
    await doRefreshBalance();
    await doRefreshTransactions();
    return { txId: res.txId, newBalance: res.newBalance.naira };
  }

  // ── KYC ───────────────────────────────────────────────────────────────────
  async function verifyBvn(bvn: string) {
    const res = await kycApi.verifyBvn(bvn);
    if (res.success && userRef.current) {
      setUser({ ...userRef.current, kycTier: 2, kycMethod: 'bvn' });
    }
    return res;
  }

  async function verifyNin(nin: string) {
    const res = await kycApi.verifyNin(nin);
    if (res.success && userRef.current) {
      setUser({ ...userRef.current, kycTier: 2, kycMethod: 'nin' });
    }
    return res;
  }

  // ── Disputes ──────────────────────────────────────────────────────────────
  async function submitDispute(params: { transactionId?: string; reason: string; description: string }) {
    return disputesApi.submit(params);
  }

  return {
    status,
    user,
    balance,
    transactions: txs,
    loading,
    error,
    sendOtp,
    verifyOtp,
    register,
    login,
    logout,
    lookupRecipient,
    refreshBalance: doRefreshBalance,
    refreshTransactions: doRefreshTransactions,
    send,
    deposit,
    withdraw,
    verifyBvn,
    verifyNin,
    submitDispute,
  };
}
