// Cashland Phase 1 — Double-entry ledger
// Every money movement creates a debit + credit pair.
// Balance = SUM of credits - SUM of debits for an account.

import { withTransaction, queryOne, query } from './db.js';
import { generateTxId } from './crypto.js';

// NGN amounts in KOBO (1 NGN = 100 kobo)
// USDC amounts in micro-USDC (1 USDC = 1_000_000 units)

export const NGN_SCALE = 100n;        // 1 NGN = 100 kobo
export const USDC_SCALE = 1_000_000n; // 1 USDC = 1,000,000 units

export type Currency = 'NGN' | 'USDC';

export interface LedgerAccount {
  id: bigint;
  userId: bigint;
  currency: Currency;
  balance: bigint; // minor units
}

// Get or create both accounts for a user
export async function ensureAccounts(userId: bigint): Promise<{ ngn: LedgerAccount; usdc: LedgerAccount }> {
  // Upsert NGN account
  await query(
    `INSERT INTO accounts (user_id, currency) VALUES ($1, 'NGN') ON CONFLICT (user_id, currency) DO NOTHING`,
    [String(userId)]
  );
  await query(
    `INSERT INTO accounts (user_id, currency) VALUES ($1, 'USDC') ON CONFLICT (user_id, currency) DO NOTHING`,
    [String(userId)]
  );

  const ngn = await getAccount(userId, 'NGN');
  const usdc = await getAccount(userId, 'USDC');
  if (!ngn || !usdc) throw new Error('Failed to create accounts');
  return { ngn, usdc };
}

export async function getAccount(userId: bigint, currency: Currency): Promise<LedgerAccount | null> {
  const row = await queryOne<{ id: string; user_id: string; currency: string }>(
    `SELECT a.id, a.user_id, a.currency FROM accounts a WHERE a.user_id = $1 AND a.currency = $2`,
    [String(userId), currency]
  );
  if (!row) return null;
  const balance = await getBalance(BigInt(row.id));
  return {
    id: BigInt(row.id),
    userId: BigInt(row.user_id),
    currency: row.currency as Currency,
    balance,
  };
}

export async function getBalance(accountId: bigint): Promise<bigint> {
  const row = await queryOne<{ balance: string }>(
    `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END), 0) AS balance
     FROM ledger_entries WHERE account_id = $1`,
    [String(accountId)]
  );
  return BigInt(row?.balance ?? '0');
}

export async function getBalanceByUser(userId: bigint, currency: Currency): Promise<bigint> {
  const account = await getAccount(userId, currency);
  if (!account) return 0n;
  return account.balance;
}

// ─── CORE LEDGER OPERATION ────────────────────────────────────────────────────
// Post a credit to one account and a debit to another atomically.
// Both accounts must be provided to enforce double-entry.

interface PostParams {
  txId?: string;
  debitAccountId: bigint;
  creditAccountId: bigint;
  amount: bigint;           // positive minor-unit amount
  description?: string;
}

export interface PostResult {
  txId: string;
  debitBalanceAfter: bigint;
  creditBalanceAfter: bigint;
}

export async function postDoubleEntry(params: PostParams): Promise<PostResult> {
  const { debitAccountId, creditAccountId, amount } = params;
  if (amount <= 0n) throw new Error('Amount must be positive');

  const txId = params.txId ?? generateTxId();

  return withTransaction(async (q) => {
    // Lock both accounts in consistent order to prevent deadlock
    const [a, b] = [debitAccountId, creditAccountId].sort((x, y) => (x < y ? -1 : 1));
    await q(`SELECT id FROM accounts WHERE id IN ($1, $2) FOR UPDATE`, [String(a), String(b)]);

    // Compute running balances
    const debitBalanceRow = await queryOne<{ balance: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries WHERE account_id = $1`,
      [String(debitAccountId)]
    );
    const debitBalance = BigInt(debitBalanceRow?.balance ?? '0');
    if (debitBalance < amount) throw new Error('INSUFFICIENT_FUNDS');

    const creditBalanceRow = await queryOne<{ balance: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries WHERE account_id = $1`,
      [String(creditAccountId)]
    );
    const creditBalance = BigInt(creditBalanceRow?.balance ?? '0');

    const debitBalanceAfter = debitBalance - amount;
    const creditBalanceAfter = creditBalance + amount;

    // Insert debit
    await q(
      `INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after)
       VALUES ($1, $2, $3, 'debit', $4)`,
      [String(debitAccountId), txId, String(amount), String(debitBalanceAfter)]
    );

    // Insert credit
    await q(
      `INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after)
       VALUES ($1, $2, $3, 'credit', $4)`,
      [String(creditAccountId), txId, String(amount), String(creditBalanceAfter)]
    );

    return { txId, debitBalanceAfter, creditBalanceAfter };
  });
}

