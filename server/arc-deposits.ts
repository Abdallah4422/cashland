// Arc Mainnet USDC deposit monitor.
// Credits only verified ERC-20 Transfer logs sent to Cashland-registered wallets.
// The scan cursor is advanced only after a full range succeeds; transaction
// references make replay after a crash safe and idempotent.

import {
  createPublicClient,
  http,
  parseAbiItem,
  type Address,
  type Chain,
} from 'viem';
import { query, queryOne, withTransaction } from './db.js';
import { ensureAccounts } from './ledger.js';
import { generateTxId } from './crypto.js';

const ARC_CHAIN_ID = 5042;
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as Address;
const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);
const SCAN_INTERVAL_MS = 15_000;
const MAX_BLOCK_RANGE = 2_000n;
const ARC_CHAIN = {
  id: ARC_CHAIN_ID,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
} as const satisfies Chain;

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

function getClient() {
  const rpcUrl = process.env.ARC_MAINNET_RPC_URL || 'https://rpc.mainnet.arc.io';
  return createPublicClient({ chain: ARC_CHAIN, transport: http(rpcUrl) });
}

async function creditVerifiedTransfer(params: {
  from: Address;
  to: Address;
  amount: bigint;
  txHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
}) {
  const wallet = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_wallets WHERE lower(wallet_address) = lower($1) LIMIT 1`,
    [params.to]
  );
  if (!wallet) return;

  if (params.amount <= 0n || params.amount > 9_000_000_000_000_000_000n) {
    throw new Error('ARC_DEPOSIT_AMOUNT_OUT_OF_RANGE');
  }

  const userId = BigInt(wallet.user_id);
  const { usdc } = await ensureAccounts(userId);
  const reference = `arc:${ARC_CHAIN_ID}:${params.txHash.toLowerCase()}:${params.logIndex}`;
  const txId = generateTxId();

  const credited = await withTransaction(async (q) => {
    await q('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [String(usdc.id)]);

    const inserted = await q<{ id: string }>(
      `INSERT INTO transactions
        (id, type, status, recipient_id, amount_ngn, amount_usdc, note, tx_hash, reference, metadata, completed_at)
       VALUES ($1, 'deposit', 'completed', $2, 0, $3, $4, $5, $6, $7::jsonb, NOW())
       ON CONFLICT (reference) DO NOTHING
       RETURNING id`,
      [
        txId,
        String(userId),
        String(params.amount),
        'Verified Arc Mainnet USDC deposit',
        params.txHash,
        reference,
        JSON.stringify({
          chainId: ARC_CHAIN_ID,
          tokenAddress: USDC_ADDRESS,
          from: params.from,
          to: params.to,
          logIndex: params.logIndex,
          blockNumber: String(params.blockNumber),
          decimals: 6,
        }),
      ]
    );

    if (inserted.length === 0) return false;

    const balanceRow = await q<{ balance: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS balance
       FROM ledger_entries WHERE account_id = $1`,
      [String(usdc.id)]
    );
    const balanceAfter = BigInt(balanceRow[0]?.balance ?? '0') + params.amount;

    await q(
      `INSERT INTO ledger_entries (account_id, transaction_id, amount, direction, balance_after)
       VALUES ($1, $2, $3, 'credit', $4)`,
      [String(usdc.id), txId, String(params.amount), String(balanceAfter)]
    );
    return true;
  });

  if (credited) {
    console.log(
      `[arc-deposits] Credited ${params.amount.toString()} micro-USDC to user ${userId}; tx=${params.txHash} log=${params.logIndex}`
    );
  }
}

async function scanOnce() {
  const startBlockRaw = process.env.ARC_DEPOSIT_SCAN_START_BLOCK;
  if (!startBlockRaw || !/^\d+$/.test(startBlockRaw)) {
    console.warn('[arc-deposits] Disabled: set ARC_DEPOSIT_SCAN_START_BLOCK to an audited Arc Mainnet block before enabling deposits');
    return;
  }

  const startBlock = BigInt(startBlockRaw);
  const confirmationsRaw = Number(process.env.ARC_DEPOSIT_CONFIRMATIONS ?? '1');
  const confirmations = Number.isSafeInteger(confirmationsRaw) && confirmationsRaw >= 1
    ? BigInt(confirmationsRaw)
    : 1n;

  const client = getClient();
  const state = await queryOne<{ last_scanned_block: string }>(
    'SELECT last_scanned_block FROM arc_deposit_scan_state WHERE id = 1'
  );

  if (!state) {
    await query(
      `INSERT INTO arc_deposit_scan_state (id, last_scanned_block)
       VALUES (1, $1) ON CONFLICT (id) DO NOTHING`,
      [(startBlock - 1n).toString()]
    );
  }

  const currentState = await queryOne<{ last_scanned_block: string }>(
    'SELECT last_scanned_block FROM arc_deposit_scan_state WHERE id = 1'
  );
  if (!currentState) throw new Error('ARC_DEPOSIT_SCAN_STATE_MISSING');

  const head = await client.getBlockNumber();
  if (head < confirmations) return;
  const safeHead = head - confirmations;
  let fromBlock = BigInt(currentState.last_scanned_block) + 1n;

  while (fromBlock <= safeHead) {
    const toBlock = fromBlock + MAX_BLOCK_RANGE - 1n > safeHead
      ? safeHead
      : fromBlock + MAX_BLOCK_RANGE - 1n;

    const logs = await client.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      if (!log.args.from || !log.args.to || log.args.value === undefined ||
          !log.transactionHash || log.logIndex === null || log.blockNumber === null) {
        throw new Error('ARC_DEPOSIT_LOG_INCOMPLETE');
      }
      await creditVerifiedTransfer({
        from: log.args.from,
        to: log.args.to,
        amount: log.args.value,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
      });
    }

    await query(
      'UPDATE arc_deposit_scan_state SET last_scanned_block = $1, updated_at = NOW() WHERE id = 1',
      [toBlock.toString()]
    );
    fromBlock = toBlock + 1n;
  }
}

export function startArcDepositMonitor() {
  if (timer) return;
  console.log('[arc-deposits] Arc Mainnet USDC monitor starting');
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await scanOnce();
    } catch (error) {
      console.error('[arc-deposits] Scan failed; cursor will be retried:', error);
    } finally {
      running = false;
    }
  };
  void tick();
  timer = setInterval(() => void tick(), SCAN_INTERVAL_MS);
}
