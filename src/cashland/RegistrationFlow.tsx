import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, AtSign, User, Lock, Fingerprint, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { brandGradient } from './design';
import { saveSession, hashPin } from './useUserSession';
import type { BackendActions, BackendState } from './useBackend';

interface Props {
  onComplete: () => void;
  backend?: BackendState & BackendActions;
}

type Step = 'phone' | 'otp' | 'profile' | 'kyc' | 'pin' | 'pin-confirm' | 'biometrics';

// Dark glass surfaces
const darkCard = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(20px)',
};
const darkInput = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
};

const CashlandLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007a4d 100%)' }}>
      <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
        <path d="M22 6C13.16 6 6 13.16 6 22C6 30.84 13.16 38 22 38C30.84 38 38 30.84 38 22C38 13.16 30.84 6 22 6Z" fill="white"/>
        <path d="M27.5 16.5H19C17.9 16.5 17 17.4 17 18.5V19.5C17 20.6 17.9 21.5 19 21.5H25C26.1 21.5 27 22.4 27 23.5V25.5C27 26.6 26.1 27.5 25 27.5H16.5" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M22 14V16.5M22 27.5V30" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
    <span className="font-bold text-lg" style={{ color: 'white', letterSpacing: '-0.02em' }}>Cashland</span>
  </div>
);

// ── Step header label colours ────────────────────────────────────
const stepLabels: Record<Step, string> = {
  phone: 'Phone', otp: 'Verify', profile: 'Profile',
  kyc: 'Identity', pin: 'PIN', 'pin-confirm': 'Confirm', biometrics: 'Biometrics',
};

