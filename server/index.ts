// Cashland Phase 2 — Backend API Server
// Phase 2 additions:
//   - Rate limiting on auth endpoints
//   - Fraud velocity rules on send-money
//   - Real SMS OTP via Termii (falls back to devCode without TERMII_API_KEY)
//   - Real BVN/NIN verification via Dojah (falls back to mock without DOJAH_API_KEY)
//   - USDC<->NGN settlement bridge (sync onchain balance to ledger)
//   - Paystack webhook with real HMAC-SHA512 signature verification
//   - Wallet address registration for USDC sync

import { createHmac, timingSafeEqual } from 'node:crypto';
import { runMigrations, query, queryOne } from './db.js';
import {
  sendOtp, verifyOtp, registerUser, loginWithPin,
  validateSession, revokeSession,
  lookupByTag, lookupByPhoneHash, getVirtualAccount
} from './auth.js';
import {
  getBalanceByUser, getTransactions, transferNgn,
  creditDeposit, debitWithdrawal
} from './ledger.js';
import { verifyBvn, verifyNin } from './kyc.js';
import { sha256, generateDisputeRef, nanoid } from './crypto.js';
import { rateLimitExceeded, checkVelocity } from './ratelimit.js';
import { sendSms } from './sms.js';
import { dojahVerifyBvn, dojahVerifyNin } from './dojah.js';
import { syncUsdcToLedger, registerWallet, getUserWallets } from './settlement.js';
import { getLiveNgnPerUsdc, getFxRateMeta } from './fxrate.js';
import type { Address } from 'viem';

const PORT = 3001;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try { return (await req.json()) as Record<string, unknown>; }
  catch { return {}; }
}

async function parseRawBody(req: Request): Promise<{ text: string; parsed: Record<string, unknown> }> {
  const text = await req.text();
  try { return { text, parsed: JSON.parse(text) as Record<string, unknown> }; }
  catch { return { text, parsed: {} }; }
}

function str(v: unknown): string {
  return String(v ?? '').trim();
}

