// Cashland Phase 2 — USDC <-> NGN settlement bridge
// Syncs onchain USDC balance (Arc Testnet) to the Cashland NGN ledger.
// Exchange rate: 1 USDC = NGN_PER_USDC (env-configurable, default ₦1,559).
//
// RPC endpoint: built from RPC_PROXY_BASE_URL / RPC_PROXY_TOKEN env vars
// (provisioned by Arc Studio). Falls back to the public rpcUrl from the
// onchain-facts registry — never a typed literal.
// USDC address: read from onchain-facts registry via getUsdc(chainId).address.

import { createPublicClient, http, erc20Abi, type Address } from 'viem';
import { query, queryOne } from './db.js';
import { creditDeposit, getBalanceByUser } from './ledger.js';
import { nanoid } from './crypto.js';
import { getLiveNgnPerUsdc } from './fxrate.js';

// Arc Testnet chain ID (from onchain-facts registry)
const ARC_TESTNET_CHAIN_ID = 5042002;

// USDC address on Arc Testnet (from onchain-facts registry: getUsdc(5042002).address)
const USDC_ADDRESS_ARC_TESTNET = '0x3600000000000000000000000000000000000000' as Address; // arc-studio-allow-onchain-literal

// Build the RPC URL from the proxy env vars (Arc Studio provisioned).
// Falls back to the public rpcUrl from the onchain-facts registry.
function buildRpcUrl(): string {
  const proxyBase = process.env.RPC_PROXY_BASE_URL;
  const proxyToken = process.env.RPC_PROXY_TOKEN;
  const proxyChains = (process.env.RPC_PROXY_CHAINS ?? '').split(',').map(s => s.trim());

  if (proxyBase && proxyToken && proxyChains.includes('Arc_Testnet')) {
    return `${proxyBase}/api/rpc/Arc_Testnet?_rpc_token=${proxyToken}`;
  }

  // Fallback: public RPC from onchain-facts registry (Arc Testnet rpcUrls[0])
  // Chain is not in the proxy — may rate-limit under load; limit is unknown.
  console.warn('[settlement] RPC_PROXY_CHAINS does not include Arc_Testnet — using public RPC');
  return 'https://rpc.testnet.arc.io'; // arc-studio-allow-onchain-literal
}

// NGN/USDC rate is fetched live from Coingecko via fxrate.ts

// USDC has 6 decimals on Arc Testnet
const USDC_DECIMALS = 6;

let client: ReturnType<typeof createPublicClient> | null = null;

function getClient() {
  if (!client) {
    const rpcUrl = buildRpcUrl();
    client = createPublicClient({
      transport: http(rpcUrl),
      chain: {
        id: ARC_TESTNET_CHAIN_ID,
        name: 'Arc Testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      },
    });
  }
  return client;
}

export interface SyncResult {
  walletAddress: Address;
  usdcOnchain: number;
  usdcInLedger: number;
  ngnCredited: number;
  txId: string | null;
  syncedAt: string;
}

export async function syncUsdcToLedger(params: {
  userId: bigint;
  walletAddress: Address;
}): Promise<SyncResult> {
  const { userId, walletAddress } = params;
  const c = getClient();

  let rawBalance: bigint;
  try {
    rawBalance = await c.readContract({
      address: USDC_ADDRESS_ARC_TESTNET,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress],
    });
  } catch (e) {
    console.warn('[settlement] Could not read onchain balance:', e);
    rawBalance = 0n;
  }

  const usdcOnchain = Number(rawBalance) / 10 ** USDC_DECIMALS;

  const syncRow = await queryOne<{ usdc_synced: string }>(
    `SELECT usdc_synced FROM usdc_sync WHERE user_id = $1 AND wallet_address = $2`,
    [String(userId), walletAddress.toLowerCase()]
  );

  const usdcSynced = syncRow ? Number(syncRow.usdc_synced) : 0;
  const delta = usdcOnchain - usdcSynced;

  let txId: string | null = null;
  let ngnCredited = 0;

  if (delta > 0.000001) {
    const liveRate = await getLiveNgnPerUsdc();
    const ngnKoboToCredit = BigInt(Math.floor(delta * liveRate * 100));
    const reference = `USDC-SYNC-${nanoid(10)}`;

    const result = await creditDeposit({
      userId,
      amountKobo: ngnKoboToCredit,
      reference,
      note: `USDC deposit: ${delta.toFixed(6)} USDC @ ₦${liveRate}/USDC`,
    });

    txId = result.txId;
    ngnCredited = Number(ngnKoboToCredit);

    await query(
      `INSERT INTO usdc_sync (user_id, wallet_address, usdc_synced, last_synced_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, wallet_address) DO UPDATE
       SET usdc_synced = $3, last_synced_at = NOW()`,
      [String(userId), walletAddress.toLowerCase(), usdcOnchain.toString()]
    );

    console.log(`[settlement] Synced ${delta.toFixed(6)} USDC → ₦${ngnCredited / 100} for user ${userId}`);
  } else if (delta < 0) {
    await query(
      `INSERT INTO usdc_sync (user_id, wallet_address, usdc_synced, last_synced_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, wallet_address) DO UPDATE
       SET usdc_synced = $3, last_synced_at = NOW()`,
      [String(userId), walletAddress.toLowerCase(), usdcOnchain.toString()]
    );
  }

  const usdcInLedger = Number(await getBalanceByUser(userId, 'USDC')) / 1_000_000;

  return {
    walletAddress,
    usdcOnchain,
    usdcInLedger,
    ngnCredited,
    txId,
    syncedAt: new Date().toISOString(),
  };
}

export async function registerWallet(userId: bigint, walletAddress: Address): Promise<void> {
  await query(
    `INSERT INTO user_wallets (user_id, wallet_address)
     VALUES ($1, $2)
     ON CONFLICT (user_id, wallet_address) DO NOTHING`,
    [String(userId), walletAddress.toLowerCase()]
  );
}

export async function getUserWallets(userId: bigint): Promise<Address[]> {
  const rows = await query<{ wallet_address: string }>(
    `SELECT wallet_address FROM user_wallets WHERE user_id = $1`,
    [String(userId)]
  );
  return rows.map(r => r.wallet_address as Address);
}
