import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Building2,
  RefreshCw, Smartphone, ChevronRight, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import { formatNaira, contacts } from './design';
import { useUsdcBalance } from './useUsdcBalance';
import { NotificationBell } from './NotificationDrawer';
import CurrencyToggle from './CurrencyToggle';
import { useFxRates, loadCurrencyPref, formatUsdcAs, type Currency } from './useFxRates';
import { SocialFeedTicker } from './SocialProofCard';

interface Props {
  liveBalance?: number;
  userName?: string;
  onSend: () => void;
  onReceive: () => void;
  onAddMoney: () => void;
  onWithdraw: () => void;
  onBills: () => void;
  onInvite: () => void;
  onOpenNotifications: () => void;
}

const transactions = [
  { id: '1', name: 'Aisha Bello', tag: '@aisha', type: 'sent' as const, amount: -5000, time: '9:42 PM', initials: 'AB', color: '#F97316' },
  { id: '2', name: 'David Okafor', tag: '@david_ok', type: 'received' as const, amount: 12500, time: '7:15 PM', initials: 'DO', color: '#8B5CF6' },
];

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}DD, ${color})`,
        fontSize: size * 0.32,
        boxShadow: `0 2px 8px ${color}40`,
      }}
    >
      {initials}
    </div>
  );
}
export { Avatar };

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ── Neon quick-action button ─────────────────────────────────────────────────
interface NeonBtnProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  bg: string;
  glow: string;
}

function NeonBtn({ label, icon: Icon, onClick, color, bg, glow }: NeonBtnProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ border: `2px solid ${color}` }}
          initial={{ opacity: 0, scale: 1 }}
          animate={pressed
            ? { opacity: [0.7, 0], scale: [1, 1.6], transition: { duration: 0.5, ease: 'easeOut' } }
            : { opacity: 0, scale: 1 }}
        />
        <motion.div
          className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center relative overflow-hidden"
          style={{ background: bg, border: `1.5px solid ${color}35` }}
          animate={pressed
            ? { boxShadow: `0 0 0 3px ${color}25, 0 8px 24px ${glow}`, scale: 0.93 }
            : { boxShadow: `0 4px 18px ${glow}`, scale: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 25%, ${color}28 0%, transparent 65%)` }} />
          <Icon size={22} style={{ color, strokeWidth: 2.2, filter: `drop-shadow(0 0 5px ${color}bb)`, position: 'relative', zIndex: 1 }} />
        </motion.div>
      </div>
      <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: 'rgba(255,255,255,0.82)' }}>
        {label}
      </span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeScreen({
  onSend, onReceive, onAddMoney, onWithdraw, onBills, onInvite, onOpenNotifications, liveBalance, userName,
}: Props) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currency, setCurrency] = useState<Currency>(loadCurrencyPref);
  const greeting = getGreeting();
  const { isConnected, isLoading, usdcFloat, refetch } = useUsdcBalance();
  const { rates, isRefreshing, refresh } = useFxRates();

  const quickActions = [
    { label: 'Add Money', icon: Plus,          onClick: onAddMoney, color: '#00c47d', bg: 'rgba(0,196,125,0.14)',  glow: 'rgba(0,196,125,0.28)'  },
    { label: 'Send',      icon: ArrowUpRight,  onClick: onSend,     color: '#818cf8', bg: 'rgba(129,140,248,0.14)', glow: 'rgba(129,140,248,0.28)' },
    { label: 'Receive',   icon: ArrowDownLeft, onClick: onReceive,  color: '#fbbf24', bg: 'rgba(251,191,36,0.14)',  glow: 'rgba(251,191,36,0.28)'  },
    { label: 'Bills',     icon: Smartphone,    onClick: onBills,    color: '#f472b6', bg: 'rgba(244,114,182,0.14)', glow: 'rgba(244,114,182,0.28)' },
  ];

  const hasLiveBalance = liveBalance !== undefined && liveBalance > 0;
  const ngnFloat = hasLiveBalance ? liveBalance : (isConnected ? usdcFloat * rates.NGN : 0);
  const usdcEquiv = ngnFloat / rates.NGN;

  const primaryBalance = hasLiveBalance
    ? formatUsdcAs(usdcEquiv, currency, rates)
    : isConnected ? formatUsdcAs(usdcFloat, currency, rates) : null;

  const zeroBalance = currency === 'NGN' ? '₦0.00' : currency === 'USD' ? '$0.00' : '£0.00';

  function fmtAmount(ngnAmount: number): string {
    if (currency === 'NGN') return formatNaira(ngnAmount);
    const usdc = ngnAmount / rates.NGN;
    const converted = usdc * rates[currency];
    const sym = currency === 'USD' ? '$' : '£';
    const sign = ngnAmount < 0 ? '-' : '+';
    return `${sign}${sym}${Math.abs(converted).toFixed(2)}`;
  }

  return (
    <div className="pb-28 min-h-screen" style={{ background: '#080f1a' }}>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div
        className="relative px-5 pt-14 pb-7"
        style={{ background: 'linear-gradient(160deg, #0c1f3a 0%, #080f1a 100%)' }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: 'absolute', top: -60, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,125,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: 20, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        {/* Top row */}
        <div className="relative flex items-center justify-between mb-7">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{greeting}</p>
            <h1 className="text-[22px] font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
              {userName ?? 'Musa Ibrahim'}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationBell onClick={onOpenNotifications} white />
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #00c47d, #00a86b)', color: 'white', boxShadow: '0 2px 12px rgba(0,196,125,0.4)' }}
            >
              MI
            </div>
          </div>
        </div>

        {/* Balance card */}
        <motion.div
          className="rounded-3xl p-5"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {/* Card top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                Total Balance
              </span>
              {/* SafePay pill — minimal, not a full promo block */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,196,125,0.12)', border: '1px solid rgba(0,196,125,0.25)' }}
              >
                <ShieldCheck size={9} style={{ color: '#00c47d' }} />
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#00c47d' }}>SafePay</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {isConnected && (
                <button onClick={() => { void refetch(); }} className="active:scale-90 transition-transform">
                  <RefreshCw size={13} style={{ color: 'rgba(255,255,255,0.35)' }} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}
              <button onClick={() => setBalanceVisible(v => !v)} className="active:scale-90 transition-transform">
                {balanceVisible
                  ? <Eye size={15} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  : <EyeOff size={15} style={{ color: 'rgba(255,255,255,0.35)' }} />}
              </button>
            </div>
          </div>

          {/* Balance amount */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currency}-${usdcFloat}-${isLoading}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span
                  className="text-[42px] font-bold tabular"
                  style={{ color: 'white', letterSpacing: '-0.035em', lineHeight: 1.1 }}
                >
                  {isLoading && isConnected
                    ? <span className="text-3xl" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</span>
                    : !balanceVisible
                      ? <span style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>••••••</span>
                      : primaryBalance ?? zeroBalance
                  }
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {isConnected && !isLoading
                  ? `${usdcFloat.toFixed(2)} USDC`
                  : 'Add money to get started'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Currency toggle + FX rate — inside card, bottom */}
          <div className="flex items-center justify-between mt-4 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <CurrencyToggle value={currency} onChange={setCurrency} white />
            <button
              onClick={refresh}
              className="flex items-center gap-1 active:scale-95 transition-transform"
            >
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {isRefreshing ? 'Updating...' : `$1 = ₦${rates.NGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
              </span>
            </button>
          </div>

          {/* Connect wallet — only if not connected */}
          {!isConnected && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(0,196,125,0.18)', color: '#00c47d', border: '1px solid rgba(0,196,125,0.3)' }}
                  >
                    Link your account
                  </button>
                )}
              </ConnectKitButton.Custom>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Live ticker ──────────────────────────────────────────────────── */}
      <SocialFeedTicker />

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-1">
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map(a => (
            <NeonBtn key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* ── Withdraw pill row (secondary, slim) ──────────────────────────── */}
      <div className="px-5 pt-4 pb-1">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onWithdraw}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl active:scale-[0.97] transition-transform"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Building2 size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Withdraw</span>
          </button>
          <button
            onClick={onInvite}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl active:scale-[0.97] transition-transform"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Invite & Earn</span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,196,125,0.18)', color: '#00c47d' }}>₦500</span>
          </button>
        </div>
      </div>

      {/* ── Quick Send ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Quick Send</h3>
          <button className="text-xs font-medium" style={{ color: '#00c47d' }}>See all</button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar">
          {contacts.slice(0, 5).map(c => (
            <button key={c.id} onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform">
              <Avatar initials={c.initials} color={c.color} size={50} />
              <span className="text-[11px] font-medium text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.name.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center" style={{ background: 'rgba(0,196,125,0.1)', border: '1.5px dashed rgba(0,196,125,0.4)' }}>
              <Plus size={18} style={{ color: '#00c47d' }} />
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>New</span>
          </button>
        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────────── */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Recent Activity</h3>
          <button className="text-xs font-medium" style={{ color: '#00c47d' }}>View all</button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {transactions.map((tx, i) => (
            <div key={tx.id}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="relative">
                  <Avatar initials={tx.initials} color={tx.color} size={42} />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{ background: tx.type === 'sent' ? 'rgba(249,115,22,0.2)' : 'rgba(0,196,125,0.2)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                  >
                    {tx.type === 'sent'
                      ? <ArrowUpRight size={10} style={{ color: '#F97316' }} />
                      : <ArrowDownLeft size={10} style={{ color: '#00c47d' }} />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>{tx.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={10} style={{ color: '#00c47d' }} />
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Verified · {tx.time}</span>
                  </div>
                </div>
                <p
                  className="text-sm font-bold tabular"
                  style={{ color: tx.amount > 0 ? '#00c47d' : 'rgba(255,255,255,0.7)' }}
                >
                  {fmtAmount(tx.amount)}
                </p>
              </div>
              {i < transactions.length - 1 && (
                <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              )}
            </div>
          ))}
          <button
            className="w-full py-3.5 flex items-center justify-center gap-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>View all transactions</span>
            <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>
      </div>

      {/* ── Account completion nudge — slim single-line ───────────────────── */}
      <div className="px-5 pt-4 pb-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: 'rgba(0,196,125,0.07)', border: '1px solid rgba(0,196,125,0.15)' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,196,125,0.15)' }}>
            <span className="text-[10px] font-bold" style={{ color: '#00c47d' }}>40%</span>
          </div>
          <p className="text-sm font-medium flex-1 text-left" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Finish account setup to unlock higher limits
          </p>
          <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        </button>
      </div>

    </div>
  );
}
