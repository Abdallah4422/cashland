import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowUpRight, ArrowDownLeft, Users, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { formatNaira } from './design';
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

const darkCard = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 };
const darkInner = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16 };

const eventTypeColor = (type: string) => {
  if (type === 'sent') return '#F97316';
  if (type === 'received') return '#00C47D';
  if (type === 'airtime') return '#8B5CF6';
  if (type === 'merchant') return '#0EA5E9';
  return '#6B7280';
};

const eventTypeBadge = (type: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    sent: { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
    received: { bg: 'rgba(0,196,125,0.15)', text: '#00C47D' },
    airtime: { bg: 'rgba(139,92,246,0.15)', text: '#8B5CF6' },
    merchant: { bg: 'rgba(14,165,233,0.15)', text: '#0EA5E9' },
    safepay: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308' },
  };
  return colors[type] ?? { bg: 'rgba(107,114,128,0.15)', text: '#6B7280' };
};

export default function ActivityScreen({ liveTransactions: _liveTransactions }: { liveTransactions?: ApiTransaction[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('mine');
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedTx, setSelectedTx] = useState<DisputeTransaction | null>(null);
  const { events, stats } = useSocialFeed();
  const [showAll, setShowAll] = useState(false);

  const filtered = allTransactions.filter(tx => {
    if (filter === 'Sent') return tx.type === 'sent';
    if (filter === 'Received') return tx.type === 'received';
    if (filter === 'Merchant') return tx.tag === 'Merchant';
    return true;
  });

  const displayEvents = showAll ? events : events.slice(0, 12);

  if (selectedTx) {
    return <DisputeScreen transaction={selectedTx} onClose={() => setSelectedTx(null)} />;
  }

  return (
    <div className="pb-24 pt-6" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-5">
        <div>
          <h2 className="display text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Activity</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Your transactions and network</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,196,125,0.12)', border: '1px solid rgba(0,196,125,0.20)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00C47D' }} />
          <span className="text-xs font-semibold" style={{ color: '#00C47D' }}>Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-5 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {([{ id: 'mine', label: 'My Transactions' }, { id: 'network', label: 'Network' }] as { id: TabId; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
            style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.40)',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.20)' : 'none',
            }}
          >
            {tab.label}
            {tab.id === 'network' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: '#00C47D' }} />
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
                    background: filter === f ? '#00C47D' : 'rgba(255,255,255,0.07)',
                    color: filter === f ? '#001a0e' : 'rgba(255,255,255,0.55)',
                    border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: filter === f ? '0 4px 16px rgba(0,196,125,0.30)' : 'none',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="px-5">
              <div className="rounded-2xl overflow-hidden" style={darkCard}>
                {filtered.map((tx, i) => (
                  <div key={tx.id}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all"
                      style={{ WebkitTapHighlightColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => setSelectedTx(tx)}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar initials={tx.initials} color={tx.color} size={44} />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background: tx.type === 'sent' ? 'rgba(249,115,22,0.20)' : 'rgba(0,196,125,0.20)',
                            border: '1.5px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          {tx.type === 'sent'
                            ? <ArrowUpRight size={9} style={{ color: '#F97316' }} />
                            : <ArrowDownLeft size={9} style={{ color: '#00C47D' }} />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{tx.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.status === 'onchain' && <CheckCircle2 size={11} style={{ color: '#00C47D' }} />}
                          <span className="text-xs" style={{ color: tx.status === 'onchain' ? '#00C47D' : 'rgba(255,255,255,0.40)' }}>
                            {tx.status === 'onchain' ? 'Verified onchain' : 'Successful'}
                          </span>
                          {tx.note && <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.30)' }}>· {tx.note}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold tabular" style={{ color: tx.amount > 0 ? '#00C47D' : 'white' }}>
                          {tx.amount > 0 ? '+' : ''}{formatNaira(tx.amount)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{tx.time}</p>
                      </div>
                    </button>
                    {i < filtered.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Tap any transaction to view details or report an issue.
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
            <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,196,125,0.20) 0%, rgba(0,100,60,0.30) 100%)', border: '1px solid rgba(0,196,125,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: '#00C47D' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.60)' }}>Arc Mainnet · Live Stats</p>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto" style={{ background: '#00C47D' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Txns today', value: stats.txCount.toLocaleString(), icon: TrendingUp },
                  { label: 'Addresses', value: stats.activeAddresses.toLocaleString(), icon: Users },
                  { label: 'USDC vol.', value: `$${(stats.totalVolumeUsdc).toFixed(0)}`, icon: TrendingUp },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                      <Icon size={13} style={{ color: '#00C47D', margin: '0 auto 4px' }} />
                      <p className="text-sm font-bold text-white tabular leading-none">{s.value}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy note */}
            <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(0,196,125,0.08)', border: '1px solid rgba(0,196,125,0.15)' }}>
              <CheckCircle2 size={13} style={{ color: '#00C47D', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                All activity is pseudonymous. No personal data is shared publicly.
              </p>
            </div>

            {/* Live feed */}
            <div className="px-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00C47D' }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>Mempool</p>
              </div>
              <div className="rounded-2xl overflow-hidden" style={darkCard}>
                <AnimatePresence initial={false}>
                  {displayEvents.map((event, i) => {
                    const badge = eventTypeBadge(event.type);
                    const dot = eventTypeColor(event.type);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="flex items-start gap-3 px-4 py-3.5">
                          <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-pretty" style={{ color: 'rgba(255,255,255,0.85)' }}>
                              {describeFeedEvent(event)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.text }}>
                                {event.type}
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                                {event.city} · {timeAgo(event.time)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold tabular" style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {formatNaira(event.amount)}
                            </p>
                            {event.txHash && (
                              <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {event.txHash.slice(0, 6)}…{event.txHash.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                        {i < displayEvents.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-3.5 mt-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={darkInner}
              >
                <span style={{ color: '#00C47D' }}>{showAll ? 'Show less' : `See ${Math.max(0, events.length - 12)} more`}</span>
                <ChevronRight size={15} style={{ color: '#00C47D', transform: showAll ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
