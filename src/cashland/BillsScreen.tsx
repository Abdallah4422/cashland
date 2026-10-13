import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Smartphone, Zap, Tv, Droplets,
  Wifi, ShoppingBag, GraduationCap, CheckCircle2, Loader2, Lock, ShieldCheck,
} from 'lucide-react';
import { glass, formatNaira } from './design';

interface Props { onClose: () => void; }

// ---- Bill categories ----
const CATEGORIES = [
  { id: 'airtime', label: 'Airtime', icon: Smartphone, color: '#00A86B', bg: '#E6F7F1' },
  { id: 'data', label: 'Data', icon: Wifi, color: '#5B6CF6', bg: '#EEF0FE' },
  { id: 'electricity', label: 'Electricity', icon: Zap, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'tv', label: 'TV / Cable', icon: Tv, color: '#EC4899', bg: '#FCE7F3' },
  { id: 'water', label: 'Water', icon: Droplets, color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'shopping', label: 'Vouchers', icon: ShoppingBag, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#D97706', bg: '#FEF3C7' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: '#14B8A6', bg: '#CCFBF1' },
];

// Airtime providers
const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFCC00', textColor: '#1a1a1a' },
  { id: 'airtel', name: 'Airtel', color: '#E4002B', textColor: 'white' },
  { id: 'glo', name: 'Glo', color: '#008751', textColor: 'white' },
  { id: '9mobile', name: '9mobile', color: '#006400', textColor: 'white' },
];

// Data plans
const DATA_PLANS: Record<string, { label: string; price: number; validity: string }[]> = {
  mtn: [
    { label: '100MB', price: 100, validity: '24 hrs' },
    { label: '1GB', price: 350, validity: '30 days' },
    { label: '2GB', price: 600, validity: '30 days' },
    { label: '5GB', price: 1500, validity: '30 days' },
    { label: '10GB', price: 2500, validity: '30 days' },
    { label: '20GB', price: 4000, validity: '30 days' },
  ],
  airtel: [
    { label: '200MB', price: 200, validity: '3 days' },
    { label: '1.5GB', price: 500, validity: '30 days' },
    { label: '3GB', price: 1000, validity: '30 days' },
    { label: '6GB', price: 1500, validity: '30 days' },
    { label: '10GB', price: 2500, validity: '30 days' },
    { label: '15GB', price: 3500, validity: '30 days' },
  ],
  glo: [
    { label: '1GB', price: 300, validity: '30 days' },
    { label: '2.5GB', price: 500, validity: '30 days' },
    { label: '5GB', price: 1000, validity: '30 days' },
    { label: '10GB', price: 2000, validity: '30 days' },
    { label: '18GB', price: 3000, validity: '30 days' },
    { label: '29.5GB', price: 5000, validity: '30 days' },
  ],
  '9mobile': [
    { label: '500MB', price: 200, validity: '30 days' },
    { label: '1.5GB', price: 500, validity: '30 days' },
    { label: '4GB', price: 1000, validity: '30 days' },
    { label: '11.5GB', price: 2000, validity: '30 days' },
    { label: '22.5GB', price: 3500, validity: '30 days' },
    { label: '30GB', price: 5000, validity: '30 days' },
  ],
};

// Electricity discos
const DISCOS = [
  { id: 'ekedc', name: 'EKEDC (Eko)', area: 'Lagos Island / Mainland' },
  { id: 'ikedc', name: 'IKEDC (Ikeja)', area: 'Ikeja, Lagos' },
  { id: 'aedc', name: 'AEDC (Abuja)', area: 'FCT Abuja' },
  { id: 'phedc', name: 'PHEDC (Port Harcourt)', area: 'Rivers, Bayelsa' },
  { id: 'kedco', name: 'KEDCO (Kano)', area: 'Kano, Jigawa, Katsina' },
  { id: 'ibedc', name: 'IBEDC (Ibadan)', area: 'Oyo, Osun, Ondo, Ekiti' },
  { id: 'eedc', name: 'EEDC (Enugu)', area: 'Enugu, Anambra, Imo' },
  { id: 'bedc', name: 'BEDC (Benin)', area: 'Edo, Delta, Ondo part' },
];