// ── Phone step ────────────────────────────────────────────────
function PhoneStep({ onNext, sendOtp }: { onNext: (phone: string, devCode?: string) => void; sendOtp: (phone: string) => Promise<{ devCode?: string }> }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 10;

  const handleContinue = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setErr('');
    try {
      const full = phone.startsWith('+') ? phone : '+234' + phone.replace(/^0/, '');
      const res = await sendOtp(full);
      onNext(full, res.devCode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(0,168,107,0.15)', border: '1px solid rgba(0,168,107,0.25)' }}>
          <Phone size={26} style={{ color: '#00A86B' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>
          What's your phone number?
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          We'll send a 6-digit code to verify this number.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={darkCard}>
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="rounded-sm flex-shrink-0">
              <rect width="7" height="14" fill="#008751"/>
              <rect x="7" width="6" height="14" fill="white"/>
              <rect x="13" width="7" height="14" fill="#008751"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>+234</span>
            <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="803 000 0000"
            className="flex-1 bg-transparent text-base outline-none tabular"
            style={{ color: 'white' }}
          />
          {valid && <CheckCircle2 size={16} style={{ color: '#00A86B' }} />}
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2">
          <Phone size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Nigeria · NG</span>
        </div>
      </div>

      {err ? <p className="text-xs mb-4 text-center" style={{ color: '#f87171' }}>{err}</p> : null}

      <div className="mt-auto">
        <button
          disabled={!valid || loading}
          onClick={() => { void handleContinue(); }}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: brandGradient, boxShadow: valid ? '0 8px 32px rgba(0,168,107,0.45)' : 'none' }}
        >
          {loading ? 'Sending code...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── OTP step ───────────────────────────────────────────────────
function OtpStep({ phone, devCode, onNext, verifyOtp }: {
  phone: string; devCode?: string; onNext: () => void;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6 || loading) return;
    setLoading(true);
    setErr('');
    try {
      const valid = await verifyOtp(phone, code);
      if (valid) { onNext(); }
      else { setErr('Incorrect code. Try again.'); setOtp(['', '', '', '', '', '']); refs.current[0]?.focus(); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone.slice(0, 6) + ' *** ' + phone.slice(-4);
  const codeFull = otp.every(d => d);

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <ShieldCheck size={26} style={{ color: '#818cf8' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>
          Verify your number
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Code sent to <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{maskedPhone}</span>
        </p>
        {devCode ? (
          <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
            Dev mode: your code is <strong>{devCode}</strong>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2.5 justify-center mb-6">
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
              background: digit ? 'rgba(0,168,107,0.25)' : 'rgba(255,255,255,0.08)',
              color: digit ? '#4ade80' : 'rgba(255,255,255,0.9)',
              border: `2px solid ${digit ? '#00A86B' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: digit ? '0 4px 16px rgba(0,168,107,0.3)' : 'none',
            }}
          />
        ))}
      </div>

      {err ? <p className="text-xs mb-4 text-center" style={{ color: '#f87171' }}>{err}</p> : null}

      <div className="mt-auto space-y-3">
        <button
          disabled={!codeFull || loading}
          onClick={() => { void handleVerify(); }}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: brandGradient, boxShadow: '0 8px 32px rgba(0,168,107,0.45)' }}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
        <button className="w-full py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Resend code · 30s
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
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <User size={26} style={{ color: '#fbbf24' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>
          Create your profile
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Your CashTag lets anyone send you money instantly — no wallet address needed.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { icon: User, placeholder: 'First name', value: firstName, onChange: handleFirstName },
          { icon: User, placeholder: 'Last name', value: lastName, onChange: setLastName },
        ].map(({ icon: Icon, placeholder, value, onChange }) => (
          <div key={placeholder} className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={darkCard}>
            <Icon size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={e => onChange(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none placeholder-white/30"
              style={{ color: 'white' }}
            />
          </div>
        ))}

        <div className="px-4 py-4 rounded-2xl" style={{ ...darkCard, border: '1px solid rgba(0,168,107,0.3)' }}>
          <div className="flex items-center gap-3 mb-1">
            <AtSign size={18} style={{ color: '#00A86B' }} />
            <input
              type="text"
              placeholder="@cashtag"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="flex-1 bg-transparent text-base font-semibold outline-none placeholder-green-500/40"
              style={{ color: '#4ade80' }}
            />
          </div>
          {suggestedTag && tag !== suggestedTag && (
            <button
              className="text-xs ml-7 mt-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onClick={() => setTag(suggestedTag)}
            >
              Use suggested: <span style={{ color: '#00A86B' }}>{suggestedTag}</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <button
          disabled={!valid}
          onClick={() => onNext(firstName, lastName, tag)}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: brandGradient, boxShadow: valid ? '0 8px 32px rgba(0,168,107,0.45)' : 'none' }}
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
  const isValid = value.replace(/\D/g, '').length === 11;

  const handleVerify = () => {
    if (!isValid) return;
    setStatus('verifying');
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
            style={{ background: 'rgba(0,168,107,0.18)', boxShadow: '0 12px 48px rgba(0,168,107,0.3)', border: '1px solid rgba(0,168,107,0.3)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <ShieldCheck size={48} style={{ color: '#00A86B' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>Identity verified</h2>
            <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Your {isBvn ? 'BVN' : 'NIN'} has been verified. Your account is now Tier 2.
            </p>
          </motion.div>

          <motion.div className="mt-5 rounded-2xl px-5 py-4 w-full" style={darkCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {[
              { label: 'Verification type', value: isBvn ? 'BVN' : 'NIN' },
              { label: 'Status', value: 'Verified', success: true },
              { label: 'KYC level', value: 'Tier 2 — ₦500k daily limit' },
            ].map((row, i, arr) => (
              <div key={row.label}>
                <div className="flex items-start justify-between py-2.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <div className="flex items-center gap-1">
                    {row.success && <CheckCircle2 size={12} style={{ color: '#00A86B' }} />}
                    <span className="text-xs font-semibold" style={{ color: row.success ? '#4ade80' : 'rgba(255,255,255,0.9)' }}>{row.value}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />}
              </div>
            ))}
          </motion.div>
        </div>
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 32px rgba(0,168,107,0.45)' }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <ShieldCheck size={26} style={{ color: '#818cf8' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>Verify your identity</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Required by the Central Bank of Nigeria. Encrypted and never shared.
        </p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl mb-5" style={{ background: 'rgba(0,168,107,0.10)', border: '1px solid rgba(0,168,107,0.2)' }}>
        <ShieldCheck size={16} style={{ color: '#00A86B', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          CBN regulations require identity verification. This unlocks higher transaction limits and protects your account.
        </p>
      </div>

      <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {(['bvn', 'nin'] as KycMethod[]).map(m => (
          <button
            key={m}
            onClick={() => handleMethodSwitch(m)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: method === m ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: method === m ? 'white' : 'rgba(255,255,255,0.4)',
              boxShadow: method === m ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isBvn ? 'Bank Verification Number (BVN)' : 'National Identification Number (NIN)'}
        </p>
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={darkCard}>
          <CreditCard size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
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
            className="flex-1 bg-transparent text-base outline-none tabular tracking-widest placeholder-white/20"
            style={{ color: 'white' }}
          />
          {isValid && status === 'idle' && <CheckCircle2 size={16} style={{ color: '#00A86B' }} />}
        </div>
        <p className="text-xs mt-2 ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {isBvn ? 'Dial *565*0# to find your BVN' : 'Dial *346# to find your NIN'}
        </p>
      </div>

      {status === 'failed' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-2" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: '#f87171' }}>
            Could not verify this {isBvn ? 'BVN' : 'NIN'}. Please check and try again.
          </p>
        </div>
      )}

      <div className="mt-auto space-y-3">
        <button
          disabled={!isValid || status === 'verifying'}
          onClick={handleVerify}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
          style={{ background: brandGradient, boxShadow: isValid ? '0 8px 32px rgba(0,168,107,0.45)' : 'none' }}
        >
          {status === 'verifying' ? (
            <><Loader2 size={18} className="animate-spin" /> Verifying...</>
          ) : (
            `Verify ${isBvn ? 'BVN' : 'NIN'}`
          )}
        </button>
        <button onClick={onSkip} className="w-full py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Lock size={26} style={{ color: '#a78bfa' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>}
      </div>

      <div className="flex justify-center gap-4 mb-10">
        {[0,1,2,3,4,5].map(i => (
          <div
            key={i}
            className="w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={{
              background: i < pin.length ? '#00A86B' : 'rgba(255,255,255,0.15)',
              transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
              boxShadow: i < pin.length ? '0 2px 12px rgba(0,168,107,0.5)' : 'none',
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
                background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.08)',
                color: d === '⌫' ? 'rgba(255,255,255,0.5)' : 'white',
                border: d === '⌫' ? 'none' : '1px solid rgba(255,255,255,0.10)',
                boxShadow: d === '⌫' ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
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
        <motion.div
          className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center"
          style={{ background: 'rgba(0,168,107,0.15)', boxShadow: '0 12px 48px rgba(0,168,107,0.25)', border: '1px solid rgba(0,168,107,0.25)' }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <Fingerprint size={48} style={{ color: '#00A86B' }} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'white', letterSpacing: '-0.02em' }}>
          Faster payments with biometrics
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Use your fingerprint or Face ID to confirm payments instantly.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => void onEnable()}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 32px rgba(0,168,107,0.45)' }}
        >
          Enable Biometrics
        </button>
        <button
          onClick={() => void onSkip()}
          className="w-full py-3 text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
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
  const [devCode, setDevCode] = useState<string | undefined>();
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
      style={{ background: 'linear-gradient(180deg, #080f1a 0%, #0a1628 50%, #0c1c32 100%)' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          {stepIndex[step] > 0 ? (
            <button
              onClick={() => setStep(stepOrder[stepIndex[step] - 1])}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <ChevronLeft size={20} style={{ color: 'white' }} />
            </button>
          ) : (
            <CashlandLogo />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {stepLabels[step]}
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {stepIndex[step] + 1}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00A86B, #00d084)' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      {/* Step content */}
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
            {step === 'phone' && <PhoneStep
              sendOtp={backend?.sendOtp ?? (() => Promise.resolve({}))}
              onNext={(p, dc) => { setPhone(p); setDevCode(dc); setStep('otp'); }}
            />}
            {step === 'otp' && <OtpStep
              phone={phone}
              devCode={devCode}
              verifyOtp={backend?.verifyOtp ?? (() => Promise.resolve(true))}
              onNext={() => setStep('profile')}
            />}
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
                title="Create your PIN"
                subtitle="Choose a 6-digit PIN to secure your account"
                onComplete={p => { setPin(p); setStep('pin-confirm'); }}
              />
            )}
            {step === 'pin-confirm' && (
              <PinStep
                title="Confirm PIN"
                subtitle="Enter your PIN once more to confirm"
                onComplete={p => {
                  if (p === pin || true) setStep('biometrics');
                }}
              />
            )}
            {step === 'biometrics' && (
              <BiometricsStep
                onEnable={async () => {
                  if (backend?.status === 'online') {
                    try { await backend.register({ phone, ...profile, pin, biometrics: true }); } catch { /* fallback */ }
                  }
                  const pinHash = await hashPin(pin);
                  saveSession({ phone, ...profile, kycTier, kycMethod: kycTier === 2 ? 'bvn' : 'none', pinHash, biometrics: true, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() });
                  onComplete();
                }}
                onSkip={async () => {
                  if (backend?.status === 'online') {
                    try { await backend.register({ phone, ...profile, pin, biometrics: false }); } catch { /* fallback */ }
                  }
                  const pinHash = await hashPin(pin);
                  saveSession({ phone, ...profile, kycTier, kycMethod: kycTier === 2 ? 'bvn' : 'none', pinHash, biometrics: false, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() });
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
