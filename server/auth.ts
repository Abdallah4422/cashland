// Cashland Phase 1 — Authentication
// Phone + OTP registration and login. Session tokens stored in Postgres.

import { query, queryOne } from './db.js';
import {
  sha256, randomHex, generateOtp, hashOtp,
  hashPin, verifyPin, generateAccountNumber, nanoid
} from './crypto.js';
import { ensureAccounts } from './ledger.js';
import { createUserWallet } from './circle-wallets.js';

export interface User {
  id: bigint;
  phone: string;
  firstName: string;
  lastName: string;
  tag: string;
  kycTier: 1 | 2 | 3;
  kycMethod: string;
  biometrics: boolean;
  createdAt: Date;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<{ devCode?: string }> {
  const { code, hash, expiresAt } = generateOtp();

  // Invalidate previous OTPs for this phone
  await query(`UPDATE otp_tokens SET used = TRUE WHERE phone = $1 AND used = FALSE`, [phone]);

  await query(
    `INSERT INTO otp_tokens (phone, token_hash, purpose, expires_at) VALUES ($1, $2, 'auth', $3)`,
    [phone, hash, expiresAt.toISOString()]
  );

  // The server/index.ts route calls sendSms() after calling sendOtp().
  // We return devCode here so the route can include it when no SMS key is set.
  console.log(`[auth] OTP for ${phone}: ${code}`);
  return { devCode: code };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const tokenHash = hashOtp(code);
  const row = await queryOne<{ id: string; used: boolean; expires_at: Date }>(
    `SELECT id, used, expires_at FROM otp_tokens
     WHERE phone = $1 AND token_hash = $2
     ORDER BY created_at DESC LIMIT 1`,
    [phone, tokenHash]
  );

  if (!row) return false;
  if (row.used) return false;
  if (new Date(row.expires_at) < new Date()) return false;

  await query(`UPDATE otp_tokens SET used = TRUE WHERE id = $1`, [row.id]);
  return true;
}

// ─── REGISTRATION ─────────────────────────────────────────────────────────────

export async function registerUser(params: {
  phone: string;
  firstName: string;
  lastName: string;
  tag: string;
  pin: string;
  biometrics?: boolean;
}): Promise<{ user: User; sessionToken: string }> {
  const { phone, firstName, lastName, tag, pin } = params;

  // Normalise tag
  const cleanTag = tag.replace(/^@/, '').toLowerCase().trim();

  // Check uniqueness
  const existing = await queryOne(`SELECT id FROM users WHERE phone = $1 OR tag = $2`, [phone, cleanTag]);
  if (existing) throw new Error('PHONE_OR_TAG_TAKEN');

  const phoneHash = sha256(`phone:${phone}`);
  const salt = randomHex(16);
  const pinHash = hashPin(pin, salt);

  const rows = await query<{ id: string }>(
    `INSERT INTO users (phone, phone_hash, first_name, last_name, tag, pin_hash, pin_salt, biometrics)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [phone, phoneHash, firstName, lastName, cleanTag, pinHash, salt, params.biometrics ?? false]
  );
  const userId = BigInt(rows[0].id);

  // Create ledger accounts
  await ensureAccounts(userId);

  // Create Circle Arc Mainnet wallet for USDC deposits (non-blocking — don't fail reg if Circle is down)
  createUserWallet(userId).catch(e => {
    console.error('[auth] Circle wallet creation failed for user', String(userId), e?.message);
  });

  // Create virtual bank account
  const accountNumber = generateAccountNumber();
  const accountName = `${firstName} ${lastName}`.toUpperCase();
  const reference = 'VA-' + nanoid(10);

  await query(
    `INSERT INTO virtual_accounts (user_id, account_number, account_name, reference)
     VALUES ($1, $2, $3, $4)`,
    [String(userId), accountNumber, accountName, reference]
  );

  const user = await getUser(userId);
  if (!user) throw new Error('Registration failed');

  const sessionToken = await createSession(userId);
  return { user, sessionToken };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginWithPin(phone: string, pin: string): Promise<{ user: User; sessionToken: string } | null> {
  const row = await queryOne<{
    id: string; pin_hash: string; pin_salt: string;
    first_name: string; last_name: string; tag: string;
    kyc_tier: string; kyc_method: string; biometrics: boolean; created_at: Date
  }>(
    `SELECT id, pin_hash, pin_salt, first_name, last_name, tag, kyc_tier, kyc_method, biometrics, created_at
     FROM users WHERE phone = $1`,
    [phone]
  );

  if (!row) return null;
  if (!verifyPin(pin, row.pin_salt, row.pin_hash)) return null;

  await query(`UPDATE users SET last_active = NOW() WHERE id = $1`, [row.id]);

  const userId = BigInt(row.id);
  const sessionToken = await createSession(userId);

  const user: User = {
    id: userId,
    phone,
    firstName: row.first_name,
    lastName: row.last_name,
    tag: row.tag,
    kycTier: Number(row.kyc_tier) as 1 | 2 | 3,
    kycMethod: row.kyc_method,
    biometrics: row.biometrics,
    createdAt: row.created_at,
  };

  return { user, sessionToken };
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function createSession(userId: bigint): Promise<string> {
  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, String(userId), expiresAt.toISOString()]
  );

  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  const row = await queryOne<{ user_id: string; expires_at: Date }>(
    `SELECT user_id, expires_at FROM sessions WHERE id = $1`,
    [token]
  );

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  await query(`UPDATE sessions SET last_used = NOW() WHERE id = $1`, [token]);
  return getUser(BigInt(row.user_id));
}

export async function revokeSession(token: string): Promise<void> {
  await query(`DELETE FROM sessions WHERE id = $1`, [token]);
}

// ─── USER LOOKUP ──────────────────────────────────────────────────────────────

export async function getUser(userId: bigint): Promise<User | null> {
  const row = await queryOne<{
    id: string; phone: string; first_name: string; last_name: string;
    tag: string; kyc_tier: string; kyc_method: string; biometrics: boolean; created_at: Date
  }>(
    `SELECT id, phone, first_name, last_name, tag, kyc_tier, kyc_method, biometrics, created_at
     FROM users WHERE id = $1`,
    [String(userId)]
  );
  if (!row) return null;
  return {
    id: BigInt(row.id),
    phone: row.phone,
    firstName: row.first_name,
    lastName: row.last_name,
    tag: row.tag,
    kycTier: Number(row.kyc_tier) as 1 | 2 | 3,
    kycMethod: row.kyc_method,
    biometrics: row.biometrics,
    createdAt: row.created_at,
  };
}

export async function lookupByTag(tag: string): Promise<{ firstName: string; lastName: string; tag: string; phoneHash: string } | null> {
  const cleanTag = tag.replace(/^@/, '').toLowerCase();
  const row = await queryOne<{ first_name: string; last_name: string; tag: string; phone_hash: string }>(
    `SELECT first_name, last_name, tag, phone_hash FROM users WHERE tag = $1`,
    [cleanTag]
  );
  if (!row) return null;
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    tag: row.tag,
    phoneHash: row.phone_hash,
  };
}

export async function lookupByPhoneHash(phoneHash: string): Promise<{ firstName: string; lastName: string; tag: string } | null> {
  const row = await queryOne<{ first_name: string; last_name: string; tag: string }>(
    `SELECT first_name, last_name, tag FROM users WHERE phone_hash = $1`,
    [phoneHash]
  );
  if (!row) return null;
  return { firstName: row.first_name, lastName: row.last_name, tag: row.tag };
}

export async function getVirtualAccount(userId: bigint) {
  return queryOne<{
    bank_name: string; bank_code: string;
    account_number: string; account_name: string; reference: string
  }>(
    `SELECT bank_name, bank_code, account_number, account_name, reference
     FROM virtual_accounts WHERE user_id = $1`,
    [String(userId)]
  );
}
