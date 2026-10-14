import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, AtSign, ShieldCheck, Link2, ChevronLeft, CheckCircle2, Scan, Zap, Lock, Search, MapPin, Tag, Phone, WifiOff } from 'lucide-react';
import { glass, brandGradient, formatNaira }  from './design';
import SafePayScreen from './SafePayScreen';
import { MERCHANTS, CATEGORIES, type Merchant } from './merchants';

interface Props {
  onClose: () => void;
  onOpenSend?: () => void;
  onOpenUSSD?: () => void;
}

type Step = 'main' | 'scanner' | 'catalog' | 'merchant' | 'review' | 'pin' | 'processing' | 'success' | 'safepay';

function PinModal({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 6) setTimeout(onSuccess, 400);
  };
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div className="flex flex-col min-h-full">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
          <Lock size={22} style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Enter your Cashland PIN</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Protected by Cashland Security</p>
      </div>
      <div className="flex justify-center gap-4 mb-10">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all duration-200"
            style={{ background: i < pin.length ? 'var(--brand)' : 'rgba(0,0,0,0.15)', transform: i < pin.length ? 'scale(1.1)' : 'scale(1)' }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
        {digits.map((d, i) => (
          d === '' ? <div key={i} /> : (
            <button key={i} onClick={() => d === '⌫' ? setPin(p => p.slice(0, -1)) : handleDigit(d)}
              className="h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 flex items-center justify-center"
              style={{ background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.75)', color: 'var(--ink)', border: d === '⌫' ? 'none' : '1px solid rgba(255,255,255,0.80)', boxShadow: d === '⌫' ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}>
              {d}
            </button>
          )
        ))}
      </div>
    </div>
  );
}

