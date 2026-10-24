import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Building2,
  RefreshCw, Smartphone, ChevronRight, CheckCircle2, Copy, Bell,
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
        <motion.div
          className="absolute rounded-full"
          style={{ width: size + 16, height: size + 16, border: `1.5px solid ${color}` }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={pressed
            ? { opacity: [0.7, 0], scale: [0.9, 1.6], transition: { duration: 0.4, ease: 'easeOut' } }
            : { opacity: 0, scale: 0.85 }}
        />
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size, height: size,
            background: primary
              ? `linear-gradient(135deg, ${color}, ${color}cc)`
              : bg,
            boxShadow: primary
              ? `0 8px 28px ${glow}, 0 0 0 3px ${color}22, inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 4px 16px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
            border: primary ? 'none' : `1px solid ${color}30`,
          }}
          animate={pressed ? { scale: 0.89 } : { scale: 1 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        >
          <Icon
            size={primary ? 20 : 18}
            style={{
              color: primary ? 'white' : color,
              strokeWidth: 2.2,
              filter: `drop-shadow(0 0 ${primary ? 6 : 4}px ${color}${primary ? 'bb' : '88'})`,
            }}
          />
        </motion.div>
      </div>
      <span
        className="text-[11px] font-semibold text-center leading-tight"
        style={{ color: primary ? 'white' : 'rgba(255,255,255,0.7)' }}
      >
        {label}
      </span>
    </button>
  );
}

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

  const CURRENCY_SYMS: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
  const zeroBalance = `${CURRENCY_SYMS[currency] ?? '₦'}0.00`;

  function fmtAmount(ngnAmount: number): string {
    if (currency === 'NGN') return formatNaira(ngnAmount);
    const usdc = ngnAmount / rates.NGN;
    const converted = usdc * (rates[currency] ?? 1);
    const sym = CURRENCY_SYMS[currency] ?? '$';
    const sign = ngnAmount < 0 ? '-' : '+';
    return `${sign}${sym}${Math.abs(converted).toFixed(2)}`;
  }

  function copyTag() {
    void navigator.clipboard.writeText('@musaibrahim').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const currencies: Currency[] = ['NGN', 'USD', 'EUR', 'GBP'];

  return (
    <div className="pb-28 min-h-screen" style={{ background: '#060d18' }}>

      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-3"
        style={{ background: 'linear-gradient(180deg, #060d18 60%, transparent 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00c47d, #00956a)',
              color: 'white',
              boxShadow: '0 2px 12px rgba(0,196,125,0.5)',
            }}
          >
            {(userName ?? 'Musa Ibrahim').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>{greeting}</p>
            <p className="text-[15px] font-bold text-white leading-none" style={{ letterSpacing: '-0.02em' }}>
              {(userName ?? 'Musa Ibrahim').split(' ')[0]}
            </p>
          </div>
        </div>
        <NotificationBell onClick={onOpenNotifications} white />
      </div>

      {/* ── HERO BALANCE CARD ──────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-1">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0b3d2e 0%, #0d3a5c 40%, #0b2a48 70%, #092038 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
            minHeight: 200,
          }}
        >
          {/* Mesh glow layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div style={{
              position: 'absolute', top: -40, right: -30, width: 220, height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,196,125,0.22) 0%, transparent 65%)',
              filter: 'blur(30px)',
            }} />
            <div style={{
              position: 'absolute', bottom: -30, left: -20, width: 180, height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 65%)',
              filter: 'blur(35px)',
            }} />
            <div style={{
              position: 'absolute', top: '40%', left: '30%', width: 160, height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 65%)',
              filter: 'blur(40px)',
            }} />
            {/* Fine grid overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }} />
            {/* Shimmer line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            }} />
          </div>

          {/* Card content */}
          <div className="relative px-5 pt-5 pb-5">
            {/* Label row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}>
                  Total Balance
                </span>
                <button onClick={() => setBalanceVisible(v => !v)} className="active:scale-90 transition-transform">
                  {balanceVisible
                    ? <Eye size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
                    : <EyeOff size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />}
                </button>
                {isConnected && (
                  <button onClick={() => { void refetch(); }} className="active:scale-90 transition-transform">
                    <RefreshCw size={11} style={{ color: 'rgba(255,255,255,0.28)' }} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
              <button onClick={refresh} className="active:opacity-60 transition-opacity">
                <span className="text-[10px] font-medium px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                  {isRefreshing ? 'Updating...' : `$1 = ₦${rates.NGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
                </span>
              </button>
            </div>

            {/* Balance number */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currency}-${usdcFloat}-${isLoading}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {/* Balance number */}
                <div className="flex items-end gap-2.5 mb-3">
                  <span style={{
                    color: 'white',
                    fontSize: 46,
                    fontWeight: 600,
                    letterSpacing: '-0.045em',
                    lineHeight: 1,
                    textShadow: '0 2px 20px rgba(0,196,125,0.3)',
                  }}>
                    {isLoading && isConnected
                      ? <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>Loading...</span>
                      : !balanceVisible
                        ? <span style={{ fontSize: 34, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', fontWeight: 400 }}>••••••</span>
                        : primaryBalance ?? zeroBalance}
                  </span>
                </div>

                {/* Currency segmented toggle pill */}
                <div
                  className="flex items-center gap-0.5 p-1 rounded-2xl self-start mb-1"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {currencies.map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className="px-3 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                      style={currency === c ? {
                        background: '#00c47d',
                        color: 'white',
                        boxShadow: '0 2px 10px rgba(0,196,125,0.45)',
                      } : {
                        color: 'rgba(255,255,255,0.42)',
                        background: 'transparent',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div className="my-4" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

            {/* Account strip inside card */}
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,196,125,0.18)' }}
              >
                <span className="text-[10px] font-black" style={{ color: '#00c47d' }}>₦</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-white mr-1.5">@musaibrahim</span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>· 2181985733</span>
              </div>
              <button
                onClick={copyTag}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl active:scale-95 transition-all"
                style={{
                  background: copied ? 'rgba(0,196,125,0.22)' : 'rgba(255,255,255,0.08)',
                  border: copied ? '1px solid rgba(0,196,125,0.35)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Copy size={11} style={{ color: copied ? '#00c47d' : 'rgba(255,255,255,0.5)' }} />
                <span className="text-[10px] font-semibold" style={{ color: copied ? '#00c47d' : 'rgba(255,255,255,0.5)' }}>
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </button>
              {!isConnected && (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="ml-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold active:scale-95"
                      style={{ background: 'rgba(0,196,125,0.18)', color: '#00c47d', border: '1px solid rgba(0,196,125,0.3)' }}
                    >
                      Link
                    </button>
                  )}
                </ConnectKitButton.Custom>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Live ticker ───────────────────────────────────────────────────── */}
      <SocialFeedTicker />

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-2">
        <div
          className="flex items-start justify-between px-4 py-4 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <CircleAction label="Add Money" icon={Plus}          onClick={onAddMoney}  color="#00c47d" bg="rgba(0,196,125,0.14)"   glow="rgba(0,196,125,0.45)"   primary />
          <CircleAction label="Send"      icon={ArrowUpRight}  onClick={onSend}      color="#818cf8" bg="rgba(129,140,248,0.14)" glow="rgba(129,140,248,0.3)" />
          <CircleAction label="Receive"   icon={ArrowDownLeft} onClick={onReceive}   color="#fbbf24" bg="rgba(251,191,36,0.14)"  glow="rgba(251,191,36,0.3)"  />
          <CircleAction label="Bills"     icon={Smartphone}    onClick={onBills}     color="#f472b6" bg="rgba(244,114,182,0.14)" glow="rgba(244,114,182,0.3)" />
          <CircleAction label="Withdraw"  icon={Building2}     onClick={onWithdraw}  color="#38bdf8" bg="rgba(56,189,248,0.14)"  glow="rgba(56,189,248,0.3)"  />
        </div>
      </div>

      {/* ── Quick Send ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Quick Send</h3>
          <button className="text-[12px] font-semibold" style={{ color: '#00c47d' }}>See all</button>
        </div>
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar">
            {contacts.slice(0, 5).map(c => (
              <button key={c.id} onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform">
                <div className="relative">
                  <Avatar initials={c.initials} color={c.color} size={50} />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full"
                    style={{ background: '#00c47d', border: '2px solid #060d18', boxShadow: '0 0 6px rgba(0,196,125,0.6)' }}
                  />
                </div>
                <span className="text-[11px] font-medium text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {c.name.split(' ')[0]}
                </span>
              </button>
            ))}
            <button onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(0,196,125,0.06)',
                  border: '1.5px dashed rgba(0,196,125,0.3)',
                }}
              >
                <Plus size={16} style={{ color: '#00c47d' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>New</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Recent Activity</h3>
          <button className="text-[12px] font-semibold" style={{ color: '#00c47d' }}>View all</button>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.025) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          }}
        >
          {transactions.map((tx, i) => (
            <div key={tx.id}>
              <motion.div
                className="flex items-center gap-3 px-4 py-4 active:bg-white/[0.03] transition-colors"
                whileTap={{ scale: 0.99 }}
              >
                <div className="relative">
                  <Avatar initials={tx.initials} color={tx.color} size={44} />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      background: tx.type === 'sent' ? '#F97316' : '#00c47d',
                      border: '2px solid #060d18',
                      boxShadow: tx.type === 'sent' ? '0 0 8px rgba(249,115,22,0.5)' : '0 0 8px rgba(0,196,125,0.5)',
                    }}
                  >
                    {tx.type === 'sent'
                      ? <ArrowUpRight size={9} color="white" />
                      : <ArrowDownLeft size={9} color="white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{tx.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={10} style={{ color: '#00c47d' }} />
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {tx.type === 'sent' ? 'Sent' : 'Received'} · {tx.time}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-[14px] font-bold tabular"
                    style={{ color: tx.amount > 0 ? '#00c47d' : 'rgba(255,255,255,0.7)' }}
                  >
                    {tx.amount > 0 ? '+' : ''}{fmtAmount(tx.amount)}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {tx.type === 'sent' ? 'Debit' : 'Credit'}
                  </p>
                </div>
              </motion.div>
              {i < transactions.length - 1 && (
                <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              )}
            </div>
          ))}
          <button
            className="w-full py-3.5 flex items-center justify-center gap-1.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>View all transactions</span>
            <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.28)' }} />
          </button>
        </div>
      </div>

      {/* ── Account completion nudge ──────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(0,196,125,0.08), rgba(56,189,248,0.06))',
            border: '1px solid rgba(0,196,125,0.16)',
            boxShadow: '0 2px 12px rgba(0,196,125,0.08)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,196,125,0.2), rgba(0,196,125,0.1))',
              border: '1px solid rgba(0,196,125,0.25)',
            }}
          >
            <span className="text-[10px] font-extrabold" style={{ color: '#00c47d' }}>40%</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Finish account setup
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Unlock higher limits and faster transfers
            </p>
          </div>
          <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
        </button>
      </div>

    </div>
  );
}
