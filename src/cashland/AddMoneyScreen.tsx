import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Building2, CreditCard, ArrowDownToLine,
  Copy, Check, CheckCircle2, Loader2, Info, RefreshCw,
  Wallet, ShieldCheck, Clock, Receipt, ExternalLink,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { navyGradient, brandGradient, formatNaira } from './design';
import { useUsdcBalance, NGN_PER_USDC } from './useUsdcBalance';
import { pushDepositNotification } from './useNotifications';

interface Props { onClose: () => void; onDeposited?: () => void; }

type BankStep = 'amount' | 'account' | 'waiting' | 'receipt';
type CardStep = 'form' | 'otp' | 'processing' | 'receipt';
type UsdcStep = 'address' | 'detecting' | 'receipt';
type Screen = 'methods' | 'bank' | 'card' | 'usdc';

const CASHLAND_FEE_RATE = 0;          // 0% — free for now
const USDC_RATE = NGN_PER_USDC;       // ₦1,559 per USDC

function ngnToUsdc(ngn: number) { return ngn / USDC_RATE; }

// ── Shared: Back header ───────────────────────────────────────
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0">
      <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <ChevronLeft size={20} style={{ color: 'white' }} />
      </button>
      <h1 className="display text-lg font-bold" style={{ color: 'white', letterSpacing: '-0.02em' }}>{title}</h1>
    </div>
  );
}

