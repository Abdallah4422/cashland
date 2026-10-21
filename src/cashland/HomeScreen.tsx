import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Building2, CheckCircle2, ChevronRight, ShieldCheck, Wallet, RefreshCw, Smartphone, UserPlus, TrendingUp } from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import { glass, navyGradient, formatNaira, contacts } from './design';
import { useUsdcBalance } from './useUsdcBalance';
import { NotificationBell } from './NotificationDrawer';
import CurrencyToggle from './CurrencyToggle';
import { useFxRates, loadCurrencyPref, formatUsdcAs, getFxBreakdown, type Currency } from './useFxRates';
import { SocialFeedTicker } from './SocialProofCard';
import SocialProofCard from './SocialProofCard';

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
  { id: '1', name: 'Aisha Bello', tag: '@aisha', type: 'sent' as const, amount: -5000, status: 'onchain', time: '9:42 PM', initials: 'AB', color: '#F97316' },
  { id: '2', name: 'David Okafor', tag: '@david_ok', type: 'received' as const, amount: 12500, status: 'onchain', time: '7:15 PM', initials: 'DO', color: '#8B5CF6' },
  { id: '3', name: 'TechHub Lagos', tag: 'Merchant', type: 'sent' as const, amount: -8200, status: 'success', time: 'Yesterday', initials: 'TH', color: '#0EA5E9' },
];

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}DD, ${color})`, fontSize: size * 0.32, boxShadow: `0 2px 8px ${color}40` }}
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

export default function HomeScreen({ onSend, onReceive, onAddMoney, onWithdraw, onBills, onInvite, onOpenNotifications, liveBalance, userName }: Props) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currency, setCurrency] = useState<Currency>(loadCurrencyPref);
  const greeting = getGreeting();
  const { isConnected, isLoading, usdcFloat, refetch } = useUsdcBalance();
  const { rates, updatedAt, isRefreshing, refresh } = useFxRates();

  const quickActions = [
    { label: 'Add Money', icon: Plus, onClick: onAddMoney, color: '#00c47d', bg: 'rgba(0,196,125,0.15)', glow: 'rgba(0,196,125,0.3)' },
    { label: 'Send', icon: ArrowUpRight, onClick: onSend, color: '#818cf8', bg: 'rgba(129,140,248,0.15)', glow: 'rgba(129,140,248,0.3)' },
    { label: 'Receive', icon: ArrowDownLeft, onClick: onReceive, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', glow: 'rgba(251,191,36,0.3)' },
    { label: 'Withdraw', icon: Building2, onClick: onWithdraw, color: '#f472b6', bg: 'rgba(244,114,182,0.15)', glow: 'rgba(244,114,182,0.3)' },
  ];

  // If we have a live backend balance in NGN, prefer that. Otherwise fall back to USDC onchain.
  const hasLiveBalance = liveBalance !== undefined && liveBalance > 0;
  const ngnFloat = hasLiveBalance ? liveBalance : (isConnected ? usdcFloat * rates.NGN : 0);
  const usdcEquiv = ngnFloat / rates.NGN;

  // Primary balance in selected currency
  const primaryBalance = hasLiveBalance
    ? formatUsdcAs(usdcEquiv, currency, rates)
    : isConnected ? formatUsdcAs(usdcFloat, currency, rates) : null;

  // Secondary line shows USDC + rate info
  const rateTime = updatedAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  const secondaryLine = hasLiveBalance
    ? `${usdcEquiv.toFixed(4)} USDC equiv · Rate updated ${rateTime}`
    : isConnected
      ? isLoading ? 'Loading balance...' : `${usdcFloat.toFixed(4)} USDC · Rate updated ${rateTime}`
      : 'Connect wallet to see live balance';

  // FX equivalents for activity amounts
  function fmtAmount(ngnAmount: number): string {
    if (currency === 'NGN') return formatNaira(ngnAmount);
    const usdc = ngnAmount / rates.NGN;
    const converted = usdc * rates[currency];
    const sym = currency === 'USD' ? '$' : '£';
    const sign = ngnAmount < 0 ? '-' : '+';
    return `${sign}${sym}${Math.abs(converted).toFixed(2)}`;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-6" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0c1c32 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <p className="text-white/65 text-sm font-medium mb-0.5">{greeting}</p>
            <h1 className="display text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {userName ?? 'Musa Ibrahim'}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <NotificationBell onClick={onOpenNotifications} white />
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: '2px solid rgba(255,255,255,0.50)' }}>
              MI
            </div>
          </div>
        </div>

        {/* Currency toggle — on green header */}
        <div className="relative flex items-center justify-between mb-4">
          <CurrencyToggle value={currency} onChange={setCurrency} white />
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <TrendingUp size={12} style={{ color: 'rgba(255,255,255,0.8)' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {isRefreshing ? 'Updating...' : 'FX rates'}
            </span>
          </button>
        </div>

        {/* Balance Card */}
        <motion.div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
              Cashland Balance
            </span>
            <div className="flex items-center gap-2">
              {isConnected && (
                <button onClick={() => { void refetch(); }} className="transition-all active:scale-90">
                  <RefreshCw size={13} style={{ color: 'var(--muted)' }} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}
              <button onClick={() => setBalanceVisible(v => !v)}>
                {balanceVisible ? <Eye size={16} style={{ color: 'var(--muted)' }} /> : <EyeOff size={16} style={{ color: 'var(--muted)' }} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currency}-${isConnected ? (isLoading ? 'loading' : usdcFloat.toString()) : 'disconnected'}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline gap-1 mb-1">
                <span className="display text-4xl font-bold tabular" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                  {!isConnected
                    ? <span style={{ color: 'var(--muted)' }}>—</span>
                    : isLoading && isConnected
                      ? <span className="text-3xl" style={{ color: 'var(--muted)' }}>Loading...</span>
                      : !balanceVisible
                        ? '••••••'
                        : primaryBalance
                  }
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{secondaryLine}</p>

              {/* FX equivalents row — only when balance visible + connected + non-NGN selected */}
              {isConnected && !isLoading && balanceVisible && currency !== 'NGN' && usdcFloat > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                    Also: {formatUsdcAs(usdcFloat, 'NGN', rates)} · {getFxBreakdown(usdcFloat * rates.NGN, rates)}
                  </p>
                </div>
              )}
              {isConnected && !isLoading && balanceVisible && currency === 'NGN' && usdcFloat > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                    {getFxBreakdown(usdcFloat * rates.NGN, rates)} · {usdcFloat.toFixed(4)} USDC
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {!isConnected && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button
                    onClick={show}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--brand)', color: 'white' }}
                  >
                    <Wallet size={15} />
                    Connect wallet
                  </button>
                )}
              </ConnectKitButton.Custom>
            </div>
          )}
        </motion.div>

        {/* Rates ticker strip */}
        <div className="mt-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
          {(['NGN', 'USD', 'GBP'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: currency === c ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                color: currency === c ? 'var(--brand)' : 'rgba(255,255,255,0.85)',
              }}
            >
              {c === 'NGN' ? `₦1 USDC = ₦${rates.NGN.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` :
               c === 'USD' ? `$1 USDC = $${rates.USD.toFixed(2)}` :
               `£1 USDC = £${rates.GBP.toFixed(2)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Live activity ticker */}
      <SocialFeedTicker />

      {/* Quick actions */}
      <div className="px-5 -mt-1 mb-5">
        <div className="grid grid-cols-4 gap-3 pt-5">
          {quickActions.map(({ label, icon: Icon, onClick, color, bg, glow }) => (
            <button key={label} onClick={onClick} className="flex flex-col items-center gap-2 transition-all active:scale-90">
              <div
                className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center"
                style={{
                  background: bg,
                  boxShadow: `0 4px 20px ${glow}, 0 1px 0 rgba(255,255,255,0.06) inset`,
                  border: `1px solid ${color}28`,
                }}
              >
                <Icon size={22} style={{ color, strokeWidth: 2 }} />
              </div>
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--ink)', fontSize: 11 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account setup completion banner */}
      <div className="px-5 mb-4">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(0,196,125,0.12), rgba(129,140,248,0.08))', border: '1px solid rgba(0,196,125,0.2)' }}
        >
          <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#00c47d" strokeWidth="3" strokeDasharray={`${2 * Math.PI * 18 * 0.4} ${2 * Math.PI * 18 * 0.6}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: '#00c47d' }}>40%</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Complete your account</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Finish setup to unlock higher limits</p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Secondary actions — Bills + Invite */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Pay Bills', icon: Smartphone, onClick: onBills, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.2)' },
            { label: 'Invite & Earn', icon: UserPlus, onClick: onInvite, color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.2)' },
          ].map(({ label, icon: Icon, onClick, color, bg, border }) => (
            <button key={label} onClick={onClick} className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl transition-all active:scale-95" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Send */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Quick Send</h3>
          <button className="text-xs font-medium" style={{ color: 'var(--brand)' }}>See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {contacts.map(c => (
            <button key={c.id} onClick={onSend} className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all active:scale-95">
              <Avatar initials={c.initials} color={c.color} size={52} />
              <span className="text-xs font-medium text-center" style={{ color: 'var(--ink)' }}>{c.name}</span>
              <span className="text-xs text-center" style={{ color: 'var(--muted)' }}>{c.tag}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: 'var(--brand-light)', border: '2px dashed var(--brand)' }}>
              <Plus size={20} style={{ color: 'var(--brand)' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>New</span>
          </button>
        </div>
      </div>

      {/* SafePay Promo */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(0,196,125,0.1), rgba(129,140,248,0.08))', border: '1px solid rgba(0,196,125,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
            <ShieldCheck size={20} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cashland SafePay</p>
            <p className="text-xs mt-0.5 text-pretty" style={{ color: 'var(--subtle)' }}>Pay sellers with added protection.</p>
          </div>
          <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex-shrink-0" style={{ background: 'var(--brand)' }}>
            Try SafePay
          </button>
        </div>
      </div>

      {/* Social proof card */}
      <SocialProofCard />

      {/* Recent Activity */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Recent Activity</h3>
          <button className="text-xs font-medium" style={{ color: 'var(--brand)' }}>View all</button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {transactions.map((tx, i) => (
            <div key={tx.id}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="relative">
                  <Avatar initials={tx.initials} color={tx.color} size={42} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: tx.type === 'sent' ? '#FEF3C7' : '#E6F7F1', border: '1.5px solid white' }}>
                    {tx.type === 'sent' ? <ArrowUpRight size={10} style={{ color: '#D97706' }} /> : <ArrowDownLeft size={10} style={{ color: 'var(--brand)' }} />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{tx.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.status === 'onchain' ? (
                      <><CheckCircle2 size={11} style={{ color: 'var(--brand)' }} /><span className="text-xs" style={{ color: 'var(--brand)' }}>Verified onchain</span></>
                    ) : (
                      <><CheckCircle2 size={11} style={{ color: 'var(--muted)' }} /><span className="text-xs" style={{ color: 'var(--muted)' }}>Successful</span></>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular" style={{ color: tx.amount > 0 ? 'var(--brand)' : 'var(--ink)' }}>
                    {fmtAmount(tx.amount)}
                  </p>
                  {/* Secondary currency line */}
                  {currency !== 'NGN' && (
                    <p className="text-xs tabular" style={{ color: 'var(--muted)' }}>
                      {formatNaira(tx.amount)}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{tx.time}</p>
                </div>
              </div>
              {i < transactions.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
          <button className="w-full py-3.5 flex items-center justify-center gap-1.5 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)', color: 'var(--brand)' }}>
            <span className="text-sm font-semibold">View all transactions</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
