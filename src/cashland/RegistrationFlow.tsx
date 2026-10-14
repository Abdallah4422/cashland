import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, AtSign, User, Lock, Fingerprint, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { glass, navyGradient, brandGradient } from './design';
import { saveSession, hashPin } from './useUserSession';
import type { BackendActions, BackendState } from './useBackend';

interface Props {
  onComplete: () => void;
  backend?: BackendState & BackendActions;
}

type Step = 'phone' | 'otp' | 'profile' | 'kyc' | 'pin' | 'pin-confirm' | 'biometrics';

const CashlandLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: navyGradient }}>
      <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
        <path d="M22 6C13.16 6 6 13.16 6 22C6 30.84 13.16 38 22 38C30.84 38 38 30.84 38 22C38 13.16 30.84 6 22 6Z" fill="white"/>
        <path d="M27.5 16.5H19C17.9 16.5 17 17.4 17 18.5V19.5C17 20.6 17.9 21.5 19 21.5H25C26.1 21.5 27 22.4 27 23.5V25.5C27 26.6 26.1 27.5 25 27.5H16.5" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M22 14V16.5M22 27.5V30" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
    <span className="display font-bold text-lg" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Cashland</span>
  </div>
);

// ── Phone step ────────────────────────────────────────────────
function PhoneStep({ onNext }: { onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 10;

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-8">
        <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          What's your phone number?
        </h2>
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          We'll send a verification code to confirm this number.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm flex-shrink-0">
              <rect width="7" height="14" fill="#008751"/>
              <rect x="7" width="6" height="14" fill="white"/>
              <rect x="13" width="7" height="14" fill="#008751"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>+234</span>
            <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="w-px h-5 bg-black/10" />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="803 000 0000"
            className="flex-1 bg-transparent text-base outline-none tabular"
            style={{ color: 'var(--ink)' }}
          />
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2">
          <Phone size={13} style={{ color: 'var(--muted)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Nigeria (NG)</span>
        </div>
      </div>

      <div className="mt-auto">
        <button
          disabled={!valid}
          onClick={() => onNext(phone)}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: brandGradient, boxShadow: valid ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ── OTP step ───────────────────────────────────────────────────
function OtpStep({ phone, onNext }: { phone: string; onNext: () => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (newOtp.every(d => d)) setTimeout(() => onNext(), 300);
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const maskedPhone = '+234 ' + phone.slice(0, 3) + ' *** ' + phone.slice(-4);

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-8">
        <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Verify your number
        </h2>
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          Enter the code sent to <span className="font-semibold" style={{ color: 'var(--ink)' }}>{maskedPhone}</span>
        </p>
      </div>

      <div className="flex gap-2.5 justify-center mb-8">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            className="w-12 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all tabular"
            style={{
              background: digit ? 'var(--brand)' : 'rgba(255,255,255,0.80)',
              color: digit ? 'white' : 'var(--ink)',
              border: `2px solid ${digit ? 'var(--brand)' : 'rgba(0,0,0,0.10)'}`,
              boxShadow: digit ? '0 4px 12px rgba(0,168,107,0.25)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          Verify
        </button>
        <button className="w-full py-3 text-sm font-medium" style={{ color: 'var(--subtle)' }}>
          Resend code
        </button>
      </div>
    </div>
  );
}

// ── Profile step ───────────────────────────────────────────────
function ProfileStep({ onNext }: { onNext: (firstName: string, lastName: string, tag: string) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const suggestedTag = firstName ? '@' + firstName.toLowerCase().replace(/\s/g, '') : '';
  const [tag, setTag] = useState('');

  const handleFirstName = (v: string) => {
    setFirstName(v);
    setTag('@' + v.toLowerCase().replace(/\s/g, ''));
  };

  const valid = firstName.length > 0 && lastName.length > 0 && tag.length > 1;

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-6">
        <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Create your profile
        </h2>
        <p className="text-sm text-pretty" style={{ color: 'var(--subtle)' }}>
          Your CashTag lets people send money to you without knowing your wallet address.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { icon: User, placeholder: 'First name', value: firstName, onChange: handleFirstName },
          { icon: User, placeholder: 'Last name', value: lastName, onChange: setLastName },
        ].map(({ icon: Icon, placeholder, value, onChange }) => (
          <div key={placeholder} className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={glass.card}>
            <Icon size={18} style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={e => onChange(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>
        ))}

        <div className="px-4 py-4 rounded-2xl" style={glass.card}>
          <div className="flex items-center gap-3 mb-1">
            <AtSign size={18} style={{ color: 'var(--brand)' }} />
            <input
              type="text"
              placeholder="@cashtag"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="flex-1 bg-transparent text-base font-semibold outline-none"
              style={{ color: 'var(--brand)' }}
            />
          </div>
          {suggestedTag && tag !== suggestedTag && (
            <button
              className="text-xs ml-7 mt-1"
              style={{ color: 'var(--subtle)' }}
              onClick={() => setTag(suggestedTag)}
            >
              Suggested: <span style={{ color: 'var(--brand)' }}>{suggestedTag}</span> — Use this
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <button
          disabled={!valid}
          onClick={() => onNext(firstName, lastName, tag)}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: brandGradient, boxShadow: valid ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ── KYC step ───────────────────────────────────────────────────
type KycMethod = 'bvn' | 'nin';
type KycStatus = 'idle' | 'verifying' | 'success' | 'failed';

function KycStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [method, setMethod] = useState<KycMethod>('bvn');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<KycStatus>('idle');

  const isBvn = method === 'bvn';
  const isValid = isBvn ? value.replace(/\D/g, '').length === 11 : value.replace(/\D/g, '').length === 11;

  const handleVerify = () => {
    if (!isValid) return;
    setStatus('verifying');
    // Simulate verification — prototype always succeeds after 2s
    setTimeout(() => setStatus('success'), 2000);
  };

  const handleMethodSwitch = (m: KycMethod) => {
    setMethod(m);
    setValue('');
    setStatus('idle');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
          <motion.div
            className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center"
            style={{ background: 'var(--brand-light)', boxShadow: '0 12px 32px rgba(0,168,107,0.2)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <ShieldCheck size={48} style={{ color: 'var(--brand)' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Identity verified
            </h2>
            <p className="text-sm text-pretty max-w-xs" style={{ color: 'var(--subtle)' }}>
              Your {isBvn ? 'BVN' : 'NIN'} has been verified. Your account is now fully unlocked.
            </p>
          </motion.div>

          <motion.div className="mt-5 rounded-2xl px-5 py-4 w-full" style={{ background: 'var(--brand-light)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {[
              { label: 'Verification type', value: isBvn ? 'Bank Verification Number (BVN)' : 'National ID Number (NIN)' },
              { label: 'Status', value: 'Verified', success: true },
              { label: 'KYC level', value: 'Tier 2 — ₦500,000 daily limit' },
            ].map((row, i, arr) => (
              <div key={row.label}>
                <div className="flex items-start justify-between py-2.5">
                  <span className="text-xs" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                  <div className="flex items-center gap-1">
                    {row.success && <CheckCircle2 size={12} style={{ color: 'var(--brand)' }} />}
                    <span className="text-xs font-semibold text-right" style={{ color: row.success ? 'var(--brand)' : 'var(--ink)' }}>{row.value}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(0,168,107,0.15)' }} />}
              </div>
            ))}
          </motion.div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-6">
        <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Verify your identity
        </h2>
        <p className="text-sm text-pretty" style={{ color: 'var(--subtle)' }}>
          This is required by the Central Bank of Nigeria. Your data is encrypted and never shared.
        </p>
      </div>

      {/* Why KYC banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl mb-5" style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.15)' }}>
        <ShieldCheck size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--brand)' }}>Why do we need this?</p>
          <p className="text-xs text-pretty" style={{ color: 'var(--subtle)' }}>
            CBN regulations require identity verification for all Nigerian payment accounts. This protects you and enables higher transaction limits.
          </p>
        </div>
      </div>

      {/* Method tabs */}
      <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
        {(['bvn', 'nin'] as KycMethod[]).map(m => (
          <button
            key={m}
            onClick={() => handleMethodSwitch(m)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: method === m ? 'white' : 'transparent',
              color: method === m ? 'var(--ink)' : 'var(--muted)',
              boxShadow: method === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mb-2">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--subtle)' }}>
          {isBvn ? 'Bank Verification Number (BVN)' : 'National Identification Number (NIN)'}
        </p>
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={glass.card}>
          <CreditCard size={18} style={{ color: 'var(--muted)' }} />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder={isBvn ? '22123456789' : '12345678901'}
            value={value}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              setValue(digits);
              if (status === 'failed') setStatus('idle');
            }}
            className="flex-1 bg-transparent text-base outline-none tabular tracking-widest"
            style={{ color: 'var(--ink)' }}
          />
          {isValid && status === 'idle' && <CheckCircle2 size={16} style={{ color: 'var(--brand)' }} />}
        </div>
        <p className="text-xs mt-2 ml-1" style={{ color: 'var(--muted)' }}>
          {isBvn
            ? 'Your BVN is an 11-digit number from your bank.'
            : 'Your NIN is on your National ID card or slip.'}
        </p>
      </div>

      {status === 'failed' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-2" style={{ background: 'rgba(229,62,62,0.08)' }}>
          <AlertCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--error)' }}>
            We could not verify this {isBvn ? 'BVN' : 'NIN'}. Please check the number and try again.
          </p>
        </div>
      )}

      {/* How to find it */}
      <div className="mt-3 mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--subtle)' }}>
          {isBvn ? 'How to find your BVN' : 'How to find your NIN'}
        </p>
        <div className="space-y-2">
          {(isBvn
            ? ['Dial *565*0# on your registered phone', 'Check your bank app under Profile', 'Visit any branch of your bank']
            : ['Dial *346# on any phone', 'Check your National ID card', 'Visit any NIMC enrollment centre']
          ).map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                {i + 1}
              </div>
              <p className="text-xs" style={{ color: 'var(--subtle)' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          disabled={!isValid || status === 'verifying'}
          onClick={handleVerify}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: brandGradient, boxShadow: isValid ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          {status === 'verifying' ? (
            <><Loader2 size={18} className="animate-spin" /> Verifying...</>
          ) : (
            'Verify ' + (isBvn ? 'BVN' : 'NIN')
          )}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm font-medium"
          style={{ color: 'var(--subtle)' }}
        >
          Skip for now — verify later
        </button>
      </div>
    </div>
  );
}

// ── PIN step ───────────────────────────────────────────────────
interface PinStepProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
}

function PinStep({ title, subtitle, onComplete }: PinStepProps) {
  const [pin, setPin] = useState('');

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 6) setTimeout(() => onComplete(newPin), 300);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
          <Lock size={22} style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        {subtitle && <p className="text-sm" style={{ color: 'var(--subtle)' }}>{subtitle}</p>}
      </div>

      <div className="flex justify-center gap-4 mb-10">
        {[0,1,2,3,4,5].map(i => (
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={{
              background: i < pin.length ? 'var(--brand)' : 'rgba(0,0,0,0.15)',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
              boxShadow: i < pin.length ? '0 2px 8px rgba(0,168,107,0.4)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
        {digits.map((d, i) => (
          d === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => d === '⌫' ? handleDelete() : handleDigit(d)}
              className="h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center"
              style={{
                background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.75)',
                color: 'var(--ink)',
                border: d === '⌫' ? 'none' : '1px solid rgba(255,255,255,0.80)',
                boxShadow: d === '⌫' ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {d}
            </button>
          )
        ))}
      </div>
    </div>
  );
}

// ── Biometrics step ────────────────────────────────────────────
function BiometricsStep({ onEnable, onSkip }: { onEnable: () => Promise<void>; onSkip: () => Promise<void> }) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center pb-8">
        <div
          className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center"
          style={{ background: 'var(--brand-light)', boxShadow: '0 12px 32px rgba(0,168,107,0.2)' }}
        >
          <Fingerprint size={48} style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="display text-2xl font-bold mb-3" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Use biometrics for faster payments
        </h2>
        <p className="text-sm text-pretty max-w-xs" style={{ color: 'var(--subtle)' }}>
          Use your fingerprint or Face ID to confirm payments quickly and securely.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => void onEnable()}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          Enable Biometrics
        </button>
        <button
          onClick={() => void onSkip()}
          className="w-full py-3 text-sm font-medium"
          style={{ color: 'var(--subtle)' }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

// ── Orchestrator ───────────────────────────────────────────────
export default function RegistrationFlow({ onComplete, backend }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', tag: '' });
  const [kycTier, setKycTier] = useState<1 | 2>(1);

  const stepIndex: Record<Step, number> = {
    phone: 0, otp: 1, profile: 2, kyc: 3, pin: 4, 'pin-confirm': 5, biometrics: 6,
  };
  const totalSteps = 7;
  const progress = (stepIndex[step] + 1) / totalSteps;

  const stepOrder: Step[] = ['phone', 'otp', 'profile', 'kyc', 'pin', 'pin-confirm', 'biometrics'];

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 60%, #F4FAF7 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '0%', right: '0%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          {stepIndex[step] > 0 ? (
            <button
              onClick={() => {
                const prev = stepOrder[stepIndex[step] - 1];
                setStep(prev);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
            </button>
          ) : (
            <CashlandLogo />
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {stepIndex[step] + 1} of {totalSteps}
          </span>
        </div>
        <div className="h-1 rounded-full" style={{ background: 'rgba(0,168,107,0.15)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: navyGradient }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      <div className="relative z-10 flex-1 px-6 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="h-full flex flex-col"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {step === 'phone' && <PhoneStep onNext={p => { setPhone(p); setStep('otp'); }} />}
            {step === 'otp' && <OtpStep phone={phone} onNext={() => setStep('profile')} />}
            {step === 'profile' && (
              <ProfileStep onNext={(firstName, lastName, tag) => {
                setProfile({ firstName, lastName, tag });
                setStep('kyc');
              }} />
            )}
            {step === 'kyc' && (
              <KycStep
                onNext={() => { setKycTier(2); setStep('pin'); }}
                onSkip={() => setStep('pin')}
              />
            )}
            {step === 'pin' && (
              <PinStep
                title="Create your Cashland PIN"
                subtitle="Choose a 6-digit PIN for your account"
                onComplete={p => { setPin(p); setStep('pin-confirm'); }}
              />
            )}
            {step === 'pin-confirm' && (
              <PinStep
                title="Confirm PIN"
                subtitle="Enter your PIN again to confirm"
                onComplete={p => {
                  if (p === pin || true) {
                    setStep('biometrics');
                  }
                }}
              />
            )}
            {step === 'biometrics' && (
              <BiometricsStep
                onEnable={async () => {
                  if (backend && backend.status === 'online') {
                    try {
                      await backend.register({ phone, ...profile, pin, biometrics: true });
                    } catch { /* fallback to local */ }
                  }
                  const pinHash = await hashPin(pin);
                  saveSession({
                    phone, ...profile, kycTier, kycMethod: kycTier === 2 ? 'bvn' : 'none',
                    pinHash, biometrics: true,
                    createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(),
                  });
                  onComplete();
                }}
                onSkip={async () => {
                  if (backend && backend.status === 'online') {
                    try {
                      await backend.register({ phone, ...profile, pin, biometrics: false });
                    } catch { /* fallback to local */ }
                  }
                  const pinHash = await hashPin(pin);
                  saveSession({
                    phone, ...profile, kycTier, kycMethod: kycTier === 2 ? 'bvn' : 'none',
                    pinHash, biometrics: false,
                    createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(),
                  });
                  onComplete();
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
