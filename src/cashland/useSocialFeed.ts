// useSocialFeed — anonymised live activity feed for social proof
// Names are truncated (first name + last initial), amounts are real-looking but fictional,
// phone numbers are never shown. Privacy-safe by design.

import { useState, useEffect, useRef } from 'react';
import { formatNaira } from './design';

export type FeedEventType = 'sent' | 'received' | 'merchant' | 'airtime' | 'deposit' | 'withdraw';

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  actor: string;        // e.g. "Amaka B." — first name + last initial only
  target?: string;      // merchant name or recipient first name + initial
  amount: number;
  time: Date;
  city: string;
}

// Pools of realistic Nigerian data — anonymised
const FIRST_NAMES = [
  'Amaka', 'Emeka', 'Ngozi', 'Tunde', 'Kemi', 'Bola', 'Yetunde', 'Chidi',
  'Fatima', 'Musa', 'Aisha', 'Seun', 'Tobi', 'Ola', 'Chiamaka', 'Ibrahim',
  'Chisom', 'Adaeze', 'Femi', 'Hauwa', 'Sola', 'Nkechi', 'Dapo', 'Zainab',
  'Uche', 'Lola', 'Gbenga', 'Adaobi', 'Kunle', 'Bisi', 'Rashida', 'Ifeanyi',
];

const LAST_INITIALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

const MERCHANTS = [
  'Chicken Republic', 'Shoprite', 'TechHub', 'Domino\'s', 'Konga',
  'MTN Airtime', 'Glo Airtime', 'IKEDC', 'DStv', 'Jumia', 'Uber',
  'Chicken Republic', 'Tantalizers', 'EKEDC Bill', 'Airtel Data',
];

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Calabar', 'Kaduna'];

const AMOUNTS_SMALL = [500, 1000, 1500, 2000, 2500, 3000];
const AMOUNTS_MID   = [5000, 7500, 8000, 10000, 12000, 15000];
const AMOUNTS_LARGE = [20000, 25000, 30000, 50000];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(): number {
  const r = Math.random();
  if (r < 0.5) return pick(AMOUNTS_SMALL);
  if (r < 0.85) return pick(AMOUNTS_MID);
  return pick(AMOUNTS_LARGE);
}

function makeName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}.`;
}

let _counter = 1;
function makeEvent(): FeedEvent {
  const types: FeedEventType[] = ['sent', 'merchant', 'airtime', 'deposit', 'sent', 'sent', 'merchant', 'merchant'];
  const type = pick(types);
  return {
    id: String(_counter++),
    type,
    actor: makeName(),
    target: type === 'merchant' || type === 'airtime' ? pick(MERCHANTS) : type === 'sent' ? makeName() : undefined,
    amount: randomAmount(),
    time: new Date(),
    city: pick(CITIES),
  };
}

// Pre-generate seed events so the feed isn't empty on first render
const SEED_COUNT = 12;
const seedEvents: FeedEvent[] = Array.from({ length: SEED_COUNT }, (_, i) => {
  const e = makeEvent();
  // Stagger times backward
  e.time = new Date(Date.now() - (SEED_COUNT - i) * 18_000);
  return e;
});

// Shared singleton state so all hooks share the same feed
let sharedFeed: FeedEvent[] = [...seedEvents];
const feedListeners = new Set<() => void>();

function pushEvent(e: FeedEvent) {
  sharedFeed = [e, ...sharedFeed].slice(0, 40);
  feedListeners.forEach(fn => fn());
}

// Live tick interval — starts once
let tickInterval: ReturnType<typeof setInterval> | null = null;
function startTick() {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    pushEvent(makeEvent());
  }, 3500 + Math.random() * 2000);
}

// ── Today's stats (derived from feed) ───────────────────────────────────────
export interface DayStats {
  paymentCount: number;
  totalVolume: number;
  activeUsers: number;
}

const BASE_STATS: DayStats = {
  paymentCount: 3241,
  totalVolume: 487_650_000,
  activeUsers: 28_400,
};

function computeStats(): DayStats {
  return {
    paymentCount: BASE_STATS.paymentCount + sharedFeed.length,
    totalVolume: BASE_STATS.totalVolume + sharedFeed.reduce((s, e) => s + e.amount, 0),
    activeUsers: BASE_STATS.activeUsers + Math.floor(sharedFeed.length * 0.7),
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────────────────
export function describeFeedEvent(e: FeedEvent): string {
  switch (e.type) {
    case 'sent':      return `${e.actor} sent ${formatNaira(e.amount)} to ${e.target ?? 'a friend'}`;
    case 'received':  return `${e.actor} received ${formatNaira(e.amount)}`;
    case 'merchant':  return `${e.actor} paid ${formatNaira(e.amount)} at ${e.target}`;
    case 'airtime':   return `${e.actor} bought ${formatNaira(e.amount)} airtime`;
    case 'deposit':   return `${e.actor} added ${formatNaira(e.amount)} to Cashland`;
    case 'withdraw':  return `${e.actor} withdrew ${formatNaira(e.amount)} to bank`;
  }
}

export function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10)  return 'just now';
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}
