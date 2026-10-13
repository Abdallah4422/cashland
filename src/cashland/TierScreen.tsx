import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Shield, ShieldCheck, CheckCircle2,
  ChevronRight, ArrowUpRight, Lock, User,
  FileText, Fingerprint, Building2, Star, Info,
} from 'lucide-react';
import { glass, formatNaira } from './design';

interface Props { onClose: () => void; }

// ── Tier definitions ──────────────────────────────────────────
const TIERS = [
  {
    id: 1,
    name: 'Tier 1',
    label: 'Starter',
    color: '#F59E0B',
    bg: '#FEF3C7',
    darkColor: '#D97706',
    dailyLimit: 50000,
    singleLimit: 20000,
    monthlyLimit: 200000,
    description: 'Basic account with phone verification.',
    requirements: ['Phone number verified', 'Account created'],
    completed: true,
  },
  {
    id: 2,
    name: 'Tier 2',
    label: 'Verified',
    color: '#00A86B',
    bg: '#E6F7F1',
    darkColor: '#007A4D',
    dailyLimit: 500000,
    singleLimit: 200000,
    monthlyLimit: 2000000,
    description: 'Full identity verification unlocks higher limits.',
    requirements: ['BVN or NIN verified', 'Full name confirmed', 'Date of birth'],
    completed: true,
  },
  {
    id: 3,
    name: 'Tier 3',
    label: 'Premium',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    darkColor: '#6D28D9',
    dailyLimit: Infinity,
    singleLimit: Infinity,
    monthlyLimit: Infinity,
    description: 'Unlimited transactions with full document verification.',
    requirements: ['Government-issued ID', 'Proof of address', 'Face verification', 'Enhanced due diligence'],
    completed: false,
  },
];

const CURRENT_TIER = 2; // Musa is on Tier 2

// ── Upgrade steps for Tier 3 ──────────────────────────────────
const UPGRADE_STEPS = [
  { icon: FileText, label: 'Government-issued ID', sub: 'NIN slip, voter card, or international passport', done: false },
  { icon: Building2, label: 'Proof of address', sub: 'Utility bill or bank statement (last 3 months)', done: false },
  { icon: Fingerprint, label: 'Face verification', sub: 'Quick selfie to match your ID photo', done: false },
  { icon: User, label: 'Enhanced due diligence', sub: 'Short review by Cashland compliance team', done: false },
];

// ── Usage data (prototype) ─────────────────────────────────────
const USAGE = {
  dailyUsed: 127500,
  dailyLimit: 500000,
  monthlyUsed: 890000,
  monthlyLimit: 2000000,
  singleLimit: 200000,
};

type View = 'main' | 'upgrade';

