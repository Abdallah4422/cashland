// DisputeScreen — transaction detail + dispute / flag flow
// CBN and FCCPC require a dispute resolution mechanism accessible from the app.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, AlertCircle, Clock, Copy, Check,
  ArrowUpRight, ArrowDownLeft, ExternalLink, MessageSquare,
  ShieldAlert, HelpCircle, ChevronRight, Loader2, Phone
} from 'lucide-react';
import { glass, brandGradient, formatNaira } from './design';

export interface DisputeTransaction {
  id: string;
  name: string;
  tag?: string;
  type: 'sent' | 'received' | 'merchant';
  amount: number;
  status: 'onchain' | 'success' | 'pending' | 'failed';
  time: string;
  initials: string;
  color: string;
  note?: string;
  reference?: string;
  txHash?: string;
}

interface Props {
  transaction: DisputeTransaction;
  onClose: () => void;
}

type DisputeStep = 'detail' | 'reason' | 'description' | 'submitted';

const DISPUTE_REASONS = [
  { id: 'not_received', label: 'Transaction not received', icon: AlertCircle, desc: 'I was debited but the recipient did not receive the money.' },
  { id: 'wrong_amount', label: 'Wrong amount charged', icon: ShieldAlert, desc: 'The amount deducted was different from what I authorized.' },
  { id: 'duplicate', label: 'Duplicate transaction', icon: AlertCircle, desc: 'I was charged twice for the same payment.' },
  { id: 'unauthorised', label: 'Unauthorised transaction', icon: ShieldAlert, desc: 'I did not authorise this transaction.' },
  { id: 'merchant', label: 'Merchant dispute', icon: HelpCircle, desc: 'I paid but the merchant did not deliver goods or services.' },
  { id: 'other', label: 'Other issue', icon: MessageSquare, desc: 'Something else went wrong. I will describe it below.' },
];


function TxAvatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}DD, ${color})`, fontSize: size * 0.32, boxShadow: `0 2px 8px ${color}40` }}
    >
      {initials}
    </div>
  );
}

const titleMap: Record<DisputeStep, string> = {
  detail: 'Transaction Details',
  reason: 'Report a Problem',
  description: 'Report a Problem',
  submitted: '',
};

export default function DisputeScreen({ transaction: tx, onClose }: Props) {
  const [step, setStep] = useState<DisputeStep>('detail');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [disputeRef] = useState(() => 'DSP-' + Math.random().toString(36).slice(2, 9).toUpperCase());

  const handleCopy = (value: string, key: string) => {
    void navigator.clipboard.writeText(value).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('submitted');
    }, 2000);
  };

  const statusColor = tx.status === 'onchain' || tx.status === 'success' ? 'var(--brand)' :
    tx.status === 'pending' ? '#D97706' : '#E53E3E';
  const statusLabel = tx.status === 'onchain' ? 'Verified onchain' :
    tx.status === 'success' ? 'Successful' :
    tx.status === 'pending' ? 'Pending' : 'Failed';

  const reasonLabel = DISPUTE_REASONS.find(r => r.id === selectedReason)?.label ?? '';

  const detailRows = [
    { label: 'Date & Time', value: tx.time },
    { label: tx.type === 'sent' ? 'Sent to' : 'Received from', value: tx.name },
    ...(tx.tag ? [{ label: 'CashTag', value: tx.tag, accent: true }] : []),
    { label: 'Reference', value: tx.reference ?? 'CL-92480283', copyKey: 'ref' },
    ...(tx.txHash ? [{ label: 'Transaction hash', value: tx.txHash.slice(0, 10) + '...' + tx.txHash.slice(-6), copyKey: 'hash', mono: true }] : []),
    ...(tx.note ? [{ label: 'Note', value: tx.note }] : []),
  ];

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 60%, #F4FAF7 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: 0, right: 0, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      {step !== 'submitted' && (
        <div className="relative z-10 px-5 pt-12 pb-4 flex items-center gap-3">
          <button
            onClick={() => step === 'detail' ? onClose() : setStep(step === 'description' ? 'reason' : 'detail')}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <h1 className="display text-lg font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {titleMap[step]}
          </h1>
        </div>
      )}

      <div className="relative z-10 flex-1 px-5 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="h-full flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {/* ── Detail ───────────────────────────────────── */}
            {step === 'detail' && (
              <div className="flex flex-col min-h-full">
                <div className="flex flex-col items-center py-8 mb-2">
                  <div className="relative mb-4">
                    <TxAvatar initials={tx.initials} color={tx.color} size={64} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                      style={{ background: tx.type === 'sent' ? '#FEF3C7' : '#E6F7F1' }}>
                      {tx.type === 'sent'
                        ? <ArrowUpRight size={13} style={{ color: '#D97706' }} />
                        : <ArrowDownLeft size={13} style={{ color: 'var(--brand)' }} />}
                    </div>
                  </div>
                  <p className="text-3xl font-bold tabular mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    {tx.amount > 0 ? '+' : ''}{formatNaira(tx.amount)}
                  </p>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--subtle)' }}>
                    {tx.type === 'sent' ? 'Sent to' : 'Received from'} {tx.name}
                  </p>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: tx.status === 'onchain' || tx.status === 'success' ? '#E6F7F1' : tx.status === 'pending' ? '#FEF3C7' : '#FEE2E2' }}>
                    {tx.status === 'onchain' || tx.status === 'success'
                      ? <CheckCircle2 size={13} style={{ color: statusColor }} />
                      : tx.status === 'pending'
                      ? <Clock size={13} style={{ color: statusColor }} />
                      : <AlertCircle size={13} style={{ color: statusColor }} />}
                    <span className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
                  {detailRows.map((row, i, arr) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-sm" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={'text-sm font-semibold text-right' + ('mono' in row && row.mono ? ' font-mono' : '')}
                            style={{ color: ('accent' in row && row.accent) ? 'var(--brand)' : 'var(--ink)', maxWidth: 180 }}
                          >
                            {row.value}
                          </span>
                          {'copyKey' in row && row.copyKey && (
                            <button onClick={() => handleCopy(row.value, row.copyKey)}>
                              {copied === row.copyKey
                                ? <Check size={13} style={{ color: 'var(--brand)' }} />
                                : <Copy size={13} style={{ color: 'var(--muted)' }} />}
                            </button>
                          )}
                        </div>
                      </div>
                      {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                    </div>
                  ))}
                </div>

                {tx.txHash && (
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl mb-4 text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    <ExternalLink size={15} />
                    View onchain proof
                  </button>
                )}

                <div className="mt-auto space-y-3">
                  <button
                    onClick={() => setStep('reason')}
                    className="w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: '#FEF2F2', color: '#E53E3E', border: '1px solid #FECACA' }}
                  >
                    <ShieldAlert size={18} />
                    Report a problem
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
                    Disputes are reviewed within 5 business days per CBN guidelines.
                  </p>
                </div>
              </div>
            )}

            {/* ── Reason ───────────────────────────────────── */}
            {step === 'reason' && (
              <div className="flex flex-col min-h-full">
                <div className="mb-5">
                  <h2 className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>What went wrong?</h2>
                  <p className="text-sm" style={{ color: 'var(--subtle)' }}>Select the issue that best describes your problem.</p>
                </div>

                <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
                  {DISPUTE_REASONS.map((reason, i) => {
                    const Icon = reason.icon;
                    const selected = selectedReason === reason.id;
                    return (
                      <div key={reason.id}>
                        <button
                          onClick={() => setSelectedReason(reason.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-black/5"
                          style={{ background: selected ? 'rgba(0,168,107,0.05)' : 'transparent' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: selected ? 'var(--brand-light)' : 'rgba(0,0,0,0.04)' }}>
                            <Icon size={17} style={{ color: selected ? 'var(--brand)' : 'var(--subtle)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{reason.label}</p>
                            <p className="text-xs mt-0.5 text-pretty" style={{ color: 'var(--subtle)' }}>{reason.desc}</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: selected ? 'var(--brand)' : 'rgba(0,0,0,0.15)', background: selected ? 'var(--brand)' : 'transparent' }}>
                            {selected && <Check size={11} style={{ color: 'white' }} />}
                          </div>
                        </button>
                        {i < DISPUTE_REASONS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <button
                    disabled={!selectedReason}
                    onClick={() => setStep('description')}
                    className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: brandGradient, boxShadow: selectedReason ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Description ──────────────────────────────── */}
            {step === 'description' && (
              <div className="flex flex-col min-h-full">
                <div className="mb-5">
                  <h2 className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Tell us more</h2>
                  <p className="text-sm" style={{ color: 'var(--subtle)' }}>Provide any additional details to help us resolve this faster.</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 self-start"
                  style={{ background: 'var(--brand-light)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--brand)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>{reasonLabel}</span>
                </div>

                <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={glass.card}>
                  <TxAvatar initials={tx.initials} color={tx.color} size={40} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{tx.name}</p>
                    <p className="text-xs" style={{ color: 'var(--subtle)' }}>{tx.time}</p>
                  </div>
                  <p className="text-sm font-bold tabular" style={{ color: tx.amount > 0 ? 'var(--brand)' : 'var(--ink)' }}>
                    {tx.amount > 0 ? '+' : ''}{formatNaira(tx.amount)}
                  </p>
                </div>

                <div className="rounded-2xl p-4 mb-4 flex-1" style={glass.card}>
                  <textarea
                    placeholder="Describe what happened (optional but recommended)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-transparent text-sm outline-none resize-none"
                    style={{ color: 'var(--ink)' }}
                  />
                  <p className="text-xs text-right mt-1" style={{ color: 'var(--muted)' }}>{description.length}/500</p>
                </div>

                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl mb-4"
                  style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <HelpCircle size={14} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs text-pretty" style={{ color: '#1D4ED8' }}>
                    Per CBN Consumer Protection Framework, all disputes are reviewed within 5 business days. You will receive a resolution via SMS and in-app notification.
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                  >
                    {submitting
                      ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                      : 'Submit Dispute'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Submitted ────────────────────────────────── */}
            {step === 'submitted' && (
              <div className="pt-16 flex flex-col min-h-full">
                <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
                  <motion.div
                    className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center"
                    style={{ background: '#EBF4FF', boxShadow: '0 12px 32px rgba(59,130,246,0.2)' }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  >
                    <ShieldAlert size={44} style={{ color: '#3B82F6' }} />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                      Dispute submitted
                    </h2>
                    <p className="text-sm text-pretty max-w-xs" style={{ color: 'var(--subtle)' }}>
                      We have received your report. Our team will investigate and respond within 5 business days.
                    </p>
                  </motion.div>

                  <motion.div className="w-full mt-6 rounded-2xl overflow-hidden" style={glass.card}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                    {[
                      { label: 'Dispute reference', value: disputeRef, copyKey: 'dref' },
                      { label: 'Transaction reference', value: tx.reference ?? 'CL-92480283', copyKey: 'txref' },
                      { label: 'Reason', value: reasonLabel },
                      { label: 'Status', badge: true, value: 'Under review' },
                      { label: 'Expected resolution', value: 'Within 5 business days' },
                    ].map((row, i, arr) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between px-4 py-3.5">
                          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                          <div className="flex items-center gap-2">
                            {row.badge
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: '#F59E0B' }}>Under review</span>
                              : <span className="text-xs font-semibold text-right" style={{ color: 'var(--ink)', maxWidth: 180 }}>{row.value}</span>
                            }
                            {'copyKey' in row && row.copyKey && (
                              <button onClick={() => handleCopy(row.value, row.copyKey)}>
                                {copied === row.copyKey
                                  ? <Check size={12} style={{ color: 'var(--brand)' }} />
                                  : <Copy size={12} style={{ color: 'var(--muted)' }} />}
                              </button>
                            )}
                          </div>
                        </div>
                        {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                      </div>
                    ))}
                  </motion.div>

                  <motion.div className="w-full mt-4 rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(0,168,107,0.07)', border: '1px solid rgba(0,168,107,0.15)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Phone size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Need urgent help?</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>Call Cashland Support: 0800-CASHLAND</p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--brand)' }} />
                  </motion.div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
