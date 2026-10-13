import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Search, Building2, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, Lock, Copy, Check,
  ArrowDownLeft, ShieldCheck,
} from 'lucide-react';
import { glass, formatNaira } from './design';
import { useUsdcBalance, NGN_PER_USDC } from './useUsdcBalance';

interface Props {
  onClose: () => void;
  onWithdrawn?: (ngnAmount: number) => void;
}

// ------- Nigerian banks -------
const BANKS = [
  { code: '058', name: 'GTBank (Guaranty Trust)', short: 'GTBank', color: '#F37021' },
  { code: '044', name: 'Access Bank', short: 'Access Bank', color: '#E4002B' },
  { code: '057', name: 'Zenith Bank', short: 'Zenith Bank', color: '#008751' },
  { code: '011', name: 'First Bank of Nigeria', short: 'First Bank', color: '#003087' },
  { code: '033', name: 'United Bank for Africa (UBA)', short: 'UBA', color: '#E4002B' },
  { code: '070', name: 'Fidelity Bank', short: 'Fidelity Bank', color: '#008751' },
  { code: '030', name: 'Heritage Bank', short: 'Heritage Bank', color: '#8B0000' },
  { code: '032', name: 'Union Bank', short: 'Union Bank', color: '#00518A' },
  { code: '035', name: 'Wema Bank / ALAT', short: 'Wema Bank', color: '#6A0DAD' },
  { code: '232', name: 'Sterling Bank', short: 'Sterling Bank', color: '#CC0000' },
  { code: '215', name: 'Unity Bank', short: 'Unity Bank', color: '#006400' },
  { code: '102', name: 'Providus Bank', short: 'Providus Bank', color: '#1B3A6A' },
  { code: '50211', name: 'Kuda Bank', short: 'Kuda Bank', color: '#40196B' },
  { code: '999992', name: 'OPay', short: 'OPay', color: '#22C55E' },
  { code: '50515', name: 'PalmPay', short: 'PalmPay', color: '#008751' },
  { code: '100014', name: 'Carbon (Paylater)', short: 'Carbon', color: '#F97316' },
  { code: '090405', name: 'Moniepoint MFB', short: 'Moniepoint', color: '#3B82F6' },
  { code: '090267', name: 'Kolomoni MFB', short: 'Kolomoni', color: '#8B5CF6' },
];

// Fake resolved names keyed by last 4 digits for prototype realism
const FAKE_NAMES: Record<string, string> = {
  '0001': 'Musa Ibrahim', '0002': 'Aisha Bello', '0003': 'David Okafor',
  '0004': 'Chioma Eze', '0005': 'Abdul Rasheed', '1234': 'Emeka Obi',
  '5678': 'Ngozi Adeyemi', '9012': 'Tunde Bakare', '3456': 'Fatima Yusuf',
};
function resolveAccountName(acct: string): string {
  const key = acct.slice(-4);
  return FAKE_NAMES[key] ?? 'Account holder';
}

