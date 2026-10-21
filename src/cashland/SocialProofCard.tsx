// SocialProofCard — pseudonymous onchain activity feed
// Shows CashTag handles and truncated wallet addresses, never real names.
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { glass } from './design';
import { useSocialFeed, describeFeedEvent, timeAgo, type FeedEvent } from './useSocialFeed';

// ── Animated stat counter ────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    const steps = 12;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDisplay(Math.round(prev.current + (diff * step) / steps));
      if (step >= steps) { prev.current = value; clearInterval(interval); }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);
  return <span className="tabular">{prefix}{display.toLocaleString('en-NG')}{suffix}</span>;
}

// ── Event type config ────────────────────────────────────────────────────────
function eventConfig(type: FeedEvent['type']): { color: string; label: string; bg: string } {
  switch (type) {
    case 'transfer': return { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', label: 'Transfer' };
    case 'payment':  return { color: '#00c47d', bg: 'rgba(0,196,125,0.15)',   label: 'Payment' };
    case 'topup':    return { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)',   label: 'Top-up' };
    case 'swap':     return { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',   label: 'Swap' };
    case 'escrow':   return { color: '#f472b6', bg: 'rgba(244,114,182,0.15)',  label: 'SafePay' };
    case 'withdraw': return { color: '#fb923c', bg: 'rgba(251,146,60,0.15)',   label: 'Withdraw' };
  }
}

// ── Ticker for home header ───────────────────────────────────────────────────
export function SocialFeedTicker() {
  const { latestEvent, stats } = useSocialFeed();
  const [visible, setVisible] = useState<FeedEvent | null>(latestEvent);
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    if (!latestEvent) return;
    const t0 = setTimeout(() => { setVisible(latestEvent); setShowCount(false); }, 0);
    const t1 = setTimeout(() => setShowCount(true), 4000);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [latestEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-5 mb-4 rounded-xl px-3 py-2 flex items-center gap-2 overflow-hidden"
      style={{ background: 'rgba(0,196,125,0.08)', border: '1px solid rgba(0,196,125,0.15)' }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#00c47d' }} />
      <AnimatePresence mode="wait">
        <motion.p key={showCount ? 'count' : (visible?.id ?? 'empty')}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }} className="text-xs font-medium flex-1 truncate" style={{ color: '#00c47d' }}>
          {showCount
            ? `${stats.txCount.toLocaleString('en-NG')} txns settled on Arc today`
            : visible ? describeFeedEvent(visible) : 'Arc Mainnet is live'}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── Main SocialProofCard ─────────────────────────────────────────────────────
export default function SocialProofCard() {
  const { events, stats } = useSocialFeed();
  const [expanded, setExpanded] = useState(false);
  const displayEvents = expanded ? events.slice(0, 20) : events.slice(0, 5);

  const statItems = [
    { label: 'Txns today', value: stats.txCount, icon: Zap, color: '#818cf8' },
    { label: 'Addresses', value: stats.activeAddresses, icon: Users, color: '#00c47d' },
    { label: 'USDC vol.', value: Math.round(stats.totalVolumeUsdc), prefix: '$', suffix: '', icon: ArrowRight, color: '#fbbf24' },
  ];

  return (
    <div className="px-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Live on Arc</h3>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00c47d' }} />
        </div>
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>Arc Mainnet</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {statItems.map(({ label, value, icon: Icon, color, prefix = '', suffix = '' }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: color + '20' }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-sm font-bold tabular" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </p>
            <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Live feed */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            Mempool
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00c47d' }} />
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>live</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {displayEvents.map((event, i) => {
            const cfg = eventConfig(event.type);
            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Type badge */}
                  <div className="rounded-lg px-2 py-0.5 flex-shrink-0" style={{ background: cfg.bg }}>
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono leading-snug truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {event.actor}
                      {event.target && (
                        <span style={{ color: 'rgba(255,255,255,0.35)' }}> → {event.target}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {event.txHash}
                      </p>
                      <ExternalLink size={9} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {event.city} · {timeAgo(event.time)}
                      </p>
                    </div>
                  </div>
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold tabular" style={{ color: cfg.color }}>
                      ${event.amountUsdc.toFixed(2)}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      USDC
                    </p>
                  </div>
                </div>
                {i < displayEvents.length - 1 && (
                  <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button onClick={() => setExpanded(e => !e)}
          className="w-full py-3 text-xs font-semibold border-t flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#00c47d' }}>
          {expanded ? 'Show less' : 'View more transactions'}
        </button>
      </div>
    </div>
  );
}
