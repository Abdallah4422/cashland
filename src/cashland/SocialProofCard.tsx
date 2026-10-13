// SocialProofCard — live anonymised activity ticker + stats for the Home screen
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, TrendingUp } from 'lucide-react';
import { glass, formatNaira } from './design';
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
      if (step >= steps) {
        prev.current = value;
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className="tabular">
      {prefix}{display.toLocaleString('en-NG')}{suffix}
    </span>
  );
}

// ── Event type icon colour ────────────────────────────────────────────────────
function eventColor(type: FeedEvent['type']): string {
  switch (type) {
    case 'sent':     return '#5B6CF6';
    case 'received': return '#00A86B';
    case 'merchant': return '#F97316';
    case 'airtime':  return '#EC4899';
    case 'deposit':  return '#0EA5E9';
    case 'withdraw': return '#8B5CF6';
  }
}

function eventDot(type: FeedEvent['type']): string {
  return eventColor(type);
}

// ── SocialFeedTicker — single scrolling line for home header ─────────────────
export function SocialFeedTicker() {
  const { latestEvent, stats } = useSocialFeed();
  const [visible, setVisible] = useState<FeedEvent | null>(latestEvent);
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    if (!latestEvent) return;
    const t0 = setTimeout(() => {
      setVisible(latestEvent);
      setShowCount(false);
    }, 0);
    const t1 = setTimeout(() => setShowCount(true), 4000);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [latestEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="mx-5 mb-4 rounded-xl px-3 py-2 flex items-center gap-2 overflow-hidden"
      style={{ background: 'rgba(0,168,107,0.10)', border: '1px solid rgba(0,168,107,0.18)' }}
    >
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--brand)' }} />
      <AnimatePresence mode="wait">
        <motion.p
          key={showCount ? 'count' : (visible?.id ?? 'empty')}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-medium flex-1 truncate"
          style={{ color: 'var(--brand)' }}
        >
          {showCount
            ? `${stats.paymentCount.toLocaleString('en-NG')} payments made on Cashland today`
            : visible
              ? describeFeedEvent(visible)
              : 'Cashland is live'
          }
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
    { label: 'Payments today', value: stats.paymentCount, icon: Zap, color: '#5B6CF6' },
    { label: 'Active users', value: stats.activeUsers, icon: Users, color: '#00A86B' },
    { label: 'Volume (₦M)', value: Math.round(stats.totalVolume / 1_000_000), prefix: '₦', suffix: 'M', icon: TrendingUp, color: '#F97316' },
  ];

  return (
    <div className="px-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Live on Cashland</h3>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00A86B' }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Anonymised</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {statItems.map(({ label, value, icon: Icon, color, prefix = '', suffix = '' }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ ...glass.card }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1.5" style={{ background: color + '18' }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </p>
            <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Live feed list */}
      <div className="rounded-2xl overflow-hidden" style={glass.card}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            Recent activity
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>No personal data shared</p>
        </div>

        <AnimatePresence initial={false}>
          {displayEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: eventDot(event.type) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: 'var(--ink)' }}>
                    {describeFeedEvent(event)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {event.city} · {timeAgo(event.time)}
                  </p>
                </div>
                <p className="text-xs font-semibold tabular flex-shrink-0" style={{ color: eventColor(event.type) }}>
                  {formatNaira(event.amount)}
                </p>
              </div>
              {i < displayEvents.length - 1 && (
                <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.04)' }} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-3 text-xs font-semibold border-t flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          style={{ borderColor: 'rgba(0,0,0,0.05)', color: 'var(--brand)' }}
        >
          {expanded ? 'Show less' : `See more activity`}
        </button>
      </div>
    </div>
  );
}
