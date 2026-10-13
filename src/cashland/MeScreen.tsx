import { ChevronRight, Shield, Bell, HelpCircle, LogOut, Copy, Check, Star, CreditCard, Lock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { glass, brandGradient, formatNaira } from './design';
import { loadSession, clearSession } from './useUserSession';

import type { ApiUser } from './api';
interface Props { onOpenTier: () => void; onSignOut?: () => void; user?: ApiUser; kycTier?: 1 | 2 | 3; }

const CURRENT_TIER = 2;
const TIER_COLOR = '#00A86B';
const TIER_LABEL = 'Verified';
const DAILY_USED = 127500;
const DAILY_LIMIT = 500000;

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: CreditCard, label: 'Bank Accounts', sub: 'Manage linked banks' },
      { icon: Star, label: 'Cashland Pro', sub: 'Unlock premium features', badge: 'Pro' },
      { icon: Lock, label: 'Security', sub: 'PIN, biometrics, devices' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', sub: 'Payment alerts & updates' },
      { icon: Shield, label: 'Privacy', sub: 'Data and permissions' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs and contact' },
    ],
  },
];

export default function MeScreen({ onOpenTier, onSignOut, user: backendUser, kycTier: _kycTier }: Props) {
  const [copied, setCopied] = useState(false);
  const session = loadSession();
  const displayName = backendUser
    ? `${backendUser.firstName} ${backendUser.lastName}`
    : session ? `${session.firstName} ${session.lastName}` : 'Musa Ibrahim';
  const displayTag = session?.tag ?? '@musa';
  const displayInitials = session
    ? (session.firstName[0] ?? 'M') + (session.lastName[0] ?? 'I')
    : 'MI';
  const displayPhone = session?.phone
    ? session.phone.slice(0, 3) + ' *** ' + session.phone.slice(-4)
    : '0803 *** 4567';
  const tierFromSession = (session?.kycTier ?? CURRENT_TIER) as number;

  const handleCopy = () => {
    void navigator.clipboard.writeText(displayTag).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = () => {
    clearSession();
    onSignOut?.();
  };

  const dailyPct = Math.min((DAILY_USED / DAILY_LIMIT) * 100, 100);

  return (
    <div className="pb-24 pt-6">
      {/* Profile card */}
      <div className="mx-5 mb-5">
        <div className="rounded-3xl p-5" style={{ background: brandGradient, boxShadow: '0 12px 32px rgba(0,168,107,0.30)' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white border-2 border-white/30"
              style={{ background: 'rgba(255,255,255,0.20)' }}
            >
              {displayInitials}
            </div>
            <div className="flex-1">
              <h2 className="display text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{displayName}</h2>
              <p className="text-white/80 text-sm">{displayTag}</p>
              <p className="text-white/60 text-xs mt-0.5">{displayPhone}</p>
            </div>
          </div>

          <div
            className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-sm font-semibold text-white">{displayTag}</span>
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-white/80">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy CashTag'}
            </button>
          </div>
        </div>
      </div>

      {/* Tier card — interactive, replaces static KYC badge */}
      <div className="mx-5 mb-5">
        <button
          onClick={onOpenTier}
          className="w-full rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
          style={{ ...glass.card, boxShadow: `0 4px 16px ${TIER_COLOR}20` }}
        >
          {/* Top row */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
              style={{ background: `linear-gradient(135deg, #007A4D, ${TIER_COLOR})`, boxShadow: `0 4px 12px ${TIER_COLOR}40` }}
            >
              T{CURRENT_TIER}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Tier {tierFromSession} — {tierFromSession >= 2 ? TIER_LABEL : 'Starter'}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: TIER_COLOR }}>Active</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Daily limit: {formatNaira(DAILY_LIMIT)}</p>
            </div>
            <ArrowUpRight size={16} style={{ color: 'var(--muted)' }} />
          </div>

          {/* Usage bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Today's usage</span>
              <span className="text-xs font-semibold tabular" style={{ color: 'var(--ink)' }}>
                {formatNaira(DAILY_USED)} <span style={{ color: 'var(--muted)' }}>/ {formatNaira(DAILY_LIMIT)}</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: TIER_COLOR }}
                initial={{ width: 0 }}
                animate={{ width: `${dailyPct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>

          {/* Upgrade nudge */}
          <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: '#EDE9FE' }}>
            <TrendingUp size={14} style={{ color: '#8B5CF6' }} />
            <p className="text-xs font-semibold flex-1 text-left" style={{ color: '#6D28D9' }}>
              Upgrade to Tier 3 for unlimited transfers
            </p>
            <ChevronRight size={13} style={{ color: '#8B5CF6' }} />
          </div>
        </button>
      </div>

      {/* Menu sections */}
      {menuSections.map(section => (
        <div key={section.title} className="px-5 mb-4">
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
            {section.title}
          </p>
          <div className="rounded-2xl overflow-hidden" style={glass.card}>
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <button className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:bg-black/5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                      <Icon size={18} style={{ color: 'var(--brand)' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.sub}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                  {i < section.items.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="px-5">
        <button onClick={handleSignOut} className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ color: '#E53E3E', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <p className="text-center text-xs mt-5" style={{ color: 'var(--muted)' }}>Cashland v1.0 · Built on Arc Testnet</p>
    </div>
  );
}