// TV providers
const TV_PROVIDERS = [
  { id: 'dstv', name: 'DStv', plans: [
    { label: 'Padi', price: 2950 },
    { label: 'Yanga', price: 4150 },
    { label: 'Confam', price: 6200 },
    { label: 'Compact', price: 10500 },
    { label: 'Compact+', price: 16600 },
    { label: 'Premium', price: 24500 },
  ]},
  { id: 'gotv', name: 'GOtv', plans: [
    { label: 'Smallie', price: 1575 },
    { label: 'Jinja', price: 2715 },
    { label: 'Jolli', price: 3960 },
    { label: 'Max', price: 5700 },
    { label: 'Supa', price: 9600 },
  ]},
  { id: 'startimes', name: 'StarTimes', plans: [
    { label: 'Nova', price: 1300 },
    { label: 'Basic', price: 2000 },
    { label: 'Smart', price: 2800 },
    { label: 'Classic', price: 3300 },
    { label: 'Super', price: 4900 },
  ]},
];

// ---- Success screen ----
function BillSuccess({
  title, detail, amount, txRef, onDone,
}: { title: string; detail: string; amount: number; txRef: string; onDone: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #00A86B20, #00A86B40)' }}>
        <CheckCircle2 size={44} style={{ color: 'var(--brand)' }} />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
        Payment Successful
      </motion.p>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-sm mb-6 text-center" style={{ color: 'var(--muted)' }}>{detail}</motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="w-full rounded-2xl overflow-hidden mb-6" style={glass.card}>
        {[
          { label: 'Service', value: title },
          { label: 'Amount', value: formatNaira(amount) },
          { label: 'Reference', value: txRef },
          { label: 'Status', value: 'Successful' },
        ].map(({ label, value }, i, arr) => (
          <div key={label}>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: label === 'Status' ? 'var(--brand)' : 'var(--ink)' }}>{value}</span>
            </div>
            {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
          </div>
        ))}
      </motion.div>
      <motion.button onClick={onDone} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full h-14 rounded-2xl font-bold text-white" style={{ background: 'var(--brand)' }}
        whileTap={{ scale: 0.97 }}>
        Done
      </motion.button>
    </div>
  );
}