// ── Merchant catalog ───────────────────────────────────────────
function MerchantCatalog({ onSelect, onBack }: { onSelect: (m: Merchant) => void; onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = MERCHANTS.filter(m => {
    const matchesQuery = query === '' || m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === 'All' || m.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="flex flex-col min-h-full px-5 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Choose Merchant</h2>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4" style={glass.card}>
        <Search size={16} style={{ color: 'var(--muted)' }} />
        <input
          type="text"
          placeholder="Search merchants..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all active:scale-95"
            style={{
              background: activeCategory === cat ? 'var(--brand)' : 'rgba(255,255,255,0.75)',
              color: activeCategory === cat ? 'white' : 'var(--subtle)',
              border: `1px solid ${activeCategory === cat ? 'var(--brand)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Merchant list */}
      <div className="rounded-2xl overflow-hidden" style={glass.card}>
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No merchants found</p>
          </div>
        ) : (
          filtered.map((m, i) => (
            <div key={m.id}>
              <button
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: m.color }}>
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{m.name}</p>
                    {m.verified && <CheckCircle2 size={12} style={{ color: 'var(--brand)' }} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Tag size={10} style={{ color: 'var(--muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{m.category}</span>
                    <span className="text-xs" style={{ color: 'rgba(0,0,0,0.20)' }}>·</span>
                    <MapPin size={10} style={{ color: 'var(--muted)' }} />
                    <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>{m.location}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{formatNaira(m.amount)}</p>
                </div>
              </button>
              {i < filtered.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Merchant detail card ───────────────────────────────────────
function MerchantCard({ merchant, onPay, onBack }: { merchant: Merchant; onPay: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col min-h-full px-5 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Merchant</h2>
      </div>

      <div className="rounded-3xl p-5 mb-5" style={glass.card}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white" style={{ background: merchant.color, fontSize: 18 }}>
            {merchant.initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold" style={{ color: 'var(--ink)' }}>{merchant.name}</p>
              {merchant.verified && <CheckCircle2 size={15} style={{ color: 'var(--brand)' }} />}
            </div>
            <p className="text-xs" style={{ color: 'var(--brand)' }}>
              {merchant.verified ? 'Verified merchant' : 'Unverified'} · {merchant.category}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} style={{ color: 'var(--muted)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{merchant.location}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: 'var(--subtle)' }}>Amount</span>
            <span className="display text-2xl font-bold tabular" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(merchant.amount)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: 'var(--subtle)' }}>Description</span>
            <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{merchant.description}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--subtle)' }}>CashTag</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{merchant.tag}</span>
          </div>
        </div>
      </div>

      {/* Cashland protection badge */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5" style={{ background: 'var(--brand-light)' }}>
        <ShieldCheck size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          This merchant is verified by Cashland. Your payment is protected.
        </p>
      </div>

      <div className="mt-auto">
        <button
          onClick={onPay}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          Pay {formatNaira(merchant.amount)}
        </button>
      </div>
    </div>
  );
}

export default function PayScreen({ onClose: _onClose, onOpenSend, onOpenUSSD }: Props) {
  const [step, setStep] = useState<Step>('main');
  const [activeMerchant, setActiveMerchant] = useState<Merchant>(MERCHANTS[0]);
  const [payRef] = useState(() => 'CL-' + Math.random().toString(36).slice(2, 10).toUpperCase());

  const handleSelectMerchant = (m: Merchant) => {
    setActiveMerchant(m);
    setStep('merchant');
  };

  const handleProcessing = () => {
    setStep('processing');
    setTimeout(() => setStep('success'), 2200);
  };

  const mainOptions = [
    { icon: AtSign, label: 'Send to CashTag', subtitle: 'Pay with @cashtag or phone number', onClick: () => onOpenSend?.() },
    { icon: ShieldCheck, label: 'SafePay', subtitle: 'Pay with buyer protection', onClick: () => setStep('safepay') },
    { icon: Link2, label: 'Payment Link', subtitle: 'Pay using a payment link', onClick: () => {} },
  ];

  return (
    <div className="flex flex-col min-h-full pb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Main ── */}
          {step === 'main' && (
            <div className="px-5 pt-6">
              <h2 className="display text-xl font-bold mb-6" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Pay</h2>

              {/* Primary QR */}
              <button
                onClick={() => setStep('scanner')}
                className="w-full rounded-3xl p-5 mb-3 flex flex-col items-center text-center transition-all active:scale-[0.98]"
                style={{ background: brandGradient, boxShadow: '0 12px 32px rgba(0,168,107,0.35)' }}
              >
                <div className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
                  <QrCode size={32} className="text-white" />
                </div>
                <p className="display text-lg font-bold text-white">Scan QR Code</p>
                <p className="text-sm text-white/70 mt-1">Point your camera at any Cashland QR code</p>
              </button>

              {/* Secondary options */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {mainOptions.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.label}
                      onClick={opt.onClick}
                      className="rounded-2xl p-3.5 flex flex-col gap-2 text-left transition-all active:scale-[0.98]"
                      style={glass.card}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                        <Icon size={18} style={{ color: 'var(--brand)' }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight" style={{ color: 'var(--ink)' }}>{opt.label}</p>
                        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--muted)' }}>{opt.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* USSD offline banner */}
              <button
                onClick={onOpenUSSD}
                className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                style={{ background: '#1a1a2e', boxShadow: '0 4px 16px rgba(26,26,46,0.2)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <Phone size={20} style={{ color: 'white' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">No internet? Use USSD</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Dial *7379# on any phone, any network</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <WifiOff size={11} style={{ color: '#F59E0B' }} />
                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Offline</span>
                </div>
              </button>

              {/* Quick merchant tiles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Pay a Merchant</p>
                  <button className="text-xs font-medium" style={{ color: 'var(--brand)' }} onClick={() => setStep('catalog')}>See all</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {MERCHANTS.slice(0, 4).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMerchant(m)}
                      className="flex flex-col items-center gap-1.5 transition-all active:scale-95"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-sm" style={{ background: m.color, boxShadow: `0 4px 12px ${m.color}40` }}>
                        {m.initials}
                      </div>
                      <span className="text-xs font-medium text-center leading-tight" style={{ color: 'var(--ink)' }}>{m.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {MERCHANTS.slice(4, 8).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMerchant(m)}
                      className="flex flex-col items-center gap-1.5 transition-all active:scale-95"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-sm" style={{ background: m.color, boxShadow: `0 4px 12px ${m.color}40` }}>
                        {m.initials}
                      </div>
                      <span className="text-xs font-medium text-center leading-tight" style={{ color: 'var(--ink)' }}>{m.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── QR Scanner ── */}
          {step === 'scanner' && (
            <div className="flex flex-col min-h-full px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('main')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Scan QR Code</h2>
              </div>

              <div className="relative rounded-3xl overflow-hidden mb-4 flex items-center justify-center" style={{ height: 260, background: '#0D1B12' }}>
                {[['top-4 left-4', 'border-t-2 border-l-2'], ['top-4 right-4', 'border-t-2 border-r-2'],
                  ['bottom-4 left-4', 'border-b-2 border-l-2'], ['bottom-4 right-4', 'border-b-2 border-r-2']].map(([pos, cls], i) => (
                  <div key={i} className={`absolute w-8 h-8 ${pos} ${cls}`} style={{ borderColor: '#00A86B' }} />
                ))}
                <motion.div
                  className="absolute left-8 right-8 h-0.5"
                  style={{ background: 'linear-gradient(90deg, transparent, #00A86B, transparent)' }}
                  animate={{ top: ['15%', '85%', '15%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="text-center">
                  <Scan size={44} style={{ color: 'rgba(255,255,255,0.25)', margin: '0 auto 8px' }} />
                  <p className="text-white/40 text-sm">Scanning...</p>
                </div>
              </div>

              {/* Demo QR options — one per merchant */}
              <p className="text-xs font-semibold mb-3 uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Try a demo QR</p>
              <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {MERCHANTS.slice(0, 6).map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMerchant(m); setStep('merchant'); }}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 px-3 py-3 rounded-2xl transition-all active:scale-95"
                    style={glass.card}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs" style={{ background: m.color }}>
                      {m.initials}
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{m.name.split(' ')[0]}</span>
                    <span className="text-xs tabular" style={{ color: 'var(--brand)' }}>{formatNaira(m.amount)}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => { setActiveMerchant(MERCHANTS[0]); setStep('merchant'); }}
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  <Zap size={18} /> Use demo QR
                </button>
              </div>
            </div>
          )}

          {/* ── Full merchant catalog ── */}
          {step === 'catalog' && (
            <MerchantCatalog
              onSelect={handleSelectMerchant}
              onBack={() => setStep('main')}
            />
          )}

          {/* ── Merchant detail ── */}
          {step === 'merchant' && (
            <MerchantCard
              merchant={activeMerchant}
              onPay={() => setStep('review')}
              onBack={() => setStep('scanner')}
            />
          )}

          {/* ── Review ── */}
          {step === 'review' && (
            <div className="flex flex-col min-h-full px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('merchant')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Review Payment</h2>
              </div>

              {/* Merchant mini card */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4" style={{ background: 'var(--brand-light)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{ background: activeMerchant.color }}>
                  {activeMerchant.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{activeMerchant.name}</p>
                    {activeMerchant.verified && <CheckCircle2 size={12} style={{ color: 'var(--brand)' }} />}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>{activeMerchant.location}</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden mb-4" style={glass.card}>
                {[
                  { label: 'Merchant', value: activeMerchant.name },
                  { label: 'Description', value: activeMerchant.description },
                  { label: 'Amount', value: formatNaira(activeMerchant.amount), bold: true },
                  { label: 'Cashland fee', value: '₦0' },
                  { label: 'Network fee', value: '₦0' },
                  { label: 'Total', value: formatNaira(activeMerchant.amount), brand: true, bold: true },
                  { label: 'Payment method', value: 'Cashland Balance' },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                      <span className="text-sm font-semibold tabular" style={{ color: row.brand ? 'var(--brand)' : row.bold ? 'var(--ink)' : 'var(--subtle)' }}>
                        {row.value}
                      </span>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => setStep('pin')}
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  Pay {formatNaira(activeMerchant.amount)}
                </button>
              </div>
            </div>
          )}

          {/* ── PIN ── */}
          {step === 'pin' && (
            <div className="px-5 pt-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('review')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
              </div>
              <PinModal onSuccess={handleProcessing} />
            </div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5">
              <motion.div
                className="w-20 h-20 rounded-full mb-6 flex items-center justify-center"
                style={{ background: 'var(--brand-light)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <motion.div className="w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
              </motion.div>
              <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>Processing payment...</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--subtle)' }}>Confirming with {activeMerchant.name}</p>
            </div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center px-5 pt-8">
              <motion.div
                className="w-24 h-24 rounded-full mb-5 flex items-center justify-center"
                style={{ background: 'var(--brand-light)', boxShadow: '0 12px 40px rgba(0,168,107,0.25)' }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <CheckCircle2 size={52} style={{ color: 'var(--brand)' }} strokeWidth={1.8} />
              </motion.div>
              <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Payment Successful</h2>
                <div className="display text-3xl font-bold tabular mb-1" style={{ color: 'var(--brand)', letterSpacing: '-0.03em' }}>{formatNaira(activeMerchant.amount)}</div>
                <p className="text-sm" style={{ color: 'var(--subtle)' }}>paid to {activeMerchant.name}</p>
              </motion.div>

              <motion.div className="w-full rounded-2xl overflow-hidden mb-6" style={glass.card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {[
                  { label: 'Merchant', value: activeMerchant.name },
                  { label: 'Reference', value: payRef, mono: true },
                  { label: 'Status', value: 'Successful', success: true },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                      <div className="flex items-center gap-1.5">
                        {row.success && <CheckCircle2 size={12} style={{ color: 'var(--brand)' }} />}
                        <span className={`text-sm font-semibold ${row.mono ? 'mono text-xs' : ''}`} style={{ color: row.success ? 'var(--brand)' : 'var(--ink)' }}>{row.value}</span>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </motion.div>

              <motion.div className="w-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <button onClick={() => setStep('main')} className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
                  Done
                </button>
              </motion.div>
            </div>
          )}

          {/* ── SafePay ── */}
          {step === 'safepay' && (
            <SafePayScreen onClose={() => setStep('main')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