// ── Shared: Onramp receipt ────────────────────────────────────
function OnrampReceipt({
  method, ngnAmount, txRef, confirmedAt, onDone,
}: { method: string; ngnAmount: number; txRef: string; confirmedAt: Date; onDone: () => void }) {
  const usdc = ngnToUsdc(ngnAmount);
  const now = confirmedAt;

  return (
    <div className="flex flex-col min-h-full px-5 pb-8">
      {/* Header strip */}
      <motion.div
        className="rounded-3xl overflow-hidden mb-5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-5 py-6 text-center" style={{ background: navyGradient }}>
          <motion.div
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.20)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          >
            <CheckCircle2 size={36} className="text-white" strokeWidth={1.8} />
          </motion.div>
          <p className="text-white/80 text-sm font-medium mb-1">Money added to Cashland</p>
          <div className="display text-4xl font-bold text-white tabular" style={{ letterSpacing: '-0.03em' }}>
            {formatNaira(ngnAmount)}
          </div>
        </div>

        {/* Receipt body */}
        <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {[
            { label: 'USDC credited', value: `${usdc.toFixed(4)} USDC`, accent: true },
            { label: 'Exchange rate', value: `₦${USDC_RATE.toLocaleString()} / USDC` },
            { label: 'Cashland fee', value: CASHLAND_FEE_RATE === 0 ? 'Free' : `${(CASHLAND_FEE_RATE * 100).toFixed(1)}%`, success: true },
            { label: 'Method', value: method },
            { label: 'Date', value: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Time', value: now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) },
            { label: 'Reference', value: txRef, mono: true },
            { label: 'Status', value: 'Confirmed', success: true },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <span
                  className={`text-sm font-semibold ${row.mono ? 'mono text-xs' : ''}`}
                  style={{ color: row.success ? 'var(--brand)' : row.accent ? 'var(--brand)' : 'var(--ink)' }}
                >
                  {row.value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div className="space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <button
          onClick={onDone}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}

// ── Bank Transfer ─────────────────────────────────────────────
function BankTransferFlow({ onBack, onSuccess }: { onBack: () => void; onSuccess: (amount: number) => void }) {
  const [step, setStep] = useState<BankStep>('amount');
  const [ngnAmount, setNgnAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [txRef] = useState(() => 'CL' + Math.random().toString(36).slice(2, 10).toUpperCase());
  const [confirmedAt] = useState(() => new Date());
  const chips = [5000, 10000, 20000, 50000, 100000];

  const parsedAmount = parseFloat(ngnAmount) || 0;
  const usdc = ngnToUsdc(parsedAmount);

  const virtualAccount = {
    bank: 'Guaranty Trust Bank',
    accountName: 'Cashland / Musa Ibrahim',
    accountNumber: '0093847261',
    sortCode: '058',
    reference: txRef,
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Countdown and auto-detect
  useEffect(() => {
    if (step !== 'waiting') return;
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    const timeout = setTimeout(() => {
      setStep('receipt');
      onSuccess(parsedAmount);
      pushDepositNotification(formatNaira(parsedAmount), 'Bank Transfer');
    }, 8000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (step === 'receipt') {
    return <OnrampReceipt method="Bank Transfer" ngnAmount={parsedAmount} txRef={txRef} confirmedAt={confirmedAt} onDone={onBack} />;
  }

  if (step === 'waiting') {
    return (
      <div className="flex flex-col min-h-full px-5 pb-8">
        {/* Timer ring */}
        <div className="flex flex-col items-center py-8">
          <div className="relative w-24 h-24 mb-5">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" stroke="rgba(0,168,107,0.15)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="48" cy="48" r="40"
                stroke="#00A86B" strokeWidth="6" fill="none"
                strokeDasharray={251.3}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 251.3 }}
                transition={{ duration: 60, ease: 'linear' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="display text-xl font-bold tabular" style={{ color: 'var(--brand)' }}>{countdown}s</p>
              </div>
            </div>
          </div>
          <h2 className="display text-xl font-bold mb-1" style={{ color: 'white', letterSpacing: '-0.02em' }}>
            Waiting for transfer
          </h2>
          <p className="text-sm text-center text-pretty mb-2" style={{ color: 'rgba(255,255,255,0.60)' }}>
            We're watching for your transfer of{' '}
            <span className="font-semibold" style={{ color: 'var(--brand)' }}>{formatNaira(parsedAmount)}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={13} style={{ color: 'var(--brand)' }} className="animate-spin" />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>Checking every second...</span>
          </div>
        </div>

        {/* Account reminder */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>Transfer to</p>
          </div>
          {[
            { label: 'Account', value: virtualAccount.accountNumber, copy: true },
            { label: 'Bank', value: virtualAccount.bank },
            { label: 'Reference', value: virtualAccount.reference, copy: true },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold mono" style={{ color: 'white' }}>{row.value}</span>
                  {row.copy && (
                    <button onClick={() => handleCopy(row.label, row.value)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,107,0.15)' }}>
                      {copiedField === row.label ? <Check size={11} style={{ color: 'var(--brand)' }} /> : <Copy size={11} style={{ color: 'var(--brand)' }} />}
                    </button>
                  )}
                </div>
              </div>
              {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-6" style={{ background: 'rgba(255,182,0,0.10)' }}>
          <Info size={13} style={{ color: '#B07800', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: '#7A5200' }}>
            Include the reference exactly as shown above. This links your transfer to your Cashland account.
          </p>
        </div>

        <button onClick={() => setStep('amount')} className="w-full py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Cancel — go back
        </button>
      </div>
    );
  }

  if (step === 'account') {
    // Show account + conversion summary then "I've sent it"
    return (
      <div className="flex flex-col min-h-full px-5 pb-8">
        {/* Conversion summary */}
        <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: navyGradient }}>
          <p className="text-white/70 text-xs mb-1">You're adding</p>
          <p className="display text-3xl font-bold text-white tabular" style={{ letterSpacing: '-0.03em' }}>
            {formatNaira(parsedAmount)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <p className="text-white/70 text-xs px-2">= {usdc.toFixed(4)} USDC at ₦{USDC_RATE.toLocaleString()}/USDC</p>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>

        <p className="text-sm font-semibold mb-3" style={{ color: 'white' }}>Transfer to this account</p>
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
          {[
            { label: 'Bank', value: virtualAccount.bank },
            { label: 'Account name', value: virtualAccount.accountName },
            { label: 'Account number', value: virtualAccount.accountNumber, copy: true },
            { label: 'Sort code', value: virtualAccount.sortCode },
            { label: 'Reference', value: virtualAccount.reference, copy: true },
            { label: 'Amount', value: formatNaira(parsedAmount), bold: true },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold mono`} style={{ color: row.bold ? 'var(--brand)' : 'var(--ink)' }}>
                    {row.value}
                  </span>
                  {row.copy && (
                    <button onClick={() => handleCopy(row.label, row.value)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,107,0.15)' }}>
                      {copiedField === row.label ? <Check size={11} style={{ color: 'var(--brand)' }} /> : <Copy size={11} style={{ color: 'var(--brand)' }} />}
                    </button>
                  )}
                </div>
              </div>
              {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <Clock size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Money usually arrives within 60 seconds of your transfer clearing.
          </p>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => setStep('waiting')}
            className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
          >
            I've made the transfer
          </button>
        </div>
      </div>
    );
  }

  // Amount step
  return (
    <div className="flex flex-col min-h-full px-5 pb-8">
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Transfer from any Nigerian bank account. We'll credit your Cashland balance instantly.
      </p>

      {/* Amount input */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>Amount to add</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="display text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>₦</span>
          <input
            type="number" inputMode="decimal" placeholder="0" autoFocus
            value={ngnAmount} onChange={e => setNgnAmount(e.target.value)}
            className="display flex-1 text-4xl font-bold bg-transparent outline-none tabular"
            style={{ color: 'white', letterSpacing: '-0.03em' }}
          />
        </div>
        {parsedAmount > 0 && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
            = {usdc.toFixed(4)} USDC at ₦{USDC_RATE.toLocaleString()} / USDC
          </p>
        )}
      </div>

      {/* Quick chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {chips.map(v => (
          <button key={v} onClick={() => setNgnAmount(String(v))}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
            style={{
              background: ngnAmount === String(v) ? 'var(--brand)' : 'rgba(255,255,255,0.75)',
              color: ngnAmount === String(v) ? 'white' : 'var(--ink)',
              border: `1.5px solid ${ngnAmount === String(v) ? '#00A86B' : 'rgba(255,255,255,0.12)'}`,
            }}>
            {formatNaira(v)}
          </button>
        ))}
      </div>

      {/* Fee breakdown */}
      {parsedAmount > 0 && (
        <motion.div
          className="rounded-2xl overflow-hidden mb-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: 'You send', value: formatNaira(parsedAmount) },
            { label: 'Cashland fee', value: 'Free', success: true },
            { label: 'USDC you receive', value: `${usdc.toFixed(4)} USDC`, bold: true },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <span className="text-sm font-semibold" style={{ color: row.success ? 'var(--brand)' : row.bold ? 'var(--brand)' : 'var(--ink)' }}>
                  {row.value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </motion.div>
      )}

      <div className="mt-auto">
        <button
          disabled={parsedAmount <= 0}
          onClick={() => setStep('account')}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: brandGradient, boxShadow: parsedAmount > 0 ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          {parsedAmount > 0 ? `Continue — Add ${formatNaira(parsedAmount)}` : 'Enter amount'}
        </button>
      </div>
    </div>
  );
}

// ── Card Top-up ───────────────────────────────────────────────
function detectCardType(number: string): { label: string; color: string } {
  const n = number.replace(/\s/g, '');
  if (n.startsWith('4')) return { label: 'Visa', color: '#1A1F71' };
  if (n.startsWith('5') || n.startsWith('2')) return { label: 'Mastercard', color: '#EB001B' };
  if (n.startsWith('6')) return { label: 'Verve', color: '#00A86B' };
  return { label: '', color: 'rgba(255,255,255,0.50)' };
}

function CardTopUpFlow({ onBack, onSuccess }: { onBack: () => void; onSuccess: (amount: number) => void }) {
  const [step, setStep] = useState<CardStep>('form');
  const [amount, setAmount] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [otp, setOtp] = useState('');
  const [txRef] = useState(() => 'CL' + Math.random().toString(36).slice(2, 10).toUpperCase());
  const [confirmedAt] = useState(() => new Date());
  const chips = [5000, 10000, 20000, 50000];

  const parsedAmount = parseFloat(amount) || 0;
  const cardType = detectCardType(card);
  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };

  const formValid = parsedAmount > 0 && card.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3;

  const handlePay = () => {
    setStep('otp');
  };

  const handleOtp = () => {
    if (otp.length < 6) return;
    setStep('processing');
    setTimeout(() => {
      setStep('receipt');
      onSuccess(parsedAmount);
      pushDepositNotification(formatNaira(parsedAmount), 'Debit Card');
    }, 2500);
  };

  if (step === 'receipt') {
    return <OnrampReceipt method={`Debit Card · ${cardType.label || 'Card'}`} ngnAmount={parsedAmount} txRef={txRef} confirmedAt={confirmedAt} onDone={onBack} />;
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 text-center">
        <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <Loader2 size={40} style={{ color: 'var(--brand)' }} className="animate-spin" />
        </motion.div>
        <h2 className="display text-xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>Processing payment...</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>Charging your card and converting to USDC.</p>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="flex flex-col min-h-full px-5 pb-8">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,168,107,0.15)' }}>
            <ShieldCheck size={32} style={{ color: 'var(--brand)' }} />
          </div>
          <h2 className="display text-xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>Verify payment</h2>
          <p className="text-sm text-pretty max-w-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Your bank sent a one-time code to your registered phone number ending in <span className="font-semibold" style={{ color: 'white' }}>••• 4567</span>
          </p>
        </div>

        <div className="rounded-2xl p-4 text-center mb-5" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>Authorising payment of</p>
          <p className="display text-2xl font-bold tabular" style={{ color: 'var(--brand)', letterSpacing: '-0.02em' }}>{formatNaira(parsedAmount)}</p>
        </div>

        <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.60)' }}>Enter the 6-digit OTP</p>
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
          <input
            type="tel" inputMode="numeric" maxLength={6} autoFocus
            placeholder="000000"
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 bg-transparent text-2xl font-bold mono outline-none tracking-widest text-center tabular"
            style={{ color: 'white' }}
          />
        </div>

        <p className="text-xs text-center mb-6" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Didn't get a code?{' '}
          <button className="font-semibold" style={{ color: 'var(--brand)' }}>Resend OTP</button>
        </p>

        <div className="mt-auto">
          <button
            disabled={otp.length < 6}
            onClick={handleOtp}
            className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: brandGradient, boxShadow: otp.length >= 6 ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
          >
            Confirm payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pb-8">
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Top up your Cashland balance with your Visa, Mastercard, or Verve debit card.
      </p>

      {/* Amount */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>Amount</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="display text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.50)' }}>₦</span>
          <input
            type="number" inputMode="decimal" placeholder="0"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="display flex-1 text-4xl font-bold bg-transparent outline-none tabular"
            style={{ color: 'white', letterSpacing: '-0.03em' }}
          />
        </div>
        {parsedAmount > 0 && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
            = {ngnToUsdc(parsedAmount).toFixed(4)} USDC
          </p>
        )}
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {chips.map(v => (
          <button key={v} onClick={() => setAmount(String(v))}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
            style={{ background: amount === String(v) ? 'var(--brand)' : 'rgba(255,255,255,0.75)', color: amount === String(v) ? 'white' : 'var(--ink)', border: `1.5px solid ${amount === String(v) ? '#00A86B' : 'rgba(255,255,255,0.12)'}` }}>
            {formatNaira(v)}
          </button>
        ))}
      </div>

      {/* Card form */}
      <div className="rounded-2xl overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>Card number</p>
            {cardType.label && (
              <span className="text-xs font-bold" style={{ color: cardType.color }}>{cardType.label}</span>
            )}
          </div>
          <input
            type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
            value={card} onChange={e => setCard(formatCard(e.target.value))}
            className="w-full bg-transparent text-base font-semibold mono outline-none"
            style={{ color: 'white' }}
          />
        </div>
        <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex">
          <div className="flex-1 px-4 py-3.5 border-r" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>Expiry</p>
            <input
              type="text" inputMode="numeric" placeholder="MM/YY"
              value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
              className="w-full bg-transparent text-base font-semibold mono outline-none"
              style={{ color: 'white' }}
            />
          </div>
          <div className="flex-1 px-4 py-3.5">
            <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em' }}>CVV</p>
            <input
              type="password" inputMode="numeric" maxLength={3} placeholder="•••"
              value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              className="w-full bg-transparent text-base font-semibold outline-none"
              style={{ color: 'white' }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5" style={{ background: 'rgba(0,168,107,0.15)' }}>
        <ShieldCheck size={13} style={{ color: 'var(--brand)' }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>256-bit encrypted. Your card details are never stored by Cashland.</p>
      </div>

      <div className="mt-auto">
        <button
          disabled={!formValid}
          onClick={handlePay}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: brandGradient, boxShadow: formValid ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          {parsedAmount > 0 ? `Pay ${formatNaira(parsedAmount)}` : 'Enter amount to continue'}
        </button>
      </div>
    </div>
  );
}

// ── USDC Deposit ──────────────────────────────────────────────
function UsdcDepositFlow({ onBack, onSuccess }: { onBack: () => void; onSuccess: (amount: number) => void }) {
  const [step, setStep] = useState<UsdcStep>('address');
  const [copied, setCopied] = useState(false);
  const [prevFloat, setPrevFloat] = useState<number | null>(null);
  const [txRef] = useState(() => 'CL' + Math.random().toString(36).slice(2, 10).toUpperCase());
  const [confirmedAt] = useState(() => new Date());
  const { address, isConnected } = useAccount();
  const { formattedNgn, usdcFloat, refetch } = useUsdcBalance();

  const depositAddress = isConnected && address ? address : '0x71F3A29f8C6B2e9214aEc81cC129284C3bA492AD';
  const short = depositAddress.slice(0, 10) + '...' + depositAddress.slice(-6);

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckBalance = () => {
    setPrevFloat(usdcFloat);
    setStep('detecting');
    void refetch();
    // After 3.5s resolve — in a real app this would poll until balance changes
    setTimeout(() => {
      setStep('receipt');
      onSuccess(0);
    }, 3500);
  };

  // Auto-detect if balance increases while on address step
  useEffect(() => {
    if (step !== 'address' || prevFloat === null) return;
    if (usdcFloat > prevFloat) {
      const diff = usdcFloat - prevFloat;
      setTimeout(() => {
        setStep('receipt');
        onSuccess(diff);
        pushDepositNotification(formattedNgn, 'USDC Deposit');
      }, 0);
    }
  }, [usdcFloat, prevFloat, step]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (step === 'receipt') {
    const detected = prevFloat !== null ? (usdcFloat - prevFloat) * USDC_RATE : 0;
    return <OnrampReceipt method="USDC Deposit" ngnAmount={detected > 0 ? detected : 1559} txRef={txRef} confirmedAt={confirmedAt} onDone={onBack} />;
  }

  if (step === 'detecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <RefreshCw size={36} style={{ color: 'var(--brand)' }} />
        </motion.div>
        <h2 className="display text-xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>Scanning blockchain...</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>Checking Arc Testnet for your USDC deposit.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pb-8">
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Send USDC to your Cashland wallet on Arc Testnet. Balance updates automatically on arrival.
      </p>

      {/* Wallet card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,168,107,0.15)' }}>
            <Wallet size={20} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'white' }}>Your Cashland wallet</p>
            {isConnected
              ? <p className="text-xs" style={{ color: 'var(--brand)' }}>Connected</p>
              : <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>Connect wallet to see live address</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="text-sm mono flex-1 text-center" style={{ color: 'white' }}>{short}</span>
          <button onClick={handleCopy} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,168,107,0.15)' }}>
            {copied ? <Check size={13} style={{ color: 'var(--brand)' }} /> : <Copy size={13} style={{ color: 'var(--brand)' }} />}
          </button>
        </div>
        {/* Simple QR placeholder */}
        <div className="flex justify-center">
          <div className="w-36 h-36 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(0,168,107,0.12)' }}>
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
              <rect x="6" y="6" width="28" height="28" rx="3" fill="#00A86B"/>
              <rect x="12" y="12" width="16" height="16" rx="1" fill="white"/>
              <rect x="76" y="6" width="28" height="28" rx="3" fill="#00A86B"/>
              <rect x="82" y="12" width="16" height="16" rx="1" fill="white"/>
              <rect x="6" y="76" width="28" height="28" rx="3" fill="#00A86B"/>
              <rect x="12" y="82" width="16" height="16" rx="1" fill="white"/>
              {Array.from({ length: 5 }, (_, row) =>
                Array.from({ length: 5 }, (__, col) => {
                  const x = 42 + col * 7;
                  const y = 42 + row * 7;
                  const seed = (row * 5 + col) * 37 % 17;
                  return seed > 7 ? <rect key={`${row}-${col}`} x={x} y={y} width="5" height="5" rx="1" fill="#00A86B" /> : null;
                })
              )}
              <circle cx="55" cy="55" r="9" fill="white"/>
              <path d="M58 51.5H52C51.4 51.5 51 51.9 51 52.5V53C51 53.6 51.4 54 52 54H56C56.6 54 57 54.4 57 55V56C57 56.6 56.6 57 56 57H50.5" stroke="#00A86B" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M55 49.5V51.5M55 57V59" stroke="#00A86B" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Info table */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}>
        {[
          { label: 'Network', value: 'Arc Testnet' },
          { label: 'Asset', value: 'USDC' },
          { label: 'Minimum', value: '$1.00' },
          { label: 'Arrival', value: 'Under 30 seconds' },
          { label: 'Fee', value: 'Free', success: true },
        ].map((row, i, arr) => (
          <div key={row.label}>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: (row as { success?: boolean }).success ? 'var(--brand)' : 'var(--ink)' }}>{row.value}</span>
            </div>
            {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-5" style={{ background: 'rgba(255,182,0,0.10)' }}>
        <Info size={13} style={{ color: '#B07800', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: '#7A5200' }}>
          Only send USDC on Arc Testnet. Sending other assets or on a different network may result in permanent loss.
        </p>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={handleCheckBalance}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          I've sent USDC — check now
        </button>
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noreferrer"
          className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'rgba(0,168,107,0.15)', color: 'var(--brand)' }}
        >
          <ExternalLink size={15} /> Get testnet USDC from faucet
        </a>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function AddMoneyScreen({ onClose, onDeposited }: Props) {
  const [screen, setScreen] = useState<Screen>('methods');

  const handleSuccess = (amount: number) => {
    if (amount > 0) onDeposited?.();
  };

  const methods = [
    {
      id: 'bank' as const,
      icon: <Building2 size={24} style={{ color: '#00A86B' }} />,
      title: 'Bank Transfer',
      subtitle: 'Transfer from any Nigerian bank. Instant.',
      badge: 'Recommended',
      badgeBg: 'var(--brand-light)',
      badgeColor: 'var(--brand)',
      iconBg: 'var(--brand-light)',
    },
    {
      id: 'card' as const,
      icon: <CreditCard size={24} style={{ color: '#6C47FF' }} />,
      title: 'Debit Card',
      subtitle: 'Visa, Mastercard or Verve. 3DS secured.',
      badge: 'Popular',
      badgeBg: 'rgba(108,71,255,0.10)',
      badgeColor: '#6C47FF',
      iconBg: 'rgba(108,71,255,0.10)',
    },
    {
      id: 'usdc' as const,
      icon: <ArrowDownToLine size={24} style={{ color: '#2563EB' }} />,
      title: 'USDC Deposit',
      subtitle: 'Send USDC from any wallet or exchange.',
      badge: 'Crypto',
      badgeBg: 'rgba(37,99,235,0.10)',
      badgeColor: '#2563EB',
      iconBg: 'rgba(37,99,235,0.10)',
    },
  ];

  const wrapperStyle = { background: 'linear-gradient(180deg, #080f1a 0%, #0a1628 50%, #0c1c32 100%)' };

  if (screen === 'bank') return (
    <div className="fixed inset-0 z-50 flex flex-col" style={wrapperStyle}>
      <BackHeader title="Bank Transfer" onBack={() => setScreen('methods')} />
      <div className="flex-1 overflow-y-auto"><BankTransferFlow onBack={() => setScreen('methods')} onSuccess={handleSuccess} /></div>
    </div>
  );

  if (screen === 'card') return (
    <div className="fixed inset-0 z-50 flex flex-col" style={wrapperStyle}>
      <BackHeader title="Debit Card" onBack={() => setScreen('methods')} />
      <div className="flex-1 overflow-y-auto"><CardTopUpFlow onBack={() => setScreen('methods')} onSuccess={handleSuccess} /></div>
    </div>
  );

  if (screen === 'usdc') return (
    <div className="fixed inset-0 z-50 flex flex-col" style={wrapperStyle}>
      <BackHeader title="USDC Deposit" onBack={() => setScreen('methods')} />
      <div className="flex-1 overflow-y-auto"><UsdcDepositFlow onBack={() => setScreen('methods')} onSuccess={handleSuccess} /></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={wrapperStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '0%', right: '-10%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <BackHeader title="Add Money" onBack={onClose} />

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">

        {/* Exchange rate banner */}
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: navyGradient }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.20)' }}>
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Rate: ₦{USDC_RATE.toLocaleString()} = 1 USDC</p>
            <p className="text-white/70 text-xs mt-0.5">Zero fees · Instant conversion · Updated daily</p>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {methods.map((m, i) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setScreen(m.id)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: m.iconBg }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-semibold" style={{ color: 'white' }}>{m.title}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: m.badgeBg, color: m.badgeColor }}>
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{m.subtitle}</p>
                </div>
                <ChevronLeft size={18} style={{ color: 'rgba(255,255,255,0.50)', transform: 'rotate(180deg)', flexShrink: 0 }} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mt-6" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <ShieldCheck size={14} style={{ color: 'var(--brand)' }} />
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
            All top-ups are secured by Cashland. Zero fees on every method.
          </p>
        </div>
      </div>
    </div>
  );
}
