// Cashland — server-side crypto helpers
// All hashing is done here. Never import these in frontend code.

import { createHash, randomBytes } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function nanoid(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// PIN hash: SHA-256(salt + ':' + pin). Salt is per-user random 16-byte hex.
export function hashPin(pin: string, salt: string): string {
  return sha256(`${salt}:${pin}`);
}

export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  return hashPin(pin, salt) === storedHash;
}

// OTP: 6-digit numeric code, expires in 10 minutes.
export function generateOtp(): { code: string; hash: string; expiresAt: Date } {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = sha256(`otp:${code}`);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return { code, hash, expiresAt };
}

export function hashOtp(code: string): string {
  return sha256(`otp:${code}`);
}

// Virtual account number: 10-digit NUBAN-style
export function generateAccountNumber(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

// Transaction ID: 'CL-' + 8 uppercase alphanumeric chars
export function generateTxId(): string {
  return 'CL-' + nanoid(8);
}

// Dispute ref: 'DSP-' + 7 chars
export function generateDisputeRef(): string {
  return 'DSP-' + nanoid(7);
}