// ─── DEPOSIT (fiat on-ramp) ───────────────────────────────────────────────────
// Credits the user's NGN account from a "system" float account.
// In production this is triggered by a Paystack webhook.


export async function creditDeposit(params: {
  userId: bigint;
  amountKobo: bigint;
  txId?: string;
  reference: string;
  note?: string;
}): Promise<PostResult> {
  const { userId, amountKobo, reference, note } = params;
  if (amountKobo <= 0n) throw new Error('Amount must be positive');
  if (!reference.trim()) throw new Error('Deposit reference is required');

  const txId = params.txId ?? generateTxId();
  const { ngn } = await ensureAccounts(userId);

  // Transaction record and ledger credit are one DB transaction. A duplicate
  // payment reference must never create another ledger entry.
  const posted = await withTransaction(async (q) => {
    await q(`SELECT id FROM accounts WHERE id = $1 FOR UPDATE`, [String(ngn.id)]);

    const inserted = await q<{ id: string }>(
      `INSERT INTO transactions (id, type, status, recipient_id, amount_ngn, reference, note, completed_at)
       VALUES ($1, 'deposit', 'completed', $2, $3, $4, $5, NOW())
       ON CONFLICT (reference) DO NOTHING
       RETURNING id`,
      [txId, String(userId), String(amountKobo), reference, note ?? null]
    );

    if (inserted.length === 0) return null;

    const balanceRow = await q<{ balance: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries WHERE account_id = $1`,
      [String(ngn.id)]
    );
    const balanceAfter = BigInt(balanceRow[0]?.balance ?? '0') + amountKobo;

    await q(
      `INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after)
       VALUES ($1, $2, $3, 'credit', $4)`,
      [String(ngn.id), txId, String(amountKobo), String(balanceAfter)]
    );

    return { txId, balanceAfter };
  });

  if (!posted) {
    // Return the existing transaction state without posting any additional credit.
    const existing = await queryOne<{ id: string; recipient_id: string }>(
      `SELECT id, recipient_id FROM transactions WHERE reference = $1`,
      [reference]
    );
    if (!existing || existing.recipient_id !== String(userId)) {
      throw new Error('DEPOSIT_REFERENCE_CONFLICT');
    }
    return {
      txId: existing.id,
      debitBalanceAfter: 0n,
      creditBalanceAfter: await getBalance(ngn.id),
    };
  }

  return {
    txId: posted.txId,
    debitBalanceAfter: 0n,
    creditBalanceAfter: posted.balanceAfter,
  };
}

// ─── TRANSFER (send money) ────────────────────────────────────────────────────
export async function transferNgn(params: {
  senderId: bigint;
  recipientId: bigint;
  amountKobo: bigint;
  note?: string;
  recipientName?: string;
  recipientTag?: string;
}): Promise<{ txId: string; newSenderBalance: bigint }> {
  const { senderId, recipientId, amountKobo } = params;
  const txId = generateTxId();

  const senderAcct = await getAccount(senderId, 'NGN');
  const recipientAcct = await getAccount(recipientId, 'NGN');
  if (!senderAcct || !recipientAcct) throw new Error('Account not found');

  await withTransaction(async (q) => {
    // Lock accounts
    await q(`SELECT id FROM accounts WHERE id IN ($1, $2) FOR UPDATE`,
      [String(senderAcct.id), String(recipientAcct.id)]);

    const senderBalance = await getBalance(senderAcct.id);
    if (senderBalance < amountKobo) throw new Error('INSUFFICIENT_FUNDS');

    const recipientBalance = await getBalance(recipientAcct.id);

    const senderAfter = senderBalance - amountKobo;
    const recipientAfter = recipientBalance + amountKobo;

    await q(`INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after) VALUES ($1,$2,$3,'debit',$4)`,
      [String(senderAcct.id), txId, String(amountKobo), String(senderAfter)]);
    await q(`INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after) VALUES ($1,$2,$3,'credit',$4)`,
      [String(recipientAcct.id), txId, String(amountKobo), String(recipientAfter)]);

    await q(`INSERT INTO transactions (id, type, status, sender_id, recipient_id, amount_ngn, note, recipient_name, recipient_tag, completed_at)
      VALUES ($1,'send','completed',$2,$3,$4,$5,$6,$7,NOW())`,
      [txId, String(senderId), String(recipientId), String(amountKobo),
        params.note ?? null, params.recipientName ?? null, params.recipientTag ?? null]);
  });

  const newSenderBalance = await getBalance(senderAcct.id);
  return { txId, newSenderBalance };
}

// ─── WITHDRAWAL ───────────────────────────────────────────────────────────────
export async function debitWithdrawal(params: {
  userId: bigint;
  amountKobo: bigint;
  reference: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<{ txId: string; newBalance: bigint }> {
  const { userId, amountKobo, reference } = params;
  const txId = generateTxId();

  const acct = await getAccount(userId, 'NGN');
  if (!acct) throw new Error('Account not found');

  const balance = await getBalance(acct.id);
  if (balance < amountKobo) throw new Error('INSUFFICIENT_FUNDS');

  const balanceAfter = balance - amountKobo;

  await query(`INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after) VALUES ($1,$2,$3,'debit',$4)`,
    [String(acct.id), txId, String(amountKobo), String(balanceAfter)]);

  await query(`INSERT INTO transactions (id, type, status, sender_id, amount_ngn, reference, metadata, completed_at)
    VALUES ($1,'withdraw','completed',$2,$3,$4,$5,NOW())`,
    [txId, String(userId), String(amountKobo), reference,
      JSON.stringify({ bankName: params.bankName, accountNumber: params.accountNumber, accountName: params.accountName })]);

  return { txId, newBalance: balanceAfter };
}

// ─── TRANSACTION HISTORY ──────────────────────────────────────────────────────
export interface TxRecord {
  id: string;
  type: string;
  status: string;
  amountNgn: bigint;
  note: string | null;
  recipientName: string | null;
  recipientTag: string | null;
  merchantName: string | null;
  txHash: string | null;
  createdAt: Date;
  completedAt: Date | null;
  direction: 'in' | 'out';
}

export async function getTransactions(userId: bigint, limit = 20, offset = 0): Promise<TxRecord[]> {
  const rows = await query<{
    id: string; type: string; status: string; amount_ngn: string;
    note: string | null; recipient_name: string | null; recipient_tag: string | null;
    merchant_name: string | null; tx_hash: string | null;
    created_at: Date; completed_at: Date | null;
    sender_id: string | null; recipient_id: string | null;
  }>(
    `SELECT id, type, status, amount_ngn, note, recipient_name, recipient_tag,
            merchant_name, tx_hash, created_at, completed_at, sender_id, recipient_id
     FROM transactions
     WHERE sender_id = $1 OR recipient_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [String(userId), limit, offset]
  );

  return rows.map(r => ({
    id: r.id,
    type: r.type,
    status: r.status,
    amountNgn: BigInt(r.amount_ngn),
    note: r.note,
    recipientName: r.recipient_name,
    recipientTag: r.recipient_tag,
    merchantName: r.merchant_name,
    txHash: r.tx_hash,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    direction: r.sender_id === String(userId) ? 'out' : 'in',
  }));
}