// ---- PIN modal ----
function PinModal({ label, onConfirm, onBack }: { label: string; onConfirm: () => void; onBack: () => void }) {
  const [pin, setPin] = useState('');
  const handleKey = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 6) {
      const next = pin + k;
      setPin(next);
      if (next.length === 6) setTimeout(onConfirm, 300);
    }
  };
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Confirm payment</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--brand-light)' }}>
          <Lock size={28} style={{ color: 'var(--brand)' }} />
        </div>
        <p className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Enter your PIN</p>
        <p className="text-sm mb-8 text-center" style={{ color: 'var(--muted)' }}>{label}</p>
        <div className="flex gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} className="w-4 h-4 rounded-full border-2"
              style={{ borderColor: 'var(--brand)', background: pin.length > i ? 'var(--brand)' : 'transparent' }}
              animate={{ scale: pin.length === i + 1 ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.15 }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k => (
            <button key={k} onClick={() => k && handleKey(k)} disabled={!k}
              className="h-14 rounded-2xl flex items-center justify-center text-xl font-semibold transition-all active:scale-90"
              style={{ background: k ? 'rgba(255,255,255,0.9)' : 'transparent', color: 'var(--ink)', boxShadow: k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
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

// ---- Processing screen ----
function Processing({ message }: { message: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8"
      style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="mb-6">
        <Loader2 size={48} style={{ color: 'var(--brand)' }} />
      </motion.div>
      <p className="display text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Processing...</p>
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>{message}</p>
    </div>
  );
}

// ---- AIRTIME flow ----
function AirtimeFlow({ onClose }: { onClose: () => void }) {
  type S = 'network' | 'details' | 'pin' | 'processing' | 'success';
  const [step, setStep] = useState<S>('network');
  const [network, setNetwork] = useState<typeof NETWORKS[0] | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [txRef] = useState(() => 'CL-AIR-' + Math.random().toString(36).slice(2, 8).toUpperCase());
  const chips = [100, 200, 500, 1000, 2000, 5000];
  const parsedAmount = parseFloat(amount) || 0;

  const handleSuccess = () => {
    setTimeout(() => setStep('success'), 2200);
    setStep('processing');
  };

  if (step === 'success') return <BillSuccess title="Airtime Recharge" detail={`${formatNaira(parsedAmount)} airtime sent to ${phone}`} amount={parsedAmount} txRef={txRef} onDone={onClose} />;
  if (step === 'processing') return <Processing message={`Sending ${formatNaira(parsedAmount)} airtime to ${phone}...`} />;
  if (step === 'pin') return <PinModal label={`Pay ${formatNaira(parsedAmount)} airtime to ${phone}`} onConfirm={handleSuccess} onBack={() => setStep('details')} />;

  if (step === 'details') return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('network')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Buy Airtime</span>
      </div>
      <div className="flex-1 px-5 pb-8">
        {network && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-2xl" style={{ background: network.color + '15', border: `1px solid ${network.color}30` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: network.color, color: network.textColor }}>{network.name[0]}</div>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{network.name}</span>
            <button onClick={() => setStep('network')} className="ml-auto text-xs" style={{ color: 'var(--brand)' }}>Change</button>
          </div>
        )}
        <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Phone number</p>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="0803 000 0000"
          className="w-full px-4 py-3.5 rounded-2xl text-base outline-none mb-5"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.2)' }} />
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Amount</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {chips.map(c => (
            <button key={c} onClick={() => setAmount(String(c))}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: parsedAmount === c ? 'var(--brand)' : 'rgba(0,168,107,0.1)', color: parsedAmount === c ? 'white' : 'var(--brand)' }}>
              {formatNaira(c)}
            </button>
          ))}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Or enter custom amount"
          className="w-full px-4 py-3.5 rounded-2xl text-base outline-none mb-6"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.15)' }} />
        <motion.button onClick={() => setStep('pin')} disabled={!parsedAmount || phone.length < 11}
          className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          Continue
        </motion.button>
      </div>
    </div>
  );

  // network select
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Buy Airtime</span>
      </div>
      <div className="px-5">
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Select network</p>
        <div className="grid grid-cols-2 gap-3">
          {NETWORKS.map(n => (
            <motion.button key={n.id} onClick={() => { setNetwork(n); setStep('details'); }}
              className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95"
              style={glass.card} whileTap={{ scale: 0.97 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: n.color, color: n.textColor }}>{n.name[0]}</div>
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>{n.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- DATA flow ----
function DataFlow({ onClose }: { onClose: () => void }) {
  type S = 'network' | 'plan' | 'phone' | 'pin' | 'processing' | 'success';
  const [step, setStep] = useState<S>('network');
  const [network, setNetwork] = useState<typeof NETWORKS[0] | null>(null);
  const [plan, setPlan] = useState<{ label: string; price: number; validity: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [txRef] = useState(() => 'CL-DATA-' + Math.random().toString(36).slice(2, 8).toUpperCase());

  const handleSuccess = () => { setTimeout(() => setStep('success'), 2200); setStep('processing'); };

  if (step === 'success') return <BillSuccess title="Data Bundle" detail={`${plan?.label} data sent to ${phone}`} amount={plan?.price ?? 0} txRef={txRef} onDone={onClose} />;
  if (step === 'processing') return <Processing message={`Activating ${plan?.label} data for ${phone}...`} />;
  if (step === 'pin') return <PinModal label={`Pay ${formatNaira(plan?.price ?? 0)} for ${plan?.label} data`} onConfirm={handleSuccess} onBack={() => setStep('phone')} />;

  if (step === 'phone') return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('plan')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Phone number</span>
      </div>
      <div className="px-5 flex-1">
        {plan && network && (
          <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: network.color + '12', border: `1px solid ${network.color}25` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: network.color, color: network.textColor }}>{network.name[0]}</div>
            <div><p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{network.name} · {plan.label}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatNaira(plan.price)} · Valid {plan.validity}</p></div>
          </div>
        )}
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="Enter phone number"
          className="w-full px-4 py-4 rounded-2xl text-lg outline-none mb-6"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.2)' }} />
        <motion.button onClick={() => setStep('pin')} disabled={phone.length < 11}
          className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          Continue
        </motion.button>
      </div>
    </div>
  );

  if (step === 'plan' && network) return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('network')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>{network.name} Data Plans</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {(DATA_PLANS[network.id] ?? []).map(p => (
            <motion.button key={p.label} onClick={() => { setPlan(p); setStep('phone'); }}
              className="rounded-2xl p-4 text-left transition-all" style={glass.card} whileTap={{ scale: 0.97 }}>
              <p className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>{p.label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{formatNaira(p.price)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{p.validity}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  // network select
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Buy Data</span>
      </div>
      <div className="px-5">
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Select network</p>
        <div className="grid grid-cols-2 gap-3">
          {NETWORKS.map(n => (
            <motion.button key={n.id} onClick={() => { setNetwork(n); setStep('plan'); }}
              className="rounded-2xl p-4 flex items-center gap-3" style={glass.card} whileTap={{ scale: 0.97 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: n.color, color: n.textColor }}>{n.name[0]}</div>
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>{n.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- ELECTRICITY flow ----
function ElectricityFlow({ onClose }: { onClose: () => void }) {
  type S = 'disco' | 'meter' | 'amount' | 'pin' | 'processing' | 'success';
  const [step, setStep] = useState<S>('disco');
  const [disco, setDisco] = useState<typeof DISCOS[0] | null>(null);
  const [meter, setMeter] = useState('');
  const [meterName, setMeterName] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [resolving, setResolving] = useState(false);
  const [txRef] = useState(() => 'CL-ELC-' + Math.random().toString(36).slice(2, 8).toUpperCase());
  const chips = [1000, 2000, 5000, 10000, 20000];
  const parsedAmount = parseFloat(amount) || 0;

  const handleMeterEntry = () => {
    setResolving(true);
    setTimeout(() => { setMeterName('Musa Ibrahim'); setResolving(false); setStep('amount'); }, 1500);
  };

  const handleSuccess = () => { setTimeout(() => setStep('success'), 2200); setStep('processing'); };

  if (step === 'success') return <BillSuccess title={`${disco?.name} Electricity`} detail={`Token sent for meter ${meter}. Check your SMS.`} amount={parsedAmount} txRef={txRef} onDone={onClose} />;
  if (step === 'processing') return <Processing message="Generating electricity token..." />;
  if (step === 'pin') return <PinModal label={`Pay ${formatNaira(parsedAmount)} electricity`} onConfirm={handleSuccess} onBack={() => setStep('amount')} />;

  if (step === 'amount') return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('meter')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Enter amount</span>
      </div>
      <div className="px-5 flex-1 pb-8">
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Zap size={18} style={{ color: '#F59E0B' }} />
          <div><p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{meterName}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{disco?.name} · Meter {meter} · {meterType}</p></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {chips.map(c => (
            <button key={c} onClick={() => setAmount(String(c))}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: parsedAmount === c ? 'var(--brand)' : 'rgba(0,168,107,0.1)', color: parsedAmount === c ? 'white' : 'var(--brand)' }}>
              {formatNaira(c)}
            </button>
          ))}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Or enter amount"
          className="w-full px-4 py-3.5 rounded-2xl outline-none mb-6"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.15)' }} />
        <motion.button onClick={() => setStep('pin')} disabled={!parsedAmount}
          className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          Continue
        </motion.button>
      </div>
    </div>
  );

  if (step === 'meter') return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('disco')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Meter details</span>
      </div>
      <div className="px-5 flex-1 pb-8">
        <div className="flex gap-2 mb-5">
          {(['prepaid', 'postpaid'] as const).map(t => (
            <button key={t} onClick={() => setMeterType(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize"
              style={{ background: meterType === t ? 'var(--brand)' : 'rgba(0,0,0,0.05)', color: meterType === t ? 'white' : 'var(--muted)' }}>
              {t}
            </button>
          ))}
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Meter number</p>
        <input type="tel" value={meter} onChange={e => setMeter(e.target.value.replace(/\D/g, '').slice(0, 13))}
          placeholder="Enter meter number"
          className="w-full px-4 py-4 rounded-2xl text-lg outline-none mb-6"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.2)' }} />
        <motion.button onClick={handleMeterEntry} disabled={meter.length < 11 || resolving}
          className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          {resolving ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Continue'}
        </motion.button>
      </div>
    </div>
  );

  // disco select
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Electricity</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Select your electricity provider</p>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {DISCOS.map((d, i) => (
            <div key={d.id}>
              <motion.button onClick={() => { setDisco(d); setStep('meter'); }}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
                whileTap={{ scale: 0.98 }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{d.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{d.area}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
              </motion.button>
              {i < DISCOS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- TV / CABLE flow ----
function TvFlow({ onClose }: { onClose: () => void }) {
  type S = 'provider' | 'plan' | 'smartcard' | 'pin' | 'processing' | 'success';
  const [step, setStep] = useState<S>('provider');
  const [provider, setProvider] = useState<typeof TV_PROVIDERS[0] | null>(null);
  const [plan, setPlan] = useState<{ label: string; price: number } | null>(null);
  const [smartcard, setSmartcard] = useState('');
  const [txRef] = useState(() => 'CL-TV-' + Math.random().toString(36).slice(2, 8).toUpperCase());

  const handleSuccess = () => { setTimeout(() => setStep('success'), 2200); setStep('processing'); };

  if (step === 'success') return <BillSuccess title={`${provider?.name} Subscription`} detail={`${plan?.label} plan activated for smartcard ${smartcard}`} amount={plan?.price ?? 0} txRef={txRef} onDone={onClose} />;
  if (step === 'processing') return <Processing message={`Renewing ${provider?.name} subscription...`} />;
  if (step === 'pin') return <PinModal label={`Pay ${formatNaira(plan?.price ?? 0)} for ${provider?.name} ${plan?.label}`} onConfirm={handleSuccess} onBack={() => setStep('smartcard')} />;

  if (step === 'smartcard') return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('plan')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Smartcard number</span>
      </div>
      <div className="px-5 flex-1 pb-8">
        {plan && provider && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.15)' }}>
            <Tv size={18} style={{ color: '#EC4899' }} />
            <div><p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{provider.name} {plan.label}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatNaira(plan.price)}</p></div>
          </div>
        )}
        <input type="tel" value={smartcard} onChange={e => setSmartcard(e.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="Enter smartcard number"
          className="w-full px-4 py-4 rounded-2xl text-lg outline-none mb-6"
          style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.2)' }} />
        <motion.button onClick={() => setStep('pin')} disabled={smartcard.length < 10}
          className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          Continue
        </motion.button>
      </div>
    </div>
  );

  if (step === 'plan' && provider) return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setStep('provider')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>{provider.name} Plans</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {provider.plans.map((p, i) => (
            <div key={p.label}>
              <motion.button onClick={() => { setPlan(p); setStep('smartcard'); }}
                className="w-full flex items-center justify-between px-4 py-4" whileTap={{ scale: 0.98 }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{formatNaira(p.price)}</span>
                  <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                </div>
              </motion.button>
              {i < provider.plans.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // provider select
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--ink)' }}>TV / Cable</span>
      </div>
      <div className="px-5">
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Select provider</p>
        <div className="grid grid-cols-3 gap-3">
          {TV_PROVIDERS.map(p => (
            <motion.button key={p.id} onClick={() => { setProvider(p); setStep('plan'); }}
              className="rounded-2xl p-4 flex flex-col items-center gap-2" style={glass.card} whileTap={{ scale: 0.97 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.12)' }}>
                <Tv size={18} style={{ color: '#EC4899' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- MAIN BILLS SCREEN ----
export default function BillsScreen({ onClose }: Props) {
  const [active, setActive] = useState<string | null>(null);

  if (active === 'airtime') return <AirtimeFlow onClose={() => setActive(null)} />;
  if (active === 'data') return <DataFlow onClose={() => setActive(null)} />;
  if (active === 'electricity') return <ElectricityFlow onClose={() => setActive(null)} />;
  if (active === 'tv') return <TvFlow onClose={() => setActive(null)} />;

  // Coming soon for other categories
  if (active) return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => setActive(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <span className="text-base font-semibold capitalize" style={{ color: 'var(--ink)' }}>{active}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--brand-light)' }}>
          <Zap size={28} style={{ color: 'var(--brand)' }} />
        </div>
        <p className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--ink)' }}>Coming soon</p>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>This service will be available shortly.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Pay Bills</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Airtime, data, utilities and more</p>
        </div>
      </div>

      {/* Category grid */}
      <div className="px-5 pb-8">
        <div className="grid grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className="flex flex-col items-center gap-2 transition-all"
                whileTap={{ scale: 0.93 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: cat.bg, boxShadow: `0 4px 12px ${cat.color}25` }}>
                  <Icon size={22} style={{ color: cat.color }} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--ink)' }}>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Featured: Airtime quick buy */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Quick Buy Airtime</h3>
          <div className="grid grid-cols-2 gap-3">
            {NETWORKS.map(n => (
              <motion.button key={n.id} onClick={() => setActive('airtime')}
                className="rounded-2xl p-4 flex items-center gap-3" style={glass.card}
                whileTap={{ scale: 0.97 }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: n.color, color: n.textColor }}>
                  {n.name[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{n.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Top up</p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--muted)' }} className="ml-auto" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent bills */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Recent Payments</h3>
          <div className="rounded-2xl overflow-hidden" style={glass.card}>
            {[
              { label: 'MTN Airtime', sub: '0803 *** 4567', amount: 500, icon: Smartphone, color: '#FFCC00' },
              { label: 'IKEDC Electricity', sub: 'Meter 12345678901', amount: 5000, icon: Zap, color: '#F59E0B' },
              { label: 'DStv Compact', sub: 'Smartcard 7001234567', amount: 10500, icon: Tv, color: '#EC4899' },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.color + '20' }}>
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.sub}</p>
                    </div>
                    <span className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>-{formatNaira(item.amount)}</span>
                  </div>
                  {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
