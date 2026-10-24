import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Building2,
  RefreshCw, Smartphone, ChevronRight, CheckCircle2, Copy,
} from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import { formatNaira, contacts } from './design';
import { useUsdcBalance } from './useUsdcBalance';
import { NotificationBell } from './NotificationDrawer';
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
  { id: '1', name: 'Aisha Bello',  type: 'sent'     as const, amount: -5000,  time: '9:42 PM', initials: 'AB', color: '#F97316' },
  { id: '2', name: 'David Okafor', type: 'received' as const, amount: 12500,  time: '7:15 PM', initials: 'DO', color: '#8B5CF6' },
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

// ── Circle action button (OPay-inspired) ─────────────────────────────────────
interface CircleActionProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  bg: string;
  glow: string;
  primary?: boolean;
}

function CircleAction({ label, icon: Icon, onClick, color, bg, glow, primary }: CircleActionProps) {
  const [pressed, setPressed] = useState(false);
  const size = primary ? 52 : 46;

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="flex flex-col items-center gap-2 flex-shrink-0"
    >
      <div className="relative flex items-center justify-center">
        {/* Pulse ring on press */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: size, height: size, border: `2px solid ${color}` }}
          initial={{ opacity: 0, scale: 1 }}
          animate={pressed
            ? { opacity: [0.8, 0], scale: [1, 1.7], transition: { duration: 0.45, ease: 'easeOut' } }
            : { opacity: 0, scale: 1 }}
        />
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size,
            height: size,
            background: primary ? color : bg,
            boxShadow: primary
              ? `0 6px 24px ${glow}, 0 0 0 3px ${color}20`
              : `0 4px 16px ${glow}`,
          }}
          animate={pressed ? { scale: 0.91 } : { scale: 1 }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
        >
          <Icon
            size={primary ? 20 : 18}
            style={{
              color: primary ? 'white' : color,
              strokeWidth: 2.3,
              filter: primary ? 'none' : `drop-shadow(0 0 4px ${color}99)`,
            }}
          />
        </motion.div>
      </div>
      <span
        className="text-[11px] font-semibold text-center leading-tight"
        style={{ color: primary ? 'white' : 'rgba(255,255,255,0.75)' }}
      >
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
  const [copied, setCopied] = useState(false);
  const greeting = getGreeting();
  const { isConnected, isLoading, usdcFloat, refetch } = useUsdcBalance();
  const { rates, isRefreshing, refresh } = useFxRates();

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

  function copyTag() {
    void navigator.clipboard.writeText('@musaibrahim').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // Currency cycle on tap
  const currencies: Currency[] = ['NGN', 'USD', 'GBP'];
  function cycleCurrency() {
    setCurrency(c => {
      const i = currencies.indexOf(c);
      return currencies[(i + 1) % currencies.length];
    });
  }

  return (
    <div className="pb-28 min-h-screen" style={{ background: '#080f1a' }}>

      {/* ── Hero header ───────────────────────────────────────────────────── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(175deg, #0d2040 0%, #080f1a 100%)' }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: 'absolute', top: -60, right: -20, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,125,0.08) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', top: 60, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        {/* Top row */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c47d, #00a86b)', color: 'white', boxShadow: '0 2px 14px rgba(0,196,125,0.45)' }}
            >
              {(userName ?? 'Musa Ibrahim').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{greeting}</p>
              <h1 className="text-[17px] font-bold text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {(userName ?? 'Musa Ibrahim').split(' ')[0]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell onClick={onOpenNotifications} white />
          </div>
        </div>

        {/* ── Open balance (not inside a card box) ── */}
        <div className="relative mb-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em' }}>
                Total Balance
              </p>
              <button onClick={() => setBalanceVisible(v => !v)} className="active:scale-90 transition-transform">
                {balanceVisible
                  ? <Eye size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  : <EyeOff size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              </button>
              {isConnected && (
                <button onClick={() => { void refetch(); }} className="active:scale-90 transition-transform">
                  <RefreshCw size={11} style={{ color: 'rgba(255,255,255,0.28)' }} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <button onClick={refresh} className="active:opacity-60 transition-opacity">
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {isRefreshing ? 'Updating...' : `$1 = ₦${rates.NGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currency}-${usdcFloat}-${isLoading}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              {/* Balance number — tappable to cycle currency */}
              <button onClick={cycleCurrency} className="flex items-baseline gap-2 mb-2 active:opacity-80 transition-opacity">
                <span
                  className="tabular"
                  style={{ color: 'white', fontSize: 44, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1.05 }}
                >
                  {isLoading && isConnected
                    ? <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.35)' }}>Loading...</span>
                    : !balanceVisible
                      ? <span style={{ fontSize: 36, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>••••••</span>
                      : primaryBalance ?? zeroBalance
                  }
                </span>
                {/* Currency badge */}
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-md mb-1"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                >
                  {currency}
                </span>
              </button>


            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Account number / CashTag strip ── */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,196,125,0.15)' }}
          >
            <span className="text-[10px] font-black" style={{ color: '#00c47d' }}>₦</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-white mr-2">@musaibrahim</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>· 2181985733</span>
          </div>
          <button
            onClick={copyTag}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl active:scale-95 transition-all"
            style={{ background: copied ? 'rgba(0,196,125,0.2)' : 'rgba(255,255,255,0.07)' }}
          >
            <Copy size={11} style={{ color: copied ? '#00c47d' : 'rgba(255,255,255,0.45)' }} />
            <span className="text-[10px] font-semibold" style={{ color: copied ? '#00c47d' : 'rgba(255,255,255,0.45)' }}>
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>

          {!isConnected && (
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold active:scale-95"
                  style={{ background: 'rgba(0,196,125,0.18)', color: '#00c47d', border: '1px solid rgba(0,196,125,0.28)' }}
                >
                  Link
                </button>
              )}
            </ConnectKitButton.Custom>
          )}
        </div>
      </div>

      {/* ── Live ticker ───────────────────────────────────────────────────── */}
      <SocialFeedTicker />

      {/* ── Quick actions (circle style) ──────────────────────────────────── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-start justify-between">
          {/* Add Money — primary filled green */}
          <CircleAction
            label="Add Money"
            icon={Plus}
            onClick={onAddMoney}
            color="#00c47d"
            bg="rgba(0,196,125,0.15)"
            glow="rgba(0,196,125,0.4)"
            primary
          />
          <CircleAction label="Send"     icon={ArrowUpRight}  onClick={onSend}     color="#818cf8" bg="rgba(129,140,248,0.15)" glow="rgba(129,140,248,0.3)" />
          <CircleAction label="Receive"  icon={ArrowDownLeft} onClick={onReceive}  color="#fbbf24" bg="rgba(251,191,36,0.15)"  glow="rgba(251,191,36,0.3)"  />
          <CircleAction label="Bills"    icon={Smartphone}    onClick={onBills}    color="#f472b6" bg="rgba(244,114,182,0.15)" glow="rgba(244,114,182,0.3)" />
          <CircleAction label="Withdraw" icon={Building2}     onClick={onWithdraw} color="#38bdf8" bg="rgba(56,189,248,0.15)"  glow="rgba(56,189,248,0.3)"  />
        </div>
      </div>

      {/* ── Quick Send ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Quick Send</h3>
          <button className="text-xs font-medium" style={{ color: '#00c47d' }}>See all</button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar">
          {contacts.slice(0, 5).map(c => (
            <button key={c.id} onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform">
              <Avatar initials={c.initials} color={c.color} size={52} />
              <span className="text-[11px] font-medium text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {c.name.split(' ')[0]}
              </span>
            </button>
          ))}
          <button onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,196,125,0.08)', border: '1.5px dashed rgba(0,196,125,0.35)' }}
            >
              <Plus size={18} style={{ color: '#00c47d' }} />
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>New</span>
          </button>
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Recent Activity</h3>
          <button className="text-xs font-medium" style={{ color: '#00c47d' }}>View all</button>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {transactions.map((tx, i) => (
            <div key={tx.id}>
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="relative">
                  <Avatar initials={tx.initials} color={tx.color} size={44} />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      background: tx.type === 'sent' ? 'rgba(249,115,22,0.18)' : 'rgba(0,196,125,0.18)',
                      border: '1.5px solid rgba(8,15,26,0.8)',
                    }}
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
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {tx.type === 'sent' ? 'Sent' : 'Received'} · {tx.time}
                    </span>
                  </div>
                </div>
                <p
                  className="text-sm font-bold tabular"
                  style={{ color: tx.amount > 0 ? '#00c47d' : 'rgba(255,255,255,0.65)' }}
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.38)' }}>View all transactions</span>
            <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />
          </button>
        </div>
      </div>

      {/* ── Account completion nudge ──────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: 'rgba(0,196,125,0.06)', border: '1px solid rgba(0,196,125,0.14)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,196,125,0.14)' }}
          >
            <span className="text-[10px] font-bold" style={{ color: '#00c47d' }}>40%</span>
          </div>
          <p className="text-[13px] font-medium flex-1 text-left" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Finish account setup to unlock higher limits
          </p>
          <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </button>
      </div>

    </div>
  );
}
