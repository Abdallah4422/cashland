import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronLeft, Clock, PlusCircle, List } from 'lucide-react';
import { glass, navyGradient, brandGradient, formatNaira } from './design';

interface Props {
  onClose: () => void;
}

type Step = 'main' | 'create' | 'review' | 'success' | 'list';

const existingSafePays = [
  { id: '1', seller: '@repairhub', description: 'iPhone screen repair', amount: 30000, status: 'awaiting' },
  { id: '2', seller: '@fashionkay', description: 'Custom dress order', amount: 45000, status: 'completed' },
];

export default function SafePayScreen({ onClose }: Props) {
  const [step, setStep] = useState<Step>('main');
  const [seller, setSeller] = useState('@repairhub');
  const [description, setDescription] = useState('iPhone screen repair');
  const [amount, setAmount] = useState('30000');

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
          {step === 'main' && (
            <div className="px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>SafePay</h2>
              </div>
              {/* Hero */}
              <div
                className="rounded-3xl p-6 mb-5 text-center"
                style={{ background: brandGradient, boxShadow: '0 12px 32px rgba(0,168,107,0.30)' }}
              >
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
                  <ShieldCheck size={32} className="text-white" />
                </div>
                <h2 className="display text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Cashland SafePay
                </h2>
                <p className="text-sm text-white/80 text-pretty">
                  Pay sellers with added protection. Your payment stays protected until the transaction is completed.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('create')}
                  className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
                  style={glass.card}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                    <PlusCircle size={22} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Create SafePay</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Start a new protected payment</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('list')}
                  className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]"
                  style={glass.card}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,108,246,0.10)' }}>
                    <List size={22} style={{ color: '#5B6CF6' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>My SafePays</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Track active and past payments</p>
                  </div>
                </button>
              </div>

              {/* How it works */}
              <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--brand-light)' }}>
                <p className="text-xs font-semibold mb-3 uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>How it works</p>
                {[
                  { step: '1', text: 'You create a SafePay and specify the seller' },
                  { step: '2', text: 'Your money is held securely by Cashland' },
                  { step: '3', text: 'Release payment when satisfied with the service' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3 mb-2 last:mb-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--brand)' }}>
                      <span className="text-xs font-bold text-white">{item.step}</span>
                    </div>
                    <p className="text-xs text-pretty" style={{ color: 'var(--subtle)' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="flex flex-col min-h-full px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('main')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Create SafePay</h2>
              </div>

              <div className="space-y-3 mb-5">
                <div className="px-4 py-3.5 rounded-2xl" style={glass.card}>
                  <p className="text-xs font-semibold mb-1.5 uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>Seller CashTag or Phone</p>
                  <input
                    type="text"
                    value={seller}
                    onChange={e => setSeller(e.target.value)}
                    placeholder="@cashtag or 080..."
                    className="w-full bg-transparent text-base font-semibold outline-none"
                    style={{ color: 'var(--brand)' }}
                  />
                </div>

                <div className="px-4 py-3.5 rounded-2xl" style={glass.card}>
                  <p className="text-xs font-semibold mb-1.5 uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>Description</p>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What are you paying for?"
                    className="w-full bg-transparent text-base outline-none"
                    style={{ color: 'var(--ink)' }}
                  />
                </div>

                <div className="px-4 py-3.5 rounded-2xl" style={glass.card}>
                  <p className="text-xs font-semibold mb-1.5 uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>Amount</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold" style={{ color: 'var(--muted)' }}>₦</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-2xl font-bold outline-none tabular"
                      style={{ color: 'var(--ink)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  disabled={!seller || !description || !amount}
                  onClick={() => setStep('review')}
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  Review SafePay
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col min-h-full px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('create')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Review SafePay</h2>
              </div>

              <div
                className="rounded-3xl p-5 mb-4"
                style={{ ...glass.card, border: '1.5px solid rgba(0,168,107,0.25)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                    <ShieldCheck size={20} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>Protected Payment</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{formatNaira(parseFloat(amount))} will be held safely</p>
                  </div>
                </div>

                {[
                  { label: 'Seller', value: seller },
                  { label: 'Description', value: description },
                  { label: 'Amount protected', value: formatNaira(parseFloat(amount)), bold: true },
                  { label: 'Cashland fee', value: '₦0' },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                      <span className="text-sm font-semibold tabular" style={{ color: row.bold ? 'var(--brand)' : 'var(--ink)' }}>{row.value}</span>
                    </div>
                    {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl px-4 py-3 mb-5" style={{ background: 'var(--brand-light)' }}>
                <p className="text-sm text-pretty" style={{ color: 'var(--subtle)' }}>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{formatNaira(parseFloat(amount))}</span> will be protected by Cashland until you release it to the seller.
                </p>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => setStep('success')}
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  Create SafePay
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center px-5 pt-8">
              <motion.div
                className="w-24 h-24 rounded-full mb-5 flex items-center justify-center"
                style={{ background: 'var(--brand-light)', boxShadow: '0 12px 40px rgba(0,168,107,0.25)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <ShieldCheck size={52} style={{ color: 'var(--brand)' }} strokeWidth={1.8} />
              </motion.div>

              <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="display text-2xl font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Money Protected</h2>
                <div className="display text-3xl font-bold tabular mb-1" style={{ color: 'var(--brand)', letterSpacing: '-0.03em' }}>
                  {formatNaira(parseFloat(amount))}
                </div>
                <p className="text-sm" style={{ color: 'var(--subtle)' }}>safely held by Cashland</p>
              </motion.div>

              <motion.div
                className="w-full rounded-2xl overflow-hidden mb-6"
                style={glass.card}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              >
                {[
                  { label: 'Seller', value: seller },
                  { label: 'Description', value: description },
                  { label: 'Amount', value: formatNaira(parseFloat(amount)), brand: true },
                  { label: 'Status', value: 'Awaiting completion', pending: true },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <span className="text-sm" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                      <div className="flex items-center gap-1.5">
                        {row.pending && <Clock size={12} style={{ color: '#D97706' }} />}
                        <span className="text-sm font-semibold" style={{ color: row.brand ? 'var(--brand)' : row.pending ? '#D97706' : 'var(--ink)' }}>
                          {row.value}
                        </span>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </motion.div>

              <button
                onClick={() => setStep('main')}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
              >
                Done
              </button>
            </div>
          )}

          {step === 'list' && (
            <div className="px-5 pt-6">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('main')} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
                </button>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>My SafePays</h2>
              </div>

              <div className="space-y-3">
                {existingSafePays.map(sp => (
                  <div key={sp.id} className="rounded-2xl p-4" style={glass.card}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-base font-semibold" style={{ color: 'var(--brand)' }}>{sp.seller}</p>
                        <p className="text-sm" style={{ color: 'var(--subtle)' }}>{sp.description}</p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: sp.status === 'completed' ? 'var(--brand-light)' : '#FEF3C7',
                          color: sp.status === 'completed' ? 'var(--brand)' : '#92400E',
                        }}
                      >
                        {sp.status === 'completed' ? 'Completed' : 'Awaiting'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="display text-lg font-bold tabular" style={{ color: 'var(--ink)' }}>
                        {formatNaira(sp.amount)}
                      </span>
                      {sp.status === 'awaiting' && (
                        <button
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: 'var(--brand)', color: 'white' }}
                        >
                          Release
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('create')}
                className="w-full mt-4 py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: navyGradient }}
              >
                Create new SafePay
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
