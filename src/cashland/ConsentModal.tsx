// ConsentModal — iGree-style consent gate
// Shown before any Open Banking data pull, Direct Debit setup, or recurring payment.
// Designed to be CBN/NDPA compliant and build user trust.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronRight, Check, X, Lock, Eye, RefreshCw,
  AlertCircle, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { glass, navyGradient, brandGradient } from './design';

export type ConsentScope =
  | 'account_info'       // Read account balance + basic info
  | 'transaction_history' // Read transaction history
  | 'payment_initiation'  // Initiate payments from account
  | 'direct_debit'        // Set up recurring debits
  | 'identity'            // Verify identity data

export interface ConsentRequest {
  /** What data/action is being consented to */
  scopes: ConsentScope[];
  /** Who is requesting (Cashland service name) */
  purpose: string;
  /** Plain English: why this is needed */
  purposeDescription: string;
  /** How long consent lasts */
  durationDays: number;
  /** The bank / institution being accessed */
  institution?: string;
  /** Recurring amount if direct debit */
  recurringAmount?: number;
  /** Recurring frequency if direct debit */
  recurringFrequency?: string;
}

interface Props {
  open: boolean;
  request: ConsentRequest;
  onApprove: () => void;
  onDecline: () => void;
}

const SCOPE_LABELS: Record<ConsentScope, { label: string; detail: string; icon: typeof Eye }> = {
  account_info: { label: 'Account information', detail: 'Read your account name, number, and current balance.', icon: Eye },
  transaction_history: { label: 'Transaction history', detail: 'Read your last 6 months of transactions to verify income.', icon: RefreshCw },
  payment_initiation: { label: 'Initiate payments', detail: 'Start payments from this account on your instruction.', icon: ChevronRight },
  direct_debit: { label: 'Recurring debits', detail: 'Debit this account on a schedule you set and can cancel any time.', icon: RefreshCw },
  identity: { label: 'Identity confirmation', detail: 'Confirm your name and account ownership.', icon: Shield },
};

function formatExpiry(durationDays: number): string {
  const ts = Date.now() + durationDays * 86_400_000;
  return new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConsentModal({ open, request, onApprove, onDecline }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allScopesChecked = request.scopes.every(s => checked[s]);

  const handleCheckScope = (scope: ConsentScope) => {
    const next = { ...checked, [scope]: !checked[scope] };
    setChecked(next);
    setAllChecked(request.scopes.every(s => next[s]));
  };

  const handleCheckAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    const newChecked: Record<string, boolean> = {};
    request.scopes.forEach(s => { newChecked[s] = next; });
    setChecked(newChecked);
  };

  const [expiryStr] = useState(() => formatExpiry(request.durationDays));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onDecline}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[61] max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          >
            <div className="rounded-t-[28px] overflow-hidden" style={{ ...glass.receipt, maxHeight: '90dvh', overflowY: 'auto' }}>
              {/* iGree-style header */}
              <div className="px-5 pt-6 pb-4" style={{ background: navyGradient }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                      <Shield size={17} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <p className="text-xs text-white/70 font-medium">Powered by</p>
                      <p className="text-sm font-bold text-white leading-none">Cashland Consent</p>
                    </div>
                  </div>
                  <button
                    onClick={onDecline}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.20)' }}
                  >
                    <X size={15} style={{ color: 'white' }} />
                  </button>
                </div>

                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <p className="text-sm font-bold text-white mb-0.5">{request.purpose}</p>
                  <p className="text-xs text-white/75 text-pretty">{request.purposeDescription}</p>
                  {request.institution && (
                    <p className="text-xs text-white/60 mt-1">Institution: {request.institution}</p>
                  )}
                </div>
              </div>

              <div className="px-5 pt-4 pb-6">
                {/* Direct debit summary */}
                {request.recurringAmount && request.recurringFrequency && (
                  <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
                    <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#92400E' }}>Recurring debit authorisation</p>
                      <p className="text-xs mt-0.5" style={{ color: '#78350F' }}>
                        ₦{request.recurringAmount.toLocaleString()} · {request.recurringFrequency}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scope list */}
                <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
                  Permissions requested
                </p>

                {/* Check all */}
                <button
                  onClick={handleCheckAll}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 transition-all active:scale-[0.99]"
                  style={{ background: allScopesChecked ? 'rgba(0,168,107,0.08)' : 'rgba(0,0,0,0.03)', border: `1px solid ${allScopesChecked ? 'rgba(0,168,107,0.25)' : 'rgba(0,0,0,0.07)'}` }}
                >
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: allScopesChecked ? 'var(--brand)' : 'rgba(0,0,0,0.20)', background: allScopesChecked ? 'var(--brand)' : 'transparent' }}>
                    {allScopesChecked && <Check size={12} style={{ color: 'white' }} />}
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--ink)' }}>
                    Approve all permissions
                  </span>
                </button>

                <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
                  {request.scopes.map((scope, i) => {
                    const info = SCOPE_LABELS[scope];
                    const Icon = info.icon;
                    const isChecked = !!checked[scope];
                    return (
                      <div key={scope}>
                        <button
                          onClick={() => handleCheckScope(scope)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-black/5"
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: isChecked ? 'var(--brand-light)' : 'rgba(0,0,0,0.04)' }}>
                            <Icon size={16} style={{ color: isChecked ? 'var(--brand)' : 'var(--subtle)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{info.label}</p>
                            <p className="text-xs mt-0.5 text-pretty" style={{ color: 'var(--subtle)' }}>{info.detail}</p>
                          </div>
                          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: isChecked ? 'var(--brand)' : 'rgba(0,0,0,0.20)', background: isChecked ? 'var(--brand)' : 'transparent' }}>
                            {isChecked && <Check size={11} style={{ color: 'white' }} />}
                          </div>
                        </button>
                        {i < request.scopes.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Duration + revoke */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock size={13} style={{ color: 'var(--brand)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>Consent duration</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>{request.durationDays} days</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                    This consent expires on <span className="font-semibold" style={{ color: 'var(--ink)' }}>{expiryStr}</span>. You can revoke it at any time in Me → Privacy → Consents.
                  </p>
                </div>

                {/* Expandable legal */}
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="w-full flex items-center justify-between py-2 mb-2"
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--subtle)' }}>Data handling & your rights</span>
                  {expanded ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                        {[
                          'Your data is processed under the Nigeria Data Protection Act (NDPA) 2023.',
                          'Cashland only uses your data for the purpose stated above.',
                          'Your personal data is encrypted in transit and at rest.',
                          'You can withdraw this consent at any time in Me → Privacy → Consents.',
                          'Revoking consent will not affect transactions already completed.',
                          'For questions, contact: privacy@cashland.ng',
                        ].map((text, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#3B82F6' }} />
                            <p className="text-xs" style={{ color: '#1E40AF' }}>{text}</p>
                          </div>
                        ))}
                        <button className="flex items-center gap-1.5 text-xs font-semibold mt-1" style={{ color: '#2563EB' }}>
                          <ExternalLink size={11} />
                          Read full privacy policy
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="space-y-3 mt-2">
                  <button
                    disabled={!allScopesChecked}
                    onClick={onApprove}
                    className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: brandGradient, boxShadow: allScopesChecked ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
                  >
                    <Shield size={18} />
                    Approve and continue
                  </button>
                  <button
                    onClick={onDecline}
                    className="w-full py-3 text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ color: 'var(--subtle)' }}
                  >
                    Decline — I do not consent
                  </button>
                </div>

                <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)' }}>
                  Secured by Cashland · NDPC registered · CBN regulated
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
