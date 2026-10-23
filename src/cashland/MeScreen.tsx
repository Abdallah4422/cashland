import { ChevronRight, Shield, Bell, HelpCircle, LogOut, Copy, Check, Star, CreditCard, Lock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatNaira } from './design';
import { loadSession, clearSession } from './useUserSession';
import type { ApiUser } from './api';

interface Props { onOpenTier: () => void; onSignOut?: () => void; user?: ApiUser; kycTier?: 1 | 2 | 3; }

const CURRENT_TIER = 2;
const TIER_COLOR = '#00A86B';
const DAILY_USED = 127500;
const DAILY_LIMIT = 500000;

const BG = 'linear-gradient(180deg, #080f1a 0%, #0a1628 50%, #0c1c32 100%)';
const darkCard = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' };

const menuSections = [
  { title: 'Account', items: [
    { icon: CreditCard, label: 'Bank Accounts', sub: 'Manage linked banks', color: '#3B82F6' },
    { icon: Star, label: 'Cashland Pro', sub: 'Unlock premium features', badge: 'Pro', color: '#F59E0B' },
    { icon: Lock, label: 'Security', sub: 'PIN, biometrics, devices', color: '#8B5CF6' },
  ]},
  { title: 'Preferences', items: [
    { icon: Bell, label: 'Notifications', sub: 'Payment alerts & updates', color: '#EC4899' },
    { icon: Shield, label: 'Privacy', sub: 'Data and permissions', color: '#00A86B' },
  ]},
  { title: 'Support', items: [
    { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs and contact', color: '#0EA5E9' },
  ]},
];

export default function MeScreen({ onOpenTier, onSignOut, user: backendUser, kycTier: _kycTier }: Props) {
  const [copied, setCopied] = useState(false);
  const session = loadSession();
  const displayName = backendUser ? `${backendUser.firstName} ${backendUser.lastName}` : session ? `${session.firstName} ${session.lastName}` : 'Musa Ibrahim';
  const displayTag = session?.tag ?? '@musa';
  const displayInitials = session ? (session.firstName[0] ?? 'M') + (session.lastName[0] ?? 'I') : 'MI';
  const displayPhone = session?.phone ? session.phone.slice(0, 3) + ' *** ' + session.phone.slice(-4) : '0803 *** 4567';
  const tierFromSession = (session?.kycTier ?? CURRENT_TIER) as number;
  const dailyPct = Math.min((DAILY_USED / DAILY_LIMIT) * 100, 100);

  const handleCopy = () => { void navigator.clipboard.writeText(displayTag).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSignOut = () => { clearSession(); onSignOut?.(); };

  return (
    <div className="pb-24 pt-6 min-h-dvh" style={{ background: BG }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00A86B, transparent 70%)' }} />
      </div>

      <div className="relative z-10">
        {/* Profile card */}
        <div className="mx-5 mb-5">
          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d2a1a, #1a3a2a, #0d2a1a)', border: '1px solid rgba(0,168,107,0.25)', boxShadow: '0 12px 32px rgba(0,168,107,0.20)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 80% 0%, #00A86B, transparent 60%)' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white border-2 relative" style={{ background: 'rgba(0,168,107,0.30)', borderColor: 'rgba(0,168,107,0.50)' }}>
                {displayInitials}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#00A86B', border: '2px solid #080f1a' }}>
                  <Check size={10} color="white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="display text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{displayName}</h2>
                <p className="text-sm mt-0.5" style={{ color: '#00A86B' }}>{displayTag}</p>
                <p className="text-xs mt-0.5 text-white/50">{displayPhone}</p>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-sm font-semibold text-white">{displayTag}</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy CashTag'}
              </button>
            </div>
          </div>
        </div>

        {/* Tier card */}
        <div className="mx-5 mb-5">
          <button onClick={onOpenTier} className="w-full rounded-2xl overflow-hidden transition-all active:scale-[0.98]" style={{ ...darkCard, boxShadow: `0 4px 16px rgba(0,168,107,0.15)` }}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm" style={{ background: `linear-gradient(135deg, #007A4D, ${TIER_COLOR})`, boxShadow: `0 4px 12px ${TIER_COLOR}40` }}>
                T{CURRENT_TIER}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">Tier {tierFromSession} — {tierFromSession >= 2 ? 'Verified' : 'Starter'}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: TIER_COLOR }}>Active</span>
                </div>
                <p className="text-xs mt-0.5 text-white/50">Daily limit: {formatNaira(DAILY_LIMIT)}</p>
              </div>
              <ArrowUpRight size={16} style={{ color: 'rgba(255,255,255,0.40)' }} />
            </div>
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/50">Today's usage</span>
                <span className="text-xs font-semibold tabular text-white/80">{formatNaira(DAILY_USED)} <span className="text-white/40">/ {formatNaira(DAILY_LIMIT)}</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <motion.div className="h-full rounded-full" style={{ background: TIER_COLOR }} initial={{ width: 0 }} animate={{ width: `${dailyPct}%` }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
              </div>
            </div>
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <TrendingUp size={14} style={{ color: '#A78BFA' }} />
              <p className="text-xs font-semibold flex-1 text-left" style={{ color: '#A78BFA' }}>Upgrade to Tier 3 for unlimited transfers</p>
              <ChevronRight size={13} style={{ color: '#A78BFA' }} />
            </div>
          </button>
        </div>

        {/* Menu sections */}
        {menuSections.map(section => (
          <div key={section.title} className="px-5 mb-4">
            <p className="text-xs font-semibold uppercase mb-2 text-white/30" style={{ letterSpacing: '0.08em' }}>{section.title}</p>
            <div className="rounded-2xl overflow-hidden" style={darkCard}>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:bg-white/5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.color + '20' }}>
                        <Icon size={18} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-xs mt-0.5 text-white/40">{item.sub}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white" style={{ background: '#F59E0B' }}>{item.badge}</span>}
                        <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.30)' }} />
                      </div>
                    </button>
                    {i < section.items.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <div className="px-5">
          <button onClick={handleSignOut} className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ color: '#FC8181', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <p className="text-center text-xs mt-5 text-white/20">Cashland v1.0 · Arc Mainnet</p>
      </div>
    </div>
  );
}
