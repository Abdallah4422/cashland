// Cashland — Circle Developer-Controlled Wallets
// Creates one Arc Mainnet wallet per user at registration.
// Uses Circle SDK v6+ with entity secret from env.

import {
  initiateDeveloperControlledWalletsClient,
} from '@circle-fin/developer-controlled-wallets';
import { query, queryOne } from './db.js';

// Arc Mainnet blockchain identifier in Circle's system
const ARC_BLOCKCHAIN = 'ARC';

let _client: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;
let _walletSetId: string | null = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey || !entitySecret) {
    throw new Error('CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be set');
  }
  _client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
  return _client;
}

// Get or create the Cashland wallet set (one per app, shared across all users)
async function getWalletSetId(): Promise<string> {
  if (_walletSetId) return _walletSetId;

  // Check if we already stored the wallet set id
  const row = await queryOne<{ value: string }>(
    `SELECT value FROM app_config WHERE key = 'circle_wallet_set_id'`
  );
  if (row) {
    _walletSetId = row.value;
    return _walletSetId;
  }

  // Create a new wallet set
  const client = getClient();
  const res = await client.createWalletSet({
    name: 'Cashland User Wallets',
  });

  const setId = res.data?.walletSet?.id;
  if (!setId) throw new Error('Failed to create Circle wallet set');

  // Persist it
  await query(
    `INSERT INTO app_config (key, value) VALUES ('circle_wallet_set_id', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [setId]
  );

  _walletSetId = setId;
  return setId;
}

// Create one Arc Mainnet wallet for a user. Returns the wallet address.
export async function createUserWallet(userId: bigint): Promise<string> {
  // Check if user already has a wallet
  const existing = await queryOne<{ wallet_address: string }>(
    `SELECT wallet_address FROM user_wallets WHERE user_id = $1 LIMIT 1`,
    [String(userId)]
  );
  if (existing) return existing.wallet_address;

  const client = getClient();
  const walletSetId = await getWalletSetId();

  const res = await client.createWallets({
    blockchains: [ARC_BLOCKCHAIN],
    count: 1,
    walletSetId,
  });

  const wallet = res.data?.wallets?.[0];
  if (!wallet?.address) throw new Error('Circle did not return a wallet address');

  // Store in user_wallets table
  await query(
    `INSERT INTO user_wallets (user_id, wallet_address)
     VALUES ($1, $2)
     ON CONFLICT (user_id, wallet_address) DO NOTHING`,
    [String(userId), wallet.address]
  );

  return wallet.address;
}

// Get the primary wallet address for a user (returns null if none created yet)
export async function getUserWalletAddress(userId: bigint): Promise<string | null> {
  const row = await queryOne<{ wallet_address: string }>(
    `SELECT wallet_address FROM user_wallets WHERE user_id = $1 ORDER BY registered_at ASC LIMIT 1`,
    [String(userId)]
  );
  return row?.wallet_address ?? null;
}
