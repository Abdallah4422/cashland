-- Cashland Phase 1 Database Schema
-- Double-entry ledger: every naira movement creates two entries.
-- Balances are COMPUTED from entries — never stored as a mutable column.

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  phone         TEXT NOT NULL UNIQUE,
  phone_hash    TEXT NOT NULL UNIQUE,        -- SHA-256 of phone for public lookups
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  tag           TEXT NOT NULL UNIQUE,        -- @cashtag
  pin_hash      TEXT NOT NULL,               -- SHA-256(salt+pin)
  pin_salt      TEXT NOT NULL,
  kyc_tier      SMALLINT NOT NULL DEFAULT 1, -- 1, 2, 3
  kyc_method    TEXT NOT NULL DEFAULT 'none',-- 'bvn' | 'nin' | 'none'
  kyc_ref       TEXT,                        -- bureau verification reference
  biometrics    BOOLEAN NOT NULL DEFAULT FALSE,
  device_id     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
-- Each user has one NGN ledger account and one USDC ledger account.
CREATE TABLE IF NOT EXISTS accounts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency      TEXT NOT NULL,               -- 'NGN' | 'USDC'
  account_type  TEXT NOT NULL DEFAULT 'wallet',
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, currency)
);

-- ─── VIRTUAL BANK ACCOUNTS ────────────────────────────────────────────────────
-- One virtual GTBank/Providus account per user for fiat on-ramp.
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  bank_name       TEXT NOT NULL DEFAULT 'Providus Bank',
  bank_code       TEXT NOT NULL DEFAULT '101',
  account_number  TEXT NOT NULL UNIQUE,
  account_name    TEXT NOT NULL,
  reference       TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── LEDGER ENTRIES (double-entry) ────────────────────────────────────────────
-- Every credit or debit is a row here. Pairs balance each other.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id              BIGSERIAL PRIMARY KEY,
  account_id      BIGINT NOT NULL REFERENCES accounts(id),
  transaction_id  TEXT NOT NULL,             -- groups the double-entry pair
  amount          BIGINT NOT NULL,           -- in minor units (kobo for NGN, 1e6 for USDC)
  direction       TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  balance_after   BIGINT NOT NULL,           -- running balance snapshot
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_account ON ledger_entries(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_txn ON ledger_entries(transaction_id);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
-- Human-readable transaction records (groups ledger entries).
CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,          -- 'CL-' + nanoid
  type            TEXT NOT NULL,             -- 'send' | 'receive' | 'deposit' | 'withdraw' | 'bill' | 'airtime'
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed' | 'reversed'
  sender_id       BIGINT REFERENCES users(id),
  recipient_id    BIGINT REFERENCES users(id),
  amount_ngn      BIGINT NOT NULL,           -- kobo
  amount_usdc     BIGINT,                    -- 1e6 units
  fee_ngn         BIGINT NOT NULL DEFAULT 0,
  exchange_rate   NUMERIC(18,6),             -- NGN per USDC at time of tx
  note            TEXT,
  recipient_phone_hash TEXT,                 -- for privacy — no plain phone stored
  recipient_tag   TEXT,
  recipient_name  TEXT,                      -- display name only
  merchant_name   TEXT,
  tx_hash         TEXT,                      -- onchain tx hash if USDC settled
  reference       TEXT UNIQUE,               -- external PSP / NIP reference
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_txn_sender ON transactions(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_recipient ON transactions(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(status);

-- ─── OTP TOKENS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          BIGSERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  token_hash  TEXT NOT NULL,                 -- SHA-256 of the 6-digit code
  purpose     TEXT NOT NULL DEFAULT 'auth',  -- 'auth' | 'pin_reset'
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_tokens(phone, expires_at DESC);

-- ─── DISPUTES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
  id            BIGSERIAL PRIMARY KEY,
  ref           TEXT NOT NULL UNIQUE,        -- 'DSP-' + nanoid
  user_id       BIGINT NOT NULL REFERENCES users(id),
  transaction_id TEXT REFERENCES transactions(id),
  reason        TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'open',-- 'open' | 'investigating' | 'resolved' | 'rejected'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- ─── KYC VERIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  method      TEXT NOT NULL,                 -- 'bvn' | 'nin'
  id_hash     TEXT NOT NULL,                 -- SHA-256 of BVN/NIN — never store raw
  provider    TEXT NOT NULL DEFAULT 'mock',  -- 'dojah' | 'smile_identity' | 'mock'
  provider_ref TEXT,
  result      JSONB,                         -- name match, DOB, status
  tier_granted SMALLINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SESSIONS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,              -- random 32-byte hex
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id   TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ─── USDC SYNC (Phase 2) ──────────────────────────────────────────────────────
-- Tracks the last synced onchain USDC balance per wallet address.
-- When onchain balance increases, the delta is credited to the NGN ledger.
CREATE TABLE IF NOT EXISTS usdc_sync (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address  TEXT NOT NULL,
  usdc_synced     NUMERIC(24,6) NOT NULL DEFAULT 0,
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_usdc_sync_user ON usdc_sync(user_id);

-- ─── USER WALLETS (Phase 2) ───────────────────────────────────────────────────
-- Registered onchain wallet addresses per user.
CREATE TABLE IF NOT EXISTS user_wallets (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address  TEXT NOT NULL,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, wallet_address)
);

-- ─── FRAUD FLAGS (Phase 2) ────────────────────────────────────────────────────
-- Persistent audit trail for transactions that triggered velocity rules.
CREATE TABLE IF NOT EXISTS fraud_flags (
  id              BIGSERIAL PRIMARY KEY,
  transaction_id  TEXT REFERENCES transactions(id),
  user_id         BIGINT NOT NULL REFERENCES users(id),
  flags           TEXT[] NOT NULL,
  flagged_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON fraud_flags(user_id, flagged_at DESC);

-- ─── APP CONFIG ───────────────────────────────────────────────────────────────
-- Key-value store for app-level config (e.g. Circle wallet set id).
CREATE TABLE IF NOT EXISTS app_config (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