function ip(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

async function requireAuth(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (!token) return null;
  return validateSession(token);
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {

    // ── AUTH ──────────────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/auth/otp/send') {
      const clientIp = ip(req);
      // 5 OTP requests per IP per 10 minutes
      if (rateLimitExceeded(`otp:${clientIp}`, 5, 10 * 60 * 1000)) {
        return err('Too many verification requests. Please wait and try again.', 429);
      }

      const body = await parseBody(req);
      const phone = str(body.phone);
      if (!phone) return err('phone required');

      const result = await sendOtp(phone);

      // Send real SMS if Termii is configured; devCode is returned regardless
      const smsMessage = `Your Cashland verification code is: ${result.devCode ?? '------'}. Valid for 10 minutes. Do not share with anyone.`;
      const smsResult = await sendSms({ phone, message: smsMessage });

      return json({
        sent: true,
        provider: smsResult.provider,
        // devCode is only returned when no SMS key is set — safe for development
        ...(smsResult.provider === 'dev' && { devCode: result.devCode }),
      });
    }

    if (method === 'POST' && path === '/auth/otp/verify') {
      const body = await parseBody(req);
      const { phone, code } = body;
      if (!phone || !code) return err('phone and code required');
      // 10 attempts per phone per 10 minutes
      if (rateLimitExceeded(`otp-verify:${str(phone)}`, 10, 10 * 60 * 1000)) {
        return err('Too many attempts. Please request a new code.', 429);
      }
      const valid = await verifyOtp(str(phone), str(code));
      return json({ valid });
    }

    if (method === 'POST' && path === '/auth/register') {
      const clientIp = ip(req);
      if (rateLimitExceeded(`register:${clientIp}`, 10, 60 * 60 * 1000)) {
        return err('Too many registration attempts.', 429);
      }
      const body = await parseBody(req);
      const { phone, firstName, lastName, tag, pin, biometrics } = body;
      if (!phone || !firstName || !lastName || !tag || !pin) return err('Missing required fields');
      try {
        const result = await registerUser({
          phone: str(phone), firstName: str(firstName),
          lastName: str(lastName), tag: str(tag),
          pin: str(pin), biometrics: Boolean(biometrics),
        });
        return json({ user: serializeUser(result.user), sessionToken: result.sessionToken });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Registration failed';
        if (msg === 'PHONE_OR_TAG_TAKEN') return err('Phone number or CashTag already in use', 409);
        throw e;
      }
    }

    if (method === 'POST' && path === '/auth/login') {
      const clientIp = ip(req);
      // 10 login attempts per IP per 15 minutes (brute-force protection)
      if (rateLimitExceeded(`login:${clientIp}`, 10, 15 * 60 * 1000)) {
        return err('Too many login attempts. Please try again later.', 429);
      }
      const body = await parseBody(req);
      const result = await loginWithPin(str(body.phone), str(body.pin));
      if (!result) return err('Invalid phone or PIN', 401);
      return json({ user: serializeUser(result.user), sessionToken: result.sessionToken });
    }

    if (method === 'POST' && path === '/auth/logout') {
      const auth = req.headers.get('Authorization') ?? '';
      const token = auth.replace(/^Bearer\s+/, '');
      if (token) await revokeSession(token);
      return json({ ok: true });
    }

    if (method === 'GET' && path === '/auth/me') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      return json({ user: serializeUser(user) });
    }

    // ── LOOKUP ────────────────────────────────────────────────────────────────

    if (method === 'GET' && path.startsWith('/lookup/tag/')) {
      const tag = path.split('/lookup/tag/')[1];
      const result = await lookupByTag(tag);
      if (!result) return err('User not found', 404);
      return json(result);
    }

    if (method === 'GET' && path.startsWith('/lookup/phone/')) {
      const rawPhone = path.split('/lookup/phone/')[1];
      const phoneHash = sha256(`phone:${rawPhone}`);
      const result = await lookupByPhoneHash(phoneHash);
      if (!result) return err('User not found', 404);
      return json(result);
    }

    // ── ACCOUNT ───────────────────────────────────────────────────────────────

    if (method === 'GET' && path === '/account/balance') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const ngnKobo = await getBalanceByUser(user.id, 'NGN');
      const usdcUnits = await getBalanceByUser(user.id, 'USDC');
      return json({
        ngn: { kobo: String(ngnKobo), naira: Number(ngnKobo) / 100 },
        usdc: { units: String(usdcUnits), usdc: Number(usdcUnits) / 1_000_000 },
      });
    }

    if (method === 'GET' && path === '/account/virtual') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const va = await getVirtualAccount(user.id);
      return json(va ?? {});
    }

    // ── WALLET REGISTRATION (USDC sync) ───────────────────────────────────────

    if (method === 'POST' && path === '/account/wallet') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const body = await parseBody(req);
      const walletAddress = str(body.walletAddress) as Address;
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        return err('Invalid wallet address');
      }
      await registerWallet(user.id, walletAddress);
      return json({ registered: true, walletAddress });
    }

    if (method === 'GET' && path === '/account/wallets') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const wallets = await getUserWallets(user.id);
      return json({ wallets });
    }

    // ── USDC SYNC ─────────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/account/sync-usdc') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);

      // Rate limit: max 1 sync per 30 seconds per user
      if (rateLimitExceeded(`sync:${String(user.id)}`, 2, 30 * 1000)) {
        return err('Please wait before syncing again.', 429);
      }

      const body = await parseBody(req);
      // Disabled until wallet ownership is cryptographically proven and deposits
      // are reconciled from verified on-chain events. A caller-supplied address
      // plus balanceOf() is not sufficient proof of a deposit.
      return err('USDC sync is temporarily disabled pending wallet ownership and deposit verification.', 503);
    }

    // ── TRANSACTIONS ──────────────────────────────────────────────────────────

    if (method === 'GET' && path === '/transactions') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const limit = Number(url.searchParams.get('limit') ?? '20');
      const offset = Number(url.searchParams.get('offset') ?? '0');
      const txs = await getTransactions(user.id, limit, offset);
      return json(txs.map(serializeTx));
    }

    if (method === 'POST' && path === '/transactions/send') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);

      // Rate limit: 10 send requests per user per minute
      if (rateLimitExceeded(`send:${String(user.id)}`, 10, 60 * 1000)) {
        return err('Too many transfer requests. Please wait.', 429);
      }

      const body = await parseBody(req);
      const { recipientTag, recipientPhone, amountNgn, note } = body;
      const parsedAmountNgn = Number(amountNgn);
      if (!Number.isFinite(parsedAmountNgn) || parsedAmountNgn <= 0 ||
          !Number.isSafeInteger(Math.round(parsedAmountNgn * 100))) {
        return err('Amount must be a valid positive amount');
      }
      const amountKobo = BigInt(Math.round(parsedAmountNgn * 100));

      // Enforce tier limits (server-side)
      const tierLimits: Record<number, bigint> = { 1: 5_000_000n, 2: 50_000_000n, 3: 9_999_999_999n };
      const txLimit = tierLimits[user.kycTier] ?? 5_000_000n;
      if (amountKobo > txLimit) {
        return err(`TIER_LIMIT_EXCEEDED: Your tier allows up to ₦${Number(txLimit) / 100} per transaction`, 403);
      }

      // Resolve recipient
      let recipient = null;
      if (recipientTag) {
        recipient = await lookupByTag(str(recipientTag));
      } else if (recipientPhone) {
        const phoneHash = sha256(`phone:${str(recipientPhone)}`);
        const r = await lookupByPhoneHash(phoneHash);
        recipient = r;
      }
      if (!recipient) return err('Recipient not found on Cashland', 404);

      const recipientUser = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE tag = $1`, [recipient.tag]
      );
      if (!recipientUser) return err('Recipient not found', 404);

      const recipientId = recipientUser.id;

      // Check if this is a new beneficiary (first time sending to this recipient)
      const prevTx = await queryOne(
        `SELECT id FROM transactions WHERE sender_id = $1 AND recipient_id = $2 LIMIT 1`,
        [String(user.id), recipientId]
      );
      const isNewRecipient = !prevTx;

      // Fraud velocity check
      const velocityResult = checkVelocity({
        userId: String(user.id),
        amountKobo,
        recipientId,
        isNewRecipient,
      });

      if (velocityResult.blocked) {
        return err(velocityResult.reason ?? 'Transfer blocked by security check', 403);
      }

      // Persist fraud flags to DB for audit trail
      if (velocityResult.flagged && velocityResult.flags.length > 0) {
        console.warn(`[fraud] User ${user.id} flagged: ${velocityResult.flags.join(', ')}`);
        // Logged to fraud_flags after tx is created below
      }

      const result = await transferNgn({
        senderId: user.id,
        recipientId: BigInt(recipientId),
        amountKobo,
        note: str(note),
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        recipientTag: recipient.tag,
      });

      // Persist fraud flag if needed
      if (velocityResult.flagged) {
        await query(
          `INSERT INTO fraud_flags (transaction_id, user_id, flags) VALUES ($1, $2, $3)`,
          [result.txId, String(user.id), velocityResult.flags]
        ).catch(e => console.error('[fraud] Failed to persist flag:', e));
      }

      return json({ txId: result.txId, newBalance: { naira: Number(result.newSenderBalance) / 100 } });
    }

    if (method === 'POST' && path === '/transactions/deposit') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      // Never credit a ledger from a client-supplied amount. Deposits must be
      // credited only by a verified payment-provider webhook.
      return err('Direct deposits are disabled. Complete a verified payment-provider checkout instead.', 410);
    }

    if (method === 'POST' && path === '/transactions/withdraw') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);

      // Rate limit: 5 withdrawals per user per hour
      if (rateLimitExceeded(`withdraw:${String(user.id)}`, 5, 60 * 60 * 1000)) {
        return err('Withdrawal limit reached. Please try again later.', 429);
      }

      const body = await parseBody(req);
      const { amountNgn, bankName, accountNumber, accountName } = body;
      if (amountNgn === undefined || !bankName || !accountNumber || !accountName) return err('Missing required fields');
      const parsedAmountNgn = Number(amountNgn);
      if (!Number.isFinite(parsedAmountNgn) || parsedAmountNgn <= 0 ||
          !Number.isSafeInteger(Math.round(parsedAmountNgn * 100))) {
        return err('Amount must be a valid positive amount');
      }
      const amountKobo = BigInt(Math.round(parsedAmountNgn * 100));
      const reference = 'WDR-' + nanoid(10);
      try {
        const result = await debitWithdrawal({
          userId: user.id, amountKobo, reference,
          bankName: str(bankName), accountNumber: str(accountNumber), accountName: str(accountName),
        });
        return json({ txId: result.txId, reference, newBalance: { naira: Number(result.newBalance) / 100 } });
      } catch (e) {
        if (e instanceof Error && e.message === 'INSUFFICIENT_FUNDS') return err('Insufficient balance', 400);
        throw e;
      }
    }

    // ── KYC (Phase 2 — real Dojah integration with mock fallback) ─────────────

    if (method === 'POST' && path === '/kyc/bvn') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);

      if (rateLimitExceeded(`kyc:${String(user.id)}`, 3, 10 * 60 * 1000)) {
        return err('Too many verification attempts. Please wait 10 minutes.', 429);
      }

      const body = await parseBody(req);
      const bvn = str(body.bvn);
      if (bvn.length !== 11) return err('BVN must be 11 digits');

      // Try real Dojah first
      const dojahResult = await dojahVerifyBvn({ bvn, firstName: user.firstName, lastName: user.lastName });

      if (dojahResult) {
        // Real Dojah response
        if (!dojahResult.verified) {
          return json({ verified: false, nameMatch: false, provider: 'dojah', error: dojahResult.error });
        }
        if (!dojahResult.nameMatch) {
          return json({ verified: true, nameMatch: false, provider: 'dojah', message: 'Name on BVN does not match account' });
        }
        // Upgrade tier
        await query(
          `UPDATE users SET kyc_tier = 2, kyc_method = 'bvn' WHERE id = $1 AND kyc_tier < 2`,
          [String(user.id)]
        );
        await query(
          `INSERT INTO kyc_verifications (user_id, method, id_hash, provider, result, tier_granted)
           VALUES ($1, 'bvn', $2, 'dojah', $3, 2)`,
          [String(user.id), sha256(`bvn:${bvn}`), JSON.stringify(dojahResult)]
        );
        return json({ verified: true, nameMatch: true, tier: 2, provider: 'dojah' });
      }

      // Fallback to mock
      const result = await verifyBvn({ userId: user.id, bvn, firstName: user.firstName, lastName: user.lastName });
      return json(result);
    }

    if (method === 'POST' && path === '/kyc/nin') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);

      if (rateLimitExceeded(`kyc:${String(user.id)}`, 3, 10 * 60 * 1000)) {
        return err('Too many verification attempts. Please wait 10 minutes.', 429);
      }

      const body = await parseBody(req);
      const nin = str(body.nin);
      if (nin.length !== 11) return err('NIN must be 11 digits');

      const dojahResult = await dojahVerifyNin({ nin, firstName: user.firstName, lastName: user.lastName });

      if (dojahResult) {
        if (!dojahResult.verified) {
          return json({ verified: false, nameMatch: false, provider: 'dojah', error: dojahResult.error });
        }
        if (!dojahResult.nameMatch) {
          return json({ verified: true, nameMatch: false, provider: 'dojah', message: 'Name on NIN does not match account' });
        }
        await query(
          `UPDATE users SET kyc_tier = 2, kyc_method = 'nin' WHERE id = $1 AND kyc_tier < 2`,
          [String(user.id)]
        );
        await query(
          `INSERT INTO kyc_verifications (user_id, method, id_hash, provider, result, tier_granted)
           VALUES ($1, 'nin', $2, 'dojah', $3, 2)`,
          [String(user.id), sha256(`nin:${nin}`), JSON.stringify(dojahResult)]
        );
        return json({ verified: true, nameMatch: true, tier: 2, provider: 'dojah' });
      }

      const result = await verifyNin({ userId: user.id, nin, firstName: user.firstName, lastName: user.lastName });
      return json(result);
    }

    // ── DISPUTES ──────────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/disputes') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      if (rateLimitExceeded(`dispute:${String(user.id)}`, 5, 60 * 60 * 1000)) {
        return err('Too many dispute submissions.', 429);
      }
      const body = await parseBody(req);
      const ref = generateDisputeRef();
      await query(
        `INSERT INTO disputes (ref, user_id, transaction_id, reason, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [ref, String(user.id), body.transactionId ?? null, str(body.reason), str(body.description)]
      );
      return json({ ref, status: 'open', message: 'Dispute submitted. We will respond within 3-5 business days.' });
    }

    if (method === 'GET' && path === '/disputes') {
      const user = await requireAuth(req);
      if (!user) return err('Unauthorized', 401);
      const rows = await query(
        `SELECT ref, transaction_id, reason, status, created_at FROM disputes WHERE user_id = $1 ORDER BY created_at DESC`,
        [String(user.id)]
      );
      return json(rows);
    }

    // ── WEBHOOK (Paystack — Phase 2 real HMAC verification) ───────────────────

    if (method === 'POST' && path === '/webhooks/paystack') {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      const { text: rawBody, parsed: body } = await parseRawBody(req);

      // Fail closed: never process financial webhooks without a configured secret.
      if (!paystackSecret) {
        console.error('[webhook:paystack] PAYSTACK_SECRET_KEY is not configured');
        return err('Payment webhook is not configured', 503);
      }
      const signature = req.headers.get('x-paystack-signature') ?? '';
      const expectedSig = createHmac('sha512', paystackSecret)
        .update(rawBody)
        .digest('hex');
      const supplied = /^[a-f0-9]{128}$/i.test(signature) ? Buffer.from(signature, 'hex') : Buffer.alloc(0);
      const expected = Buffer.from(expectedSig, 'hex');
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        console.warn('[webhook:paystack] Invalid signature');
        return err('Invalid signature', 400);
      }

      const event = body as {
        event?: string;
        data?: {
          reference?: string;
          amount?: number;
          status?: string;
          metadata?: { user_id?: string; cashland_user_id?: string };
          customer?: { email?: string };
        }
      };

      if (event.event === 'charge.success' && event.data?.status === 'success') {
        const { reference, amount, metadata } = event.data;
        if (typeof reference !== 'string' || !reference.trim() ||
            !Number.isSafeInteger(amount) || amount <= 0) {
          return err('Invalid webhook payload');
        }

        // Idempotency check
        const existing = await queryOne(`SELECT id FROM transactions WHERE reference = $1`, [reference]);
        if (existing) return json({ ok: true, duplicate: true });

        const userIdStr = metadata?.cashland_user_id ?? metadata?.user_id;
        if (!userIdStr) {
          console.warn('[webhook:paystack] No user_id in metadata, reference:', reference);
          return json({ ok: true, unmatched: true });
        }

        if (!/^\d+$/.test(userIdStr)) return err('Invalid payment metadata');
        const userId = BigInt(userIdStr);
        const amountKobo = BigInt(amount); // Paystack sends in kobo
        await creditDeposit({ userId, amountKobo, reference });
        console.log(`[webhook:paystack] Credited ₦${amount / 100} to user ${userId}, ref: ${reference}`);
      }

      return json({ ok: true });
    }

    // ── HEALTH ────────────────────────────────────────────────────────────────

    if (path === '/fx-rate') {
      const meta = getFxRateMeta();
      return json(meta);
    }

    if (path === '/health') {
      const pgOk = await queryOne(`SELECT 1`).then(() => true).catch(() => false);
      const fx = getFxRateMeta();
      return json({ ok: pgOk, ts: new Date().toISOString(), phase: 2, ngnPerUsdc: fx.ngnPerUsdc, fxSource: fx.source });
    }

    return err('Not found', 404);

  } catch (e) {
    console.error('[server] Error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return err(msg, 500);
  }
}

