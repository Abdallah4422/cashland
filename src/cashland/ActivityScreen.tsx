import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowUpRight, ArrowDownLeft, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { glass, formatNaira } from './design';
import { Avatar } from './HomeScreen';
import { useSocialFeed, describeFeedEvent, timeAgo } from './useSocialFeed';
import DisputeScreen, { type DisputeTransaction } from './DisputeScreen';

const allTransactions: DisputeTransaction[] = [
  { id: '1', name: 'Aisha Bello', tag: '@aisha', type: 'sent', amount: -5000, status: 'onchain', time: 'Today, 9:42 PM', initials: 'AB', color: '#F97316', note: 'Dinner split', reference: 'CL-92480283', txHash: '0x8F9237a4b1C2d3E4f5A6b7C8d9E0f1A2b3C4d5E641AE' },
  { id: '2', name: 'David Okafor', tag: '@david_ok', type: 'received', amount: 12500, status: 'onchain', time: 'Today, 7:15 PM', initials: 'DO', color: '#8B5CF6', note: '', reference: 'CL-83940182' },
  { id: '3', name: 'TechHub Lagos', tag: 'Merchant', type: 'sent', amount: -8200, status: 'success', time: 'Yesterday', initials: 'TH', color: '#0EA5E9', note: 'Phone accessories', reference: 'CL-74829103' },
  { id: '4', name: 'Abdul Musa', tag: '@abdulmusa', type: 'received', amount: 3000, status: 'onchain', time: 'Mon, 3 Oct', initials: 'AM', color: '#EC4899', note: 'Fuel money', reference: 'CL-65710294' },
  { id: '5', name: 'Chioma Eze', tag: '@chioma_e', type: 'sent', amount: -15000, status: 'onchain', time: 'Sun, 2 Oct', initials: 'CE', color: '#0EA5E9', note: 'Rent contribution', reference: 'CL-56601385' },
  { id: '6', name: 'Market Hub', tag: 'Merchant', type: 'sent', amount: -4500, status: 'success', time: 'Sat, 1 Oct', initials: 'MH', color: '#6B7280', note: 'Groceries', reference: 'CL-47492476' },
];

type Filter = 'All' | 'Sent' | 'Received' | 'Merchant';
type TabId = 'mine' | 'network';

import type { ApiTransaction } from './api';

export default function ActivityScreen({ liveTransactions: _liveTransactions }: { liveTransactions?: ApiTransaction[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('mine');
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedTx, setSelectedTx] = useState<DisputeTransaction | null>(null);
  const { events, stats } = useSocialFeed();
  const isLive = true;
  const [showAll, setShowAll] = useState(false);

  const filtered = allTransactions.filter(tx => {
    if (filter === 'Sent') return tx.type === 'sent';
    if (filter === 'Received') return tx.type === 'received';
    if (filter === 'Merchant') return tx.tag === 'Merchant';
    return true;
  });

  const displayEvents = showAll ? events : events.slice(0, 12);

  const eventColor = (type: string) => {
    if (type === 'sent') return '#F97316';
    if (type === 'received') return '#00A86B';
    if (type === 'airtime') return '#8B5CF6';
    if (type === 'merchant') return '#0EA5E9';
    return '#6B7280';
  };

  if (selectedTx) {
    return (
      <DisputeScreen
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    );
  }

  return (
    <div className="pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-4">
        <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Activity</h2>
        {isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,168,107,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Live</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-5 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
        {([{ id: 'mine', label: 'My Transactions' }, { id: 'network', label: 'Network Activity' }] as { id: TabId; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
            style={{
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--ink)' : 'var(--muted)',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
            {tab.id === 'network' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
            )}
          </button>
        ))}
      </div>

      {/* My Transactions */}
      {activeTab === 'mine' && (
        <AnimatePresence mode="wait">
          <motion.div key="mine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Filter chips */}
            <div className="flex gap-2 px-5 mb-4 overflow-x-auto pb-1 no-scrollbar">
              {(['All', 'Sent', 'Received', 'Merchant'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
                  style={{
                    background: filter === f ? 'var(--brand)' : 'rgba(255,255,255,0.70)',
                    color: filter === f ? 'white' : 'var(--subtle)',
                    border: filter === f ? 'none' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="px-5">
              <div className="rounded-2xl overflow-hidden" style={glass.card}>
                {filtered.map((tx, i) => (
                  <div key={tx.id}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-black/5"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar initials={tx.initials} color={tx.color} size={42} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: tx.type === 'sent' ? '#FEF3C7' : '#E6F7F1', border: '1.5px solid white' }}>
                          {tx.type === 'sent'
                            ? <ArrowUpRight size={10} style={{ color: '#D97706' }} />
                            : <ArrowDownLeft size={10} style={{ color: 'var(--brand)' }} />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{tx.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.status === 'onchain' && <CheckCircle2 size={11} style={{ color: 'var(--brand)' }} />}
                          <span className="text-xs" style={{ color: tx.status === 'onchain' ? 'var(--brand)' : 'var(--muted)' }}>
                            {tx.status === 'onchain' ? 'Verified onchain' : 'Successful'}
                          </span>
                          {tx.note && <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>· {tx.note}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold tabular" style={{ color: tx.amount > 0 ? 'var(--brand)' : 'var(--ink)' }}>
                          {tx.amount > 0 ? '+' : ''}{formatNaira(tx.amount)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{tx.time}</p>
                      </div>
                    </button>
                    {i < filtered.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
                Tap any transaction to view details or report a problem.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Network Activity */}
      {activeTab === 'network' && (
        <AnimatePresence mode="wait">
          <motion.div key="network" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats banner */}
            <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #00C47D, #00A86B)', boxShadow: '0 8px 24px rgba(0,168,107,0.25)' }}>
              <p className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wide">Network Stats Today</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Payments', value: stats.paymentCount.toLocaleString(), icon: TrendingUp },
                  { label: 'Active users', value: stats.activeUsers.toLocaleString(), icon: Users },
                  { label: 'Volume', value: `₦${(stats.totalVolume / 1_000_000).toFixed(1)}M`, icon: TrendingUp },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Icon size={14} style={{ color: 'rgba(255,255,255,0.70)', margin: '0 auto 4px' }} />
                      <p className="text-base font-bold text-white tabular leading-none">{s.value}</p>
                      <p className="text-xs text-white/60 mt-1">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy note */}
            <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--brand-light)' }}>
              <CheckCircle2 size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                All activity is anonymised. No personal data is shared publicly.
              </p>
            </div>

            {/* Live feed */}
            <div className="px-5">
              <div className="rounded-2xl overflow-hidden" style={glass.card}>
                <AnimatePresence initial={false}>
                  {displayEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: eventColor(event.type) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-pretty" style={{ color: 'var(--ink)' }}>{describeFeedEvent(event)}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{event.city} · {timeAgo(event.time)}</p>
                        </div>
                        <p className="text-sm font-semibold tabular flex-shrink-0" style={{ color: 'var(--ink)' }}>
                          {formatNaira(event.amount)}
                        </p>
                      </div>
                      {i < displayEvents.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.04)' }} />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-3.5 mt-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.70)', color: 'var(--brand)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                {showAll ? 'Show less' : `See ${events.length - 12} more`}
                <ChevronRight size={15} style={{ transform: showAll ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
