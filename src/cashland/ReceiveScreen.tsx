import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Copy, Check, QrCode, Download, AlertTriangle } from 'lucide-react';
import { glass, brandGradient, formatNaira } from './design';
import { Avatar } from './HomeScreen';

interface Props {
  onClose: () => void;
}

type Tab = 'cashtag' | 'qr' | 'address';

// Minimal QR code SVG (placeholder pattern)
function QrCodeSvg({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={{ imageRendering: 'pixelated' }}>
      {/* Corner squares */}
      <rect x="10" y="10" width="60" height="60" rx="8" fill="#0D1B12" />
      <rect x="20" y="20" width="40" height="40" rx="4" fill="white" />
      <rect x="28" y="28" width="24" height="24" rx="2" fill="#0D1B12" />

      <rect x="130" y="10" width="60" height="60" rx="8" fill="#0D1B12" />
      <rect x="140" y="20" width="40" height="40" rx="4" fill="white" />
      <rect x="148" y="28" width="24" height="24" rx="2" fill="#0D1B12" />

      <rect x="10" y="130" width="60" height="60" rx="8" fill="#0D1B12" />
      <rect x="20" y="140" width="40" height="40" rx="4" fill="white" />
      <rect x="28" y="148" width="24" height="24" rx="2" fill="#0D1B12" />

      {/* Data dots */}
      {[80,90,100,110].map(x => [80,90,100,110].map(y => (
        Math.sin(x * 0.3 + y * 0.7) > 0.1 ? (
          <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="#0D1B12" />
        ) : null
      )))}
      {[80,100,120,140,160].map(x => [80,90,100,110,120,130,140,150,160,170].map(y => (
        Math.cos(x * 0.4 + y * 0.5) > 0.15 ? (
          <rect key={`d-${x}-${y}`} x={x} y={y} width="7" height="7" rx="1" fill="#0D1B12" opacity="0.85" />
        ) : null
      )))}

      {/* Center logo */}
      <rect x="84" y="84" width="32" height="32" rx="8" fill="white" />
      <rect x="86" y="86" width="28" height="28" rx="6" fill="#00A86B" />
      <text x="100" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">₦</text>
    </svg>
  );
}

export default function ReceiveScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('cashtag');
  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [showAmountInput, setShowAmountInput] = useState(false);

  const handleCopy = (_text: string) => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cashtag', label: 'Cashland' },
    { id: 'qr', label: 'QR Code' },
    { id: 'address', label: 'Wallet Address' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <h1 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Receive Money</h1>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)' }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? brandGradient : 'transparent',
                color: tab === t.id ? 'white' : 'var(--subtle)',
                boxShadow: tab === t.id ? '0 4px 12px rgba(0,168,107,0.30)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Cashland Tab */}
            {tab === 'cashtag' && (
              <div className="flex flex-col items-center">
                <div className="w-full rounded-3xl p-6 mb-5 text-center" style={glass.card}>
                  <Avatar initials="MI" color="#00A86B" size={72} />
                  <h2 className="display text-xl font-bold mt-4 mb-1" style={{ color: 'var(--ink)' }}>Musa Ibrahim</h2>
                  <p className="text-lg font-semibold" style={{ color: 'var(--brand)' }}>@musa</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>0803 *** 4567</p>

                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <p className="text-xs text-pretty" style={{ color: 'var(--subtle)' }}>
                      People on Cashland can send money using your phone number or CashTag.
                    </p>
                  </div>
                </div>

                <button
                  className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
                >
                  <Share2 size={18} /> Share CashTag
                </button>
              </div>
            )}

            {/* QR Tab */}
            {tab === 'qr' && (
              <div className="flex flex-col items-center">
                <div className="w-full rounded-3xl p-6 mb-5 flex flex-col items-center" style={glass.card}>
                  <p className="text-sm font-semibold mb-4" style={{ color: 'var(--subtle)' }}>Scan to pay @musa</p>
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                  >
                    <QrCodeSvg size={180} />
                  </div>

                  {requestAmount && (
                    <motion.div
                      className="mt-4 px-4 py-2 rounded-xl"
                      style={{ background: 'var(--brand-light)' }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-sm font-bold text-center" style={{ color: 'var(--brand)' }}>
                        Requesting {formatNaira(parseFloat(requestAmount))}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      <Share2 size={16} /> Share QR
                    </button>
                    <button
                      className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--ink)' }}
                    >
                      <Download size={16} /> Save QR
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAmountInput(!showAmountInput)}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ color: 'var(--subtle)', background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.08)' }}
                  >
                    Request specific amount
                  </button>
                  <AnimatePresence>
                    {showAmountInput && (
                      <motion.div
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                        style={glass.card}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <span className="text-base font-semibold" style={{ color: 'var(--muted)' }}>₦</span>
                        <input
                          type="number"
                          placeholder="Enter amount"
                          value={requestAmount}
                          onChange={e => setRequestAmount(e.target.value)}
                          className="flex-1 bg-transparent text-base font-semibold outline-none tabular"
                          style={{ color: 'var(--ink)' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Wallet Address Tab */}
            {tab === 'address' && (
              <div className="flex flex-col">
                <div className="rounded-3xl p-5 mb-4" style={glass.card}>
                  <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
                    Your onchain wallet
                  </p>
                  <div
                    className="px-4 py-3.5 rounded-xl mb-3"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <p className="mono text-sm break-all" style={{ color: 'var(--ink)' }}>
                      0x71F3a8c492bE14D9...92AD
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCopy('0x71F3a8c492bE14D9...92AD')}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--ink)' }}
                    >
                      <QrCode size={15} /> Show QR
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl"
                  style={{ background: '#FEF3C7', border: '1px solid #FCD34D30' }}
                >
                  <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-sm text-pretty" style={{ color: '#92400E' }}>
                    Only send supported assets to this wallet. Sending unsupported tokens may result in permanent loss.
                  </p>
                </div>

                <div
                  className="mt-4 px-4 py-3.5 rounded-2xl"
                  style={{ background: 'var(--brand-light)' }}
                >
                  <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
                    For most people, using your phone number or CashTag is easier. Share your wallet address only for advanced transfers.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