// Receipt component
function WithdrawalReceipt({
  bank, accountNumber, accountName, ngnAmount, txRef, confirmedAt, usdcUsed, onDone,
}: {
  bank: typeof BANKS[0]; accountNumber: string; accountName: string;
  ngnAmount: number; txRef: string; confirmedAt: Date; usdcUsed: number; onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    navigator.clipboard.writeText(txRef).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--brand)' }}>CASHLAND</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>Withdrawal Receipt</span>
      </div>

      <div className="flex-1 px-5 pb-8">
        {/* Hero */}
        <motion.div
          className="rounded-3xl p-6 mb-4 text-center"
          style={{ ...glass.card, border: '1px solid rgba(0,168,107,0.15)' }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #00A86B20, #00A86B30)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--brand)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Amount sent to bank</p>
          <p className="display text-4xl font-bold tabular mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
            {formatNaira(ngnAmount)}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,168,107,0.10)' }}>
            <CheckCircle2 size={12} style={{ color: 'var(--brand)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Successful</span>
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          className="rounded-2xl overflow-hidden mb-4"
          style={glass.card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          {[
            { label: 'Sent to', value: accountName },
            { label: 'Bank', value: bank.short },
            { label: 'Account', value: accountNumber.replace(/(.{3})(.{3})(.{4})/, '$1 $2 $3') },
            { label: 'Amount', value: formatNaira(ngnAmount) },
            { label: 'USDC used', value: `${usdcUsed.toFixed(4)} USDC` },
            { label: 'Network fee', value: '₦0' },
            { label: 'Date', value: confirmedAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Time', value: confirmedAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
                <span className="text-sm font-semibold tabular" style={{ color: 'var(--ink)' }}>{value}</span>
              </div>
              {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
        </motion.div>

        {/* Reference */}
        <motion.button
          onClick={copyRef}
          className="w-full rounded-2xl p-4 flex items-center justify-between mb-6"
          style={{ ...glass.card, border: '1px dashed rgba(0,168,107,0.3)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Cashland Reference</p>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'var(--ink)' }}>{txRef}</p>
          </div>
          {copied ? <Check size={16} style={{ color: 'var(--brand)' }} /> : <Copy size={16} style={{ color: 'var(--muted)' }} />}
        </motion.button>

        <motion.button
          onClick={onDone}
          className="w-full h-14 rounded-2xl font-bold text-white text-base"
          style={{ background: 'var(--brand)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
        >
          Done
        </motion.button>
      </div>
    </div>
  );
}

// ------- Main withdraw flow -------
type Step = 'bank' | 'account' | 'amount' | 'review' | 'pin' | 'processing' | 'success';

export default function WithdrawScreen({ onClose, onWithdrawn }: Props) {
  const [step, setStep] = useState<Step>('bank');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const [txRef] = useState(() => 'CL-W' + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [confirmedAt] = useState(() => new Date());

  const { usdcFloat, formattedUsdc, isConnected } = useUsdcBalance();
  const parsedNgn = parseFloat(amount.replace(/,/g, '')) || 0;
  const usdcNeeded = parsedNgn / NGN_PER_USDC;
  const hasEnough = usdcFloat >= usdcNeeded && usdcNeeded > 0;
  const chips = [5000, 10000, 20000, 50000, 100000];

  // Account number resolution
  useEffect(() => {
    const clear = setTimeout(() => {
      if (accountNumber.length !== 10) { setAccountName(''); setResolveError(''); return; }
      setResolving(true);
      setResolveError('');
      const t = setTimeout(() => {
        const name = resolveAccountName(accountNumber);
        if (name) {
          setAccountName(name);
        } else {
          setResolveError('Account not found. Check the number and try again.');
        }
        setResolving(false);
      }, 1400);
      return () => clearTimeout(t);
    }, 0);
    return () => clearTimeout(clear);
  }, [accountNumber]);

  // PIN auto-submit
  useEffect(() => {
    if (pin.length !== 6) return;
    const msgs = ['Converting USDC to Naira...', 'Sending to bank...', 'Confirming transfer...'];
    let i = 0;
    const start = setTimeout(() => {
      setStep('processing');
      setProcessingMsg(msgs[0]);
      const iv = setInterval(() => {
        i++;
        if (i < msgs.length) {
          setProcessingMsg(msgs[i]);
        } else {
          clearInterval(iv);
          setStep('success');
          onWithdrawn?.(parsedNgn);
        }
      }, 1400);
    }, 0);
    return () => clearTimeout(start);
  }, [pin]);  // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBanks = BANKS.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.short.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // ---- STEP: success ----
  if (step === 'success' && selectedBank) {
    return (
      <WithdrawalReceipt
        bank={selectedBank}
        accountNumber={accountNumber}
        accountName={accountName}
        ngnAmount={parsedNgn}
        txRef={txRef}
        confirmedAt={confirmedAt}
        usdcUsed={usdcNeeded}
        onDone={onClose}
      />
    );
  }

  // ---- STEP: processing ----
  if (step === 'processing') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8"
        style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Loader2 size={48} style={{ color: 'var(--brand)' }} />
        </motion.div>
        <p className="display text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Processing withdrawal</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={processingMsg}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm text-center" style={{ color: 'var(--muted)' }}
          >
            {processingMsg}
          </motion.p>
        </AnimatePresence>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
          ))}
        </div>
      </div>
    );
  }

  // ---- STEP: pin ----
  if (step === 'pin') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('review')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Confirm withdrawal</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'var(--brand-light)' }}>
            <Lock size={28} style={{ color: 'var(--brand)' }} />
          </div>
          <p className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Enter your PIN</p>
          <p className="text-sm mb-8 text-center" style={{ color: 'var(--muted)' }}>
            Authorise sending {formatNaira(parsedNgn)} to {accountName}
          </p>

          {/* PIN dots */}
          <div className="flex gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: 'var(--brand)', background: pin.length > i ? 'var(--brand)' : 'transparent' }}
                animate={{ scale: pin.length === i + 1 ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (!k) return;
                  if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
                  if (pin.length < 6) setPin(p => p + k);
                }}
                disabled={!k}
                className="h-14 rounded-2xl flex items-center justify-center text-xl font-semibold transition-all active:scale-90"
                style={{ background: k ? 'rgba(255,255,255,0.9)' : 'transparent', color: 'var(--ink)', boxShadow: k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-8">
            <ShieldCheck size={13} style={{ color: 'var(--brand)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Protected by Cashland Security</span>
          </div>
        </div>
      </div>
    );
  }

  // ---- STEP: review ----
  if (step === 'review' && selectedBank) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('amount')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Review withdrawal</span>
        </div>

        <div className="flex-1 px-5 pb-8">
          {/* Hero amount */}
          <div className="text-center py-6">
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>You are withdrawing</p>
            <p className="display text-5xl font-bold tabular" style={{ color: 'var(--ink)', letterSpacing: '-0.04em' }}>{formatNaira(parsedNgn)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{usdcNeeded.toFixed(4)} USDC will be used</p>
          </div>

          {/* Details */}
          <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
            {[
              { label: 'Recipient', value: accountName },
              { label: 'Bank', value: selectedBank.short },
              { label: 'Account number', value: accountNumber.replace(/(.{3})(.{3})(.{4})/, '$1 $2 $3') },
              { label: 'Amount', value: formatNaira(parsedNgn) },
              { label: 'USDC to convert', value: `${usdcNeeded.toFixed(4)} USDC` },
              { label: 'Exchange rate', value: `₦${NGN_PER_USDC.toLocaleString()}/USDC` },
              { label: 'Cashland fee', value: '₦0 — Free' },
              { label: 'Network fee', value: '₦0' },
            ].map(({ label, value }, i, arr) => (
              <div key={label}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{value}</span>
                </div>
                {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
            style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.2)' }}>
            <span className="font-semibold" style={{ color: 'var(--ink)' }}>Total deducted</span>
            <span className="display text-lg font-bold tabular" style={{ color: 'var(--brand)' }}>{formatNaira(parsedNgn)}</span>
          </div>

          <p className="text-xs text-center mb-6" style={{ color: 'var(--muted)' }}>
            Cashland converts your USDC to Naira and sends to your bank account.
          </p>

          <motion.button
            onClick={() => { setPin(''); setStep('pin'); }}
            className="w-full h-14 rounded-2xl font-bold text-white text-base"
            style={{ background: 'var(--brand)' }}
            whileTap={{ scale: 0.97 }}
          >
            Withdraw {formatNaira(parsedNgn)}
          </motion.button>
        </div>
      </div>
    );
  }

  // ---- STEP: amount ----
  if (step === 'amount') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('account')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>How much to withdraw?</span>
        </div>

        <div className="flex-1 px-5 pb-8">
          {/* Recipient summary */}
          {selectedBank && (
            <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={glass.card}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: selectedBank.color + '20' }}>
                <Building2 size={18} style={{ color: selectedBank.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{accountName}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{selectedBank.short} · {accountNumber}</p>
              </div>
              <CheckCircle2 size={18} style={{ color: 'var(--brand)' }} className="ml-auto" />
            </div>
          )}

          {/* Big amount input */}
          <div className="text-center mb-4">
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Enter amount in Naira</p>
            <div className="flex items-center justify-center gap-1">
              <span className="display text-4xl font-semibold" style={{ color: parsedNgn > 0 ? 'var(--ink)' : 'var(--muted)' }}>₦</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="display text-5xl font-bold tabular bg-transparent outline-none text-center min-w-0"
                style={{ color: 'var(--ink)', letterSpacing: '-0.04em', width: Math.max(120, String(amount || '0').length * 32) }}
              />
            </div>
            {parsedNgn > 0 && (
              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                {usdcNeeded.toFixed(4)} USDC · rate ₦{NGN_PER_USDC.toLocaleString()}/USDC
              </p>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {chips.map(c => (
              <button
                key={c}
                onClick={() => setAmount(String(c))}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: parsedNgn === c ? 'var(--brand)' : 'rgba(0,168,107,0.1)',
                  color: parsedNgn === c ? 'white' : 'var(--brand)',
                }}
              >
                {formatNaira(c)}
              </button>
            ))}
          </div>

          {/* Balance info */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,168,107,0.06)', border: '1px solid rgba(0,168,107,0.12)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Available</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {isConnected ? formattedUsdc + ' USDC' : 'Connect wallet'}
              </span>
            </div>
            {parsedNgn > 0 && !hasEnough && isConnected && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle size={13} style={{ color: '#EF4444' }} />
                <span className="text-xs font-medium" style={{ color: '#EF4444' }}>Insufficient USDC balance</span>
              </div>
            )}
          </div>

          {/* Daily limit notice */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-6" style={{ background: 'rgba(59,130,246,0.07)' }}>
            <ArrowDownLeft size={14} style={{ color: '#3B82F6' }} />
            <p className="text-xs" style={{ color: '#3B82F6' }}>Daily withdrawal limit: <strong>₦500,000</strong> (Tier 2)</p>
          </div>

          <motion.button
            onClick={() => setStep('review')}
            disabled={!parsedNgn || !hasEnough || !isConnected}
            className="w-full h-14 rounded-2xl font-bold text-white text-base disabled:opacity-40"
            style={{ background: 'var(--brand)' }}
            whileTap={{ scale: 0.97 }}
          >
            Continue
          </motion.button>
        </div>
      </div>
    );
  }

  // ---- STEP: account ----
  if (step === 'account') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('bank')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Enter account number</span>
        </div>

        <div className="flex-1 px-5 pb-8">
          {/* Bank badge */}
          {selectedBank && (
            <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-2xl" style={{ background: selectedBank.color + '12', border: `1px solid ${selectedBank.color}30` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: selectedBank.color }}>
                <Building2 size={15} color="white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{selectedBank.short}</span>
              <button onClick={() => setStep('bank')} className="ml-auto text-xs" style={{ color: 'var(--brand)' }}>Change</button>
            </div>
          )}

          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>10-digit NUBAN account number</p>
          <div className="rounded-2xl mb-3" style={{ ...glass.card, border: '1.5px solid rgba(0,168,107,0.2)' }}>
            <input
              type="tel"
              maxLength={10}
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0000000000"
              className="w-full px-4 py-4 bg-transparent text-xl font-bold tabular tracking-widest outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          {/* Resolution state */}
          <AnimatePresence>
            {resolving && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-1 mb-4">
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--brand)' }} />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Verifying account...</span>
              </motion.div>
            )}
            {!resolving && accountName && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-1 mb-4">
                <CheckCircle2 size={16} style={{ color: 'var(--brand)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{accountName}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--brand)' }}>Verified</span>
              </motion.div>
            )}
            {!resolving && resolveError && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-1 mb-4">
                <AlertCircle size={16} style={{ color: '#EF4444' }} />
                <span className="text-sm" style={{ color: '#EF4444' }}>{resolveError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs mb-8" style={{ color: 'var(--muted)' }}>
            Your bank account name will be displayed for confirmation before any money is sent.
          </p>

          <motion.button
            onClick={() => setStep('amount')}
            disabled={!accountName}
            className="w-full h-14 rounded-2xl font-bold text-white text-base disabled:opacity-40"
            style={{ background: 'var(--brand)' }}
            whileTap={{ scale: 0.97 }}
          >
            Continue
          </motion.button>
        </div>
      </div>
    );
  }

  // ---- STEP: bank selection ----
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <div>
          <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Withdraw to Bank</span>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Select your bank</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={bankSearch}
            onChange={e => setBankSearch(e.target.value)}
            placeholder="Search banks..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{ ...glass.card, color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* Bank list */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {filteredBanks.map((bank, i) => (
            <div key={bank.code}>
              <motion.button
                onClick={() => { setSelectedBank(bank); setStep('account'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:bg-black/5"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bank.color + '20' }}>
                  <Building2 size={18} style={{ color: bank.color }} />
                </div>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--ink)' }}>{bank.name}</span>
                <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
              </motion.button>
              {i < filteredBanks.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
          {filteredBanks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No banks found for "{bankSearch}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
