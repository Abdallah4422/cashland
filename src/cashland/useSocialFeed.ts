// useSocialFeed — pseudonymous onchain activity feed
// Actors are shown as CashTag handles or truncated wallet addresses.
// No real names, no named merchants — just onchain-style activity.

import { useState, useEffect, useRef } from 'react';
import { formatNaira } from './design';

export type FeedEventType = 'transfer' | 'payment' | 'topup' | 'swap' | 'escrow' | 'withdraw';

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  actor: string;      // @cashtag or 0xABCD…EF12
  target?: string;    // @cashtag or 0xABCD…EF12
  amount: number;
  amountUsdc: number; // amount in USDC cents (amount / fxRate)
  time: Date;
  city: string;
  txHash: string;     // simulated tx hash fragment
}

// Pools
const CASHTAG_PREFIXES = [
  'cash', 'pay', 'send', 'ade', 'ola', 'chi', 'musa', 'bola', 'kemi',
  'seun', 'tobi', 'ife', 'uche', 'lola', 'femi', 'zara', 'dayo', 'bayo',
];
const CASHTAG_SUFFIXES = [
  '01', '22', '99', 'ng', 'pay', 'x', 'pro', '7', '55', 'io',
];
const HEX_CHARS = '0123456789abcdef';
const CITIES = ['Lagos', 'Abuja', 'PH', 'Kano', 'Ibadan', 'Enugu', 'Calabar'];

const AMOUNTS_SMALL = [500, 1000, 1500, 2000, 2500, 3000, 3500];
const AMOUNTS_MID   = [5000, 7500, 8000, 10000, 12000, 15000];
const AMOUNTS_LARGE = [20000, 25000, 30000, 50000, 75000];

const FX_APPROX = 1600; // approximate NGN/USDC for display only

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
}

function randomAmount(): number {
  const r = Math.random();
  if (r < 0.5) return pick(AMOUNTS_SMALL);
  if (r < 0.85) return pick(AMOUNTS_MID);
  return pick(AMOUNTS_LARGE);
}

function makeActor(): string {
  // 60% CashTag, 40% truncated wallet address
  if (Math.random() < 0.6) {
    return `@${pick(CASHTAG_PREFIXES)}${pick(CASHTAG_SUFFIXES)}`;
  }
  return `0x${randomHex(4)}…${randomHex(4)}`;
}

function makeTxHash(): string {
  return `0x${randomHex(6)}…${randomHex(4)}`;
}

let _counter = 1;
function makeEvent(): FeedEvent {
  const types: FeedEventType[] = [
    'transfer', 'transfer', 'transfer',
    'payment', 'payment',
    'topup',
    'swap',
    'escrow',
    'withdraw',
  ];
  const type = pick(types);
  const amount = randomAmount();
  return {
    id: String(_counter++),
    type,
    actor: makeActor(),
    target: (type === 'transfer' || type === 'payment' || type === 'escrow') ? makeActor() : undefined,
    amount,
    amountUsdc: Math.round((amount / FX_APPROX) * 100) / 100,
    time: new Date(),
    city: pick(CITIES),
    txHash: makeTxHash(),
  };
}

// Pre-generate seed events
const SEED_COUNT = 12;
const seedEvents: FeedEvent[] = Array.from({ length: SEED_COUNT }, (_, i) => {
  const e = makeEvent();
  e.time = new Date(Date.now() - (SEED_COUNT - i) * 18_000);
  return e;
});

// Shared singleton state
let sharedFeed: FeedEvent[] = [...seedEvents];
const feedListeners = new Set<() => void>();

function pushEvent(e: FeedEvent) {
  sharedFeed = [e, ...sharedFeed].slice(0, 40);
  feedListeners.forEach(fn => fn());
}

let tickInterval: ReturnType<typeof setInterval> | null = null;
function startTick() {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    pushEvent(makeEvent());
  }, 3500 + Math.random() * 2000);
}

export interface DayStats {
  txCount: number;
  totalVolumeUsdc: number;
  activeAddresses: number;
}

const BASE_STATS: DayStats = {
  txCount: 3241,
  totalVolumeUsdc: 312_890,
  activeAddresses: 28_400,
};

function computeStats(): DayStats {
  return {
    txCount: BASE_STATS.txCount + sharedFeed.length,
    totalVolumeUsdc: BASE_STATS.totalVolumeUsdc + sharedFeed.reduce((s, e) => s + e.amountUsdc, 0),
    activeAddresses: BASE_STATS.activeAddresses + Math.floor(sharedFeed.length * 0.7),
  };
}

export interface SocialFeedData {
  events: FeedEvent[];
  stats: DayStats;
  latestEvent: FeedEvent | null;
}

export function useSocialFeed(): SocialFeedData {
  const [, forceRender] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const cb = () => forceRender(n => n + 1);
    feedListeners.add(cb);
    if (!startedRef.current) {
      startedRef.current = true;
      startTick();
    }
    return () => { feedListeners.delete(cb); };
  }, []);

  return {
    events: sharedFeed,
    stats: computeStats(),
    latestEvent: sharedFeed[0] ?? null,
  };
}

export function describeFeedEvent(e: FeedEvent): string {
  const ngn = formatNaira(e.amount);
  const usdc = `$${e.amountUsdc.toFixed(2)}`;
  switch (e.type) {
    case 'transfer': return `${e.actor} transferred ${ngn} (${usdc}) → ${e.target}`;
    case 'payment':  return `${e.actor} paid ${ngn} (${usdc}) → ${e.target}`;
    case 'topup':    return `${e.actor} topped up ${ngn} (${usdc}) onchain`;
    case 'swap':     return `${e.actor} swapped ${usdc} USDC on Arc`;
    case 'escrow':   return `${e.actor} locked ${ngn} (${usdc}) in SafePay → ${e.target}`;
    case 'withdraw': return `${e.actor} withdrew ${ngn} (${usdc}) to bank`;
  }
}

export function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10)   return 'just now';
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}