function TierBadge({ tier, size = 'md' }: { tier: typeof TIERS[0]; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div
      className={`${sizes[size]} rounded-2xl flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: tier.color, color: 'white', boxShadow: `0 4px 12px ${tier.color}40` }}
    >
      T{tier.id}
    </div>
  );
}

function UsageBar({ used, limit, color }: { used: number; limit: number; color: string }) {
  const pct = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const warning = pct > 80;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: warning ? '#F59E0B' : color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────
function MainView({ onUpgrade }: { onUpgrade: () => void }) {
  const currentTier = TIERS.find(t => t.id === CURRENT_TIER)!;
  const nextTier = TIERS.find(t => t.id === CURRENT_TIER + 1);

  return (
    <div className="pb-24">
      {/* Current tier hero */}
      <div className="px-5 mb-5">
        <motion.div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${currentTier.darkColor}, ${currentTier.color})`, boxShadow: `0 12px 32px ${currentTier.color}40` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* bg circles */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Current tier</p>
                <h2 className="display text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{currentTier.name}</h2>
                <p className="text-white/80 text-sm font-medium">{currentTier.label}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
                <ShieldCheck size={24} className="text-white" />
              </div>
            </div>

            <p className="text-white/75 text-sm mb-4">{currentTier.description}</p>

            {/* Requirements met */}
            <div className="flex flex-wrap gap-2">
              {currentTier.requirements.map(r => (
                <div key={r} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <CheckCircle2 size={11} className="text-white" />
                  <span className="text-xs text-white font-medium">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Usage this period */}
      <div className="px-5 mb-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Today's usage</h3>
        <div className="rounded-2xl p-4 space-y-4" style={glass.card}>
          {/* Daily */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>Daily limit</span>
              <span className="text-xs font-semibold tabular" style={{ color: 'var(--ink)' }}>
                {formatNaira(USAGE.dailyUsed)} <span style={{ color: 'var(--muted)' }}>of {formatNaira(USAGE.dailyLimit)}</span>
              </span>
            </div>
            <UsageBar used={USAGE.dailyUsed} limit={USAGE.dailyLimit} color={currentTier.color} />
          </div>
          <div className="h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />
          {/* Monthly */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>Monthly limit</span>
              <span className="text-xs font-semibold tabular" style={{ color: 'var(--ink)' }}>
                {formatNaira(USAGE.monthlyUsed)} <span style={{ color: 'var(--muted)' }}>of {formatNaira(USAGE.monthlyLimit)}</span>
              </span>
            </div>
            <UsageBar used={USAGE.monthlyUsed} limit={USAGE.monthlyLimit} color={currentTier.color} />
          </div>
          <div className="h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />
          {/* Single txn */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>Single transaction</span>
            <span className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{formatNaira(USAGE.singleLimit)}</span>
          </div>
        </div>
      </div>

      {/* All tiers comparison */}
      <div className="px-5 mb-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>All tiers</h3>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {TIERS.map((tier, i) => {
            const isActive = tier.id === CURRENT_TIER;
            const isLocked = tier.id > CURRENT_TIER;
            return (
              <div key={tier.id}>
                <div
                  className="flex items-center gap-3 px-4 py-4"
                  style={isActive ? { background: `${tier.color}10` } : {}}
                >
                  <TierBadge tier={tier} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{tier.name}</span>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ background: tier.bg, color: tier.darkColor }}>{tier.label}</span>
                      {isActive && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: tier.color }}>Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>Daily: {tier.dailyLimit === Infinity ? 'Unlimited' : `₦${(tier.dailyLimit / 1000).toFixed(0)}k`}</span>
                      <span>·</span>
                      <span>Monthly: {tier.monthlyLimit === Infinity ? 'Unlimited' : `₦${(tier.monthlyLimit / 1000000).toFixed(1)}M`}</span>
                    </div>
                  </div>
                  <div>
                    {isLocked
                      ? <Lock size={16} style={{ color: 'var(--muted)' }} />
                      : <CheckCircle2 size={16} style={{ color: tier.color }} />
                    }
                  </div>
                </div>
                {i < TIERS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* CBN info */}
      <div className="px-5 mb-5">
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#1D4ED8' }}>
            Transaction limits are set in line with <span className="font-semibold">CBN regulations</span> to protect your account and comply with Nigerian financial laws.
          </p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {nextTier && (
        <div className="px-5">
          <button
            onClick={onUpgrade}
            className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${nextTier.darkColor}15, ${nextTier.color}10)`, border: `1px solid ${nextTier.color}30` }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: nextTier.bg }}>
              <Star size={22} style={{ color: nextTier.darkColor }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Upgrade to {nextTier.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Unlock unlimited daily transfers</p>
            </div>
            <ArrowUpRight size={18} style={{ color: nextTier.color }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Upgrade flow view ─────────────────────────────────────────
function UpgradeView({ onBack: _onBack }: { onBack: () => void }) {
  const nextTier = TIERS.find(t => t.id === CURRENT_TIER + 1)!;
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="pb-24">
      {/* Header banner */}
      <div className="px-5 mb-5">
        <motion.div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${nextTier.darkColor}, ${nextTier.color})` }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Upgrading to</p>
            <h2 className="display text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{nextTier.name} — {nextTier.label}</h2>
            <p className="text-white/80 text-sm">{nextTier.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Daily limit', value: nextTier.dailyLimit === Infinity ? 'Unlimited' : `₦${(nextTier.dailyLimit / 1000).toFixed(0)}k` },
                { label: 'Monthly', value: nextTier.monthlyLimit === Infinity ? 'Unlimited' : `₦${(nextTier.monthlyLimit / 1000000).toFixed(0)}M` },
                { label: 'Per transfer', value: nextTier.singleLimit === Infinity ? 'No cap' : `₦${(nextTier.singleLimit / 1000).toFixed(0)}k` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <p className="text-white font-bold text-sm">{value}</p>
                  <p className="text-white/60 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="px-5 mb-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>What you'll need</h3>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {UPGRADE_STEPS.map((step, i) => {
            const Icon = step.icon;
            const expanded = expandedStep === i;
            return (
              <div key={step.label}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-4 transition-all active:bg-black/5"
                  onClick={() => setExpandedStep(expanded ? null : i)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.done ? '#E6F7F1' : '#F3F4F6' }}>
                    <Icon size={18} style={{ color: step.done ? '#00A86B' : '#6B7280' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{step.label}</p>
                      {step.done && <CheckCircle2 size={14} style={{ color: '#00A86B' }} />}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{ color: 'var(--muted)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  />
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <p className="text-xs leading-relaxed pl-13" style={{ color: 'var(--muted)', paddingLeft: '3.25rem' }}>
                          {step.sub}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {i < UPGRADE_STEPS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 mb-5">
        <div className="rounded-2xl p-4" style={glass.card}>
          <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Process overview</p>
          {[
            { step: '1', label: 'Submit documents', time: '5 minutes', icon: FileText },
            { step: '2', label: 'Cashland review', time: '1–2 business days', icon: ShieldCheck },
            { step: '3', label: 'Tier 3 unlocked', time: 'Instant notification', icon: Star },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: nextTier.color }}>
                    {item.step}
                  </div>
                  {i < 2 && <div className="w-px flex-1 my-1" style={{ background: `${nextTier.color}30`, minHeight: 20 }} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: nextTier.color }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}</p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5">
        <button
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${nextTier.darkColor}, ${nextTier.color})`, boxShadow: `0 8px 24px ${nextTier.color}40` }}
        >
          Start Verification
        </button>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)' }}>
          Your documents are encrypted and reviewed only by Cashland compliance.
        </p>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────
export default function TierScreen({ onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const currentTier = TIERS.find(t => t.id === CURRENT_TIER)!;

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 50%, #F4FAF7 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4" style={{ background: view === 'upgrade' ? `linear-gradient(135deg, ${TIERS[2].darkColor}15, ${TIERS[2].color}10)` : undefined }}>
        <button
          onClick={view === 'upgrade' ? () => setView('main') : onClose}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={glass.card}
        >
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <div className="flex-1">
          <h1 className="display font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {view === 'upgrade' ? 'Upgrade Account' : 'Account Limits'}
          </h1>
          {view === 'main' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ background: currentTier.color }} />
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{currentTier.name} — {currentTier.label}</span>
            </div>
          )}
        </div>
        {view === 'main' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: currentTier.bg }}>
            <Shield size={13} style={{ color: currentTier.darkColor }} />
            <span className="text-xs font-bold" style={{ color: currentTier.darkColor }}>{currentTier.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'main' && (
            <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <MainView onUpgrade={() => setView('upgrade')} />
            </motion.div>
          )}
          {view === 'upgrade' && (
            <motion.div key="upgrade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <UpgradeView onBack={() => setView('main')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