// ─── SERIALIZERS ─────────────────────────────────────────────────────────────

function serializeUser(u: {
  id: bigint; phone: string; firstName: string; lastName: string;
  tag: string; kycTier: number; kycMethod: string; biometrics: boolean; createdAt: Date
}) {
  return {
    id: String(u.id),
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    tag: u.tag,
    kycTier: u.kycTier,
    kycMethod: u.kycMethod,
    biometrics: u.biometrics,
    createdAt: u.createdAt.toISOString(),
  };
}

function serializeTx(tx: {
  id: string; type: string; status: string; amountNgn: bigint;
  note: string | null; recipientName: string | null; recipientTag: string | null;
  merchantName: string | null; txHash: string | null;
  createdAt: Date; completedAt: Date | null; direction: 'in' | 'out';
}) {
  return {
    id: tx.id,
    type: tx.type,
    status: tx.status,
    amountNgn: Number(tx.amountNgn) / 100,
    note: tx.note,
    recipientName: tx.recipientName,
    recipientTag: tx.recipientTag,
    merchantName: tx.merchantName,
    txHash: tx.txHash,
    createdAt: tx.createdAt.toISOString(),
    completedAt: tx.completedAt?.toISOString() ?? null,
    direction: tx.direction,
  };
}

// ─── START ────────────────────────────────────────────────────────────────────

await runMigrations();
console.log('[server] Migrations complete');

Bun.serve({ port: PORT, fetch: handle });
console.log(`[server] Cashland API running on http://localhost:${PORT}`);
