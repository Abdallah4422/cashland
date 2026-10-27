import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, CheckCircle2, Info, Loader2, Receipt, RefreshCcw, Share2, ExternalLink, Copy, Check, AlertCircle, Wallet } from 'lucide-react';
import { pushSentNotification } from './useNotifications';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { navyGradient, brandGradient, formatNaira, contacts } from './design';
import { Avatar } from './HomeScreen';
import { useUsdcBalance, ngnToUsdc } from './useUsdcBalance';
import { useUsdcTransfer } from './useUsdcTransfer';
import { useFxRates, loadCurrencyPref, getFxBreakdown } from './useFxRates';

interface Props { onClose: () => void; }
type Step = 'recipient' | 'amount' | 'review' | 'confirm' | 'receipt' | 'proof';

const selectedContact = contacts[0];

const darkGlass = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1rem',
};

const darkInner = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1rem',
};

// ── Recipient Step ────────────────────────────────────────────
function RecipientStep({ onNext, onBack: _onBack }: { onNext: (address: string) => void; onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [resolved, setResolved] = useState(false);

  const handleInput = (v: string) => { setQuery(v); setResolved(v.length >= 5); };
  const canContinue = resolved || (showAddressInput && isAddress(customAddress));
  const handleContinue = () => {
    if (showAddressInput && isAddress(customAddress)) onNext(customAddress);
    else onNext(selectedContact.walletAddress);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="mb-5">
        <h2 className="display text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Send Money</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Phone, CashTag, or wallet address</p>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={darkGlass}>
        <Search size={18} style={{ color: 'rgba(255,255,255,0.35)' }} />
        <input
          autoFocus={!showAddressInput}
          type="text"
          placeholder="Phone number or @CashTag"
          value={query}
          onChange={e => handleInput(e.target.value)}
          className="flex-1 bg-transparent text-base outline-none text-white placeholder-white/30"
        />
      </div>

      <AnimatePresence>
        {resolved && !showAddressInput && (
          <motion.div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'rgba(0,168,107,0.12)', border: '1.5px solid rgba(0,168,107,0.35)' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          >
            <Avatar initials={selectedContact.initials} color={selectedContact.color} size={46} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-base font-bold text-white">{selectedContact.name} {selectedContact.surname}</p>
                <CheckCircle2 size={15} style={{ color: '#00A86B' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#00A86B' }}>{selectedContact.tag}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{selectedContact.phone}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!resolved && !showAddressInput && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-3 uppercase" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>Recent</p>
          <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {contacts.map(c => (
              <button key={c.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all active:scale-95" onClick={() => { setQuery(c.tag); setResolved(true); }}>
                <Avatar initials={c.initials} color={c.color} size={48} />
                <span className="text-xs font-medium text-white">{c.name}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{c.tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => { setShowAddressInput(v => !v); setResolved(false); setQuery(''); }}
        className="text-xs font-medium mb-4 text-left"
        style={{ color: 'rgba(255,255,255,0.40)' }}
      >
        {showAddressInput ? 'Use CashTag / phone instead' : 'Send to wallet address'}
      </button>

      {showAddressInput && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={darkGlass}>
          <Wallet size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            autoFocus
            type="text"
            placeholder="0x..."
            value={customAddress}
            onChange={e => setCustomAddress(e.target.value)}
            className="flex-1 bg-transparent text-sm font-mono outline-none text-white placeholder-white/30"
          />
          {isAddress(customAddress) && <CheckCircle2 size={15} style={{ color: '#00A86B' }} />}
        </div>
      )}

      <div className="mt-auto">
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: brandGradient, boxShadow: canContinue ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ── Amount Step ───────────────────────────────────────────────
function AmountStep({ onNext, onBack: _onBack }: { onNext: (amount: number, note: string) => void; onBack: () => void }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { isConnected, formattedNgn, ngnFloat } = useUsdcBalance();
  const { rates } = useFxRates();
  const activeCurrency = loadCurrencyPref();
  const chips = [1000, 5000, 10000, 20000];
  const numAmount = parseFloat(amount) || 0;
  const valid = numAmount > 0 && numAmount <= ngnFloat;

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl" style={{ background: 'rgba(0,168,107,0.12)', border: '1px solid rgba(0,168,107,0.20)' }}>
        <Avatar initials={selectedContact.initials} color={selectedContact.color} size={36} />
        <div>
          <p className="text-sm font-semibold text-white">{selectedContact.name} {selectedContact.surname}</p>
          <p className="text-xs font-semibold" style={{ color: '#00A86B' }}>{selectedContact.tag}</p>
        </div>
      </div>

      <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.50)' }}>How much are you sending?</p>

      <div className="rounded-2xl p-5 mb-4" style={darkGlass}>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="display text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.30)' }}>₦</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="display flex-1 text-4xl font-bold bg-transparent outline-none tabular text-white placeholder-white/20"
            style={{ letterSpacing: '-0.03em' }}
          />
        </div>
        {numAmount > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold" style={{ color: '#00A86B' }}>
              = {ngnToUsdc(numAmount).toFixed(4)} USDC
            </p>
            {activeCurrency !== 'NGN' && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{getFxBreakdown(numAmount, rates)}</p>
            )}
            {activeCurrency === 'NGN' && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                ≈ ${(ngnToUsdc(numAmount) * rates.USD).toFixed(2)} · £{(ngnToUsdc(numAmount) * rates.GBP).toFixed(2)}
              </p>
            )}
          </div>
        )}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Available:{' '}
          <span className="font-semibold" style={{ color: isConnected ? '#00A86B' : 'rgba(255,255,255,0.35)' }}>
            {isConnected ? formattedNgn : 'Connect wallet'}
          </span>
        </p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {chips.map(v => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
            style={{
              background: amount === String(v) ? '#00A86B' : 'rgba(255,255,255,0.08)',
              color: amount === String(v) ? 'white' : 'rgba(255,255,255,0.70)',
              border: `1.5px solid ${amount === String(v) ? '#00A86B' : 'rgba(255,255,255,0.10)'}`,
            }}
          >
            {formatNaira(v)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={darkInner}>
        <input
          type="text"
          placeholder="What's this for? (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none text-white placeholder-white/30"
        />
      </div>

      <div className="mt-auto">
        <button
          disabled={!valid}
          onClick={() => onNext(numAmount, note)}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: brandGradient, boxShadow: valid ? '0 8px 24px rgba(0,168,107,0.35)' : 'none' }}
        >
          Continue
        </button>
        {numAmount > ngnFloat && ngnFloat > 0 && (
          <p className="text-center text-xs mt-2" style={{ color: '#f87171' }}>Amount exceeds your balance</p>
        )}
      </div>
    </div>
  );
}

// ── Review + onchain confirm step ─────────────────────────────
function ConfirmStep({ amount, note: _note, recipientAddress, onDone, onBack: _onBack }: {
  amount: number; note: string; recipientAddress: string;
  onDone: (hash: string) => void; onBack: () => void;
}) {
  const { isConnected } = useAccount();
  const { send, status, hash, explorerUrl, parsedError, isCancelled, reset } = useUsdcTransfer();
  const { rates } = useFxRates();
  const usdcAmount = ngnToUsdc(amount).toFixed(4);
  const usdEquiv = `$${(ngnToUsdc(amount) * rates.USD).toFixed(2)}`;
  const gbpEquiv = `£${(ngnToUsdc(amount) * rates.GBP).toFixed(2)}`;

  if (status === 'success' && hash) setTimeout(() => onDone(hash), 200);

  const rows = [
    { label: 'Recipient', value: selectedContact.name + ' ' + selectedContact.surname },
    { label: 'CashTag', value: selectedContact.tag, accent: true },
    { label: 'Amount', value: formatNaira(amount), bold: true },
    { label: 'USDC equivalent', value: `${usdcAmount} USDC`, muted: true },
    { label: 'FX equivalent', value: `${usdEquiv} · ${gbpEquiv}`, muted: true },
    { label: 'Cashland fee', value: '₦0', muted: true },
    { label: 'Network fee', value: 'Gas paid by Cashland', muted: true },
    { label: 'Total', value: formatNaira(amount), bold: true, brand: true },
    { label: 'Payment method', value: 'Cashland Balance' },
  ];

  const handleSend = () => {
    if (isCancelled) { reset(); return; }
    send(recipientAddress, amount);
  };

  const ctaLabel = () => {
    if (!isConnected) return 'Connect wallet to send';
    if (status === 'wrong-chain') return 'Switch to Arc Mainnet';
    if (status === 'signing') return <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Confirm in wallet...</span>;
    if (status === 'confirming') return <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Confirming on chain...</span>;
    if (status === 'success') return <span className="flex items-center justify-center gap-2"><CheckCircle2 size={16} />Payment confirmed</span>;
    if (isCancelled) return 'Try again';
    return `Send ${formatNaira(amount)}`;
  };

  return (
    <div className="flex flex-col min-h-full">
      <h2 className="display text-xl font-bold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>Review transfer</h2>

      <div className="rounded-2xl overflow-hidden mb-4" style={darkGlass}>
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
              <span className="text-sm font-semibold tabular" style={{ color: row.brand ? '#00A86B' : row.bold ? 'white' : row.accent ? '#00A86B' : 'rgba(255,255,255,0.55)' }}>
                {row.value}
              </span>
            </div>
            {i < rows.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(0,168,107,0.10)', border: '1px solid rgba(0,168,107,0.20)' }}>
        <Info size={14} style={{ color: '#00A86B', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Cashland settles this payment using USDC on Arc Mainnet. Your wallet will request a signature.
        </p>
      </div>

      {parsedError && !isCancelled && (
        <motion.div className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(248,113,113,0.10)' }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: '#f87171' }}>{parsedError}</p>
        </motion.div>
      )}

      <div className="mt-auto space-y-3">
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button onClick={show} className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
                <Wallet size={18} /> Connect wallet to send
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : (
          <button onClick={handleSend} disabled={status === 'signing' || status === 'confirming' || status === 'success'} className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
            {ctaLabel()}
          </button>
        )}
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(0,168,107,0.10)', color: '#00A86B' }}>
            <ExternalLink size={14} /> View on explorer
          </a>
        )}
      </div>
    </div>
  );
}

// ── Success Step ──────────────────────────────────────────────
function SuccessStep({ amount, txHash, explorerUrl, onReceipt, onSendAgain, onDone }: {
  amount: number; txHash: string; explorerUrl: string | null;
  onReceipt: () => void; onSendAgain: () => void; onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center min-h-full">
      <motion.div className="mt-6 mb-6" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,168,107,0.15)', boxShadow: '0 0 60px rgba(0,168,107,0.4)' }}>
          <CheckCircle2 size={52} style={{ color: '#00A86B' }} strokeWidth={1.8} />
        </div>
      </motion.div>

      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="display text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Payment Successful</h2>
        <div className="display text-4xl font-bold tabular mb-1" style={{ color: '#00A86B', letterSpacing: '-0.03em' }}>{formatNaira(amount)}</div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>sent to {selectedContact.name} {selectedContact.surname}</p>
      </motion.div>

      <motion.div className="w-full rounded-2xl overflow-hidden mb-6" style={darkGlass} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        {[
          { label: 'CashTag', value: selectedContact.tag, accent: true },
          { label: 'Reference', value: 'CL-' + txHash.slice(2, 10).toUpperCase(), mono: true },
          { label: 'Status', value: 'Successful', success: true },
          { label: 'Blockchain', value: 'Verified onchain', success: true },
        ].map((row, i, arr) => (
          <div key={row.label}>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
              <div className="flex items-center gap-1.5">
                {row.success && <CheckCircle2 size={13} style={{ color: '#00A86B' }} />}
                <span className={`text-sm font-semibold ${row.mono ? 'font-mono text-xs' : ''} tabular`} style={{ color: row.accent || row.success ? '#00A86B' : 'white' }}>
                  {row.value}
                </span>
              </div>
            </div>
            {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
          </div>
        ))}
      </motion.div>

      <motion.div className="w-full space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex gap-3">
          <button onClick={onReceipt} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(0,168,107,0.15)', color: '#00A86B' }}>
            <Receipt size={16} /> View Receipt
          </button>
          <button onClick={onSendAgain} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
            <RefreshCcw size={16} /> Send Again
          </button>
        </div>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(0,168,107,0.10)', color: '#00A86B' }}>
            <ExternalLink size={14} /> View transaction on explorer
          </a>
        )}
        <button onClick={onDone} className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
          Done
        </button>
      </motion.div>
    </div>
  );
}

// ── Receipt Step ──────────────────────────────────────────────
function ReceiptStep({ amount, txHash, explorerUrl, confirmedAt, onProof, onClose }: {
  amount: number; txHash: string; explorerUrl: string | null;
  confirmedAt: Date; onProof: () => void; onClose: () => void;
}) {
  const shortHash = txHash.slice(0, 6) + '...' + txHash.slice(-4);
  return (
    <div className="flex flex-col min-h-full">
      <div className="rounded-3xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="px-5 py-5 text-center" style={{ background: navyGradient }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
              <path d="M22 4C12.06 4 4 12.06 4 22C4 31.94 12.06 40 22 40C31.94 40 40 31.94 40 22C40 12.06 31.94 4 22 4Z" fill="rgba(255,255,255,0.9)"/>
              <path d="M27.5 16.5H19C17.9 16.5 17 17.4 17 18.5V19.5C17 20.6 17.9 21.5 19 21.5H25C26.1 21.5 27 22.4 27 23.5V25.5C27 26.6 26.1 27.5 25 27.5H16.5" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 13V16.5M22 27.5V31" stroke="#00A86B" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="display font-bold text-white text-lg tracking-tight">CASHLAND</span>
          </div>
          <div className="display text-3xl font-bold text-white tabular" style={{ letterSpacing: '-0.03em' }}>{formatNaira(amount)}</div>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <CheckCircle2 size={14} className="text-white" />
            <span className="text-sm font-semibold text-white">Successful</span>
          </div>
        </div>
        <div className="px-5 py-4">
          {[
            { label: 'Sent to', value: selectedContact.name + ' ' + selectedContact.surname },
            { label: 'CashTag', value: selectedContact.tag, accent: true },
            { label: 'Date', value: confirmedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Time', value: confirmedAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) },
            { label: 'Reference', value: 'CL-' + txHash.slice(2, 10).toUpperCase(), mono: true },
            { label: 'Network fee', value: '₦0' },
            { label: 'Blockchain', value: 'Verified', success: true },
            { label: 'Transaction hash', value: shortHash, mono: true, muted: true },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                <div className="flex items-center gap-1">
                  {row.success && <CheckCircle2 size={12} style={{ color: '#00A86B' }} />}
                  <span className={`text-sm font-semibold ${row.mono ? 'font-mono text-xs' : ''}`} style={{ color: row.accent || row.success ? '#00A86B' : row.muted ? 'rgba(255,255,255,0.40)' : 'white' }}>
                    {row.value}
                  </span>
                </div>
              </div>
              {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <button onClick={onProof} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(0,168,107,0.15)', color: '#00A86B' }}>
            <ExternalLink size={15} /> Onchain Proof
          </button>
          <button className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
            <Share2 size={15} /> Share
          </button>
        </div>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(0,168,107,0.10)', color: '#00A86B' }}>
            <ExternalLink size={14} /> Open in explorer
          </a>
        )}
        <button onClick={onClose} className="w-full py-4 rounded-2xl text-base font-semibold text-white" style={{ background: navyGradient }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Proof Step ────────────────────────────────────────────────
function ProofStep({ txHash, explorerUrl, onClose }: { txHash: string; explorerUrl: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const { address } = useAccount();

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortFrom = address ? address.slice(0, 6) + '...' + address.slice(-4) : '0x71F...92A';
  const shortTo = selectedContact.walletAddress.slice(0, 6) + '...' + selectedContact.walletAddress.slice(-4);
  const usdcAmount = ngnToUsdc(5000).toFixed(4);

  const rows = [
    { label: 'Transaction hash', value: txHash.slice(0, 10) + '...' + txHash.slice(-6), mono: true },
    { label: 'From', value: shortFrom, mono: true },
    { label: 'To', value: shortTo, mono: true },
    { label: 'Asset', value: 'USDC' },
    { label: 'Amount', value: `${usdcAmount} USDC` },
    { label: 'Network', value: 'Arc Mainnet' },
    { label: 'Block status', value: 'Confirmed', success: true },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <h2 className="display text-xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>Transaction Proof</h2>
      <div className="flex items-center gap-1.5 mb-5">
        <CheckCircle2 size={14} style={{ color: '#00A86B' }} />
        <span className="text-sm font-semibold" style={{ color: '#00A86B' }}>Confirmed onchain</span>
      </div>

      <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: 'rgba(0,168,107,0.10)', border: '1px solid rgba(0,168,107,0.20)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          This transaction has been recorded on a public blockchain and can be independently verified. Your personal Cashland information is not published with it.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden mb-4" style={darkGlass}>
        {rows.map((row, i, arr) => (
          <div key={row.label}>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
              <div className="flex items-center gap-1.5">
                {row.success && <CheckCircle2 size={12} style={{ color: '#00A86B' }} />}
                <span className={`text-sm font-semibold ${row.mono ? 'font-mono text-xs' : ''}`} style={{ color: row.success ? '#00A86B' : 'white' }}>
                  {row.value}
                </span>
              </div>
            </div>
            {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3">
        <button onClick={handleCopy} className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{ background: 'rgba(0,168,107,0.15)', color: '#00A86B' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Hash copied' : 'Copy transaction hash'}
        </button>
        {explorerUrl ? (
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 text-white transition-all active:scale-[0.98]" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
            <ExternalLink size={16} /> Open Explorer
          </a>
        ) : (
          <button onClick={onClose} className="w-full py-4 rounded-2xl text-base font-semibold text-white transition-all active:scale-[0.98]" style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main orchestrator ─────────────────────────────────────────
export default function SendMoneyFlow({ onClose }: Props) {
  const [step, setStep] = useState<Step>('recipient');
  const [amount, setAmount] = useState(5000);
  const [note, setNote] = useState('');
  const [recipientAddress, setRecipientAddress] = useState(selectedContact.walletAddress);
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [confirmedAt] = useState<Date>(() => new Date());
  const { hash: liveHash, explorerUrl: liveExplorerUrl } = useUsdcTransfer();

  const handleAmountNext = (a: number, n: string) => { setAmount(a); setNote(n); setStep('review'); };
  const handleConfirmDone = (hash: string) => {
    setTxHash(hash);
    setExplorerUrl(liveExplorerUrl);
    pushSentNotification(
      selectedContact.name + ' ' + selectedContact.surname,
      new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount),
    );
    setStep('receipt');
  };

  const titles: Record<Step, string> = {
    recipient: 'Send Money', amount: 'Amount', review: 'Review transfer',
    confirm: '', receipt: 'Receipt', proof: 'Transaction Proof',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(180deg, #080f1a 0%, #0a1628 50%, #0c1c32 100%)' }}>
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {!['confirm'].includes(step) && (
        <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-4">
          <button
            onClick={() => {
              const backMap: Partial<Record<Step, Step>> = { amount: 'recipient', review: 'amount', receipt: 'confirm', proof: 'receipt' };
              const prev = backMap[step];
              if (prev) setStep(prev);
              else onClose();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="display text-lg font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            {titles[step]}
          </h1>
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="h-full flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {step === 'recipient' && <RecipientStep onNext={addr => { setRecipientAddress(addr); setStep('amount'); }} onBack={onClose} />}
            {step === 'amount' && <AmountStep onNext={handleAmountNext} onBack={() => setStep('recipient')} />}
            {step === 'review' && <ConfirmStep amount={amount} note={note} recipientAddress={recipientAddress} onDone={handleConfirmDone} onBack={() => setStep('amount')} />}
            {step === 'confirm' && (
              <SuccessStep
                amount={amount}
                txHash={txHash || liveHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
                explorerUrl={explorerUrl || liveExplorerUrl}
                onReceipt={() => setStep('receipt')}
                onSendAgain={() => setStep('recipient')}
                onDone={onClose}
              />
            )}
            {step === 'receipt' && (
              <ReceiptStep
                amount={amount}
                txHash={txHash || liveHash || '0x0000'}
                explorerUrl={explorerUrl || liveExplorerUrl}
                confirmedAt={confirmedAt}
                onProof={() => setStep('proof')}
                onClose={onClose}
              />
            )}
            {step === 'proof' && (
              <ProofStep
                txHash={txHash || liveHash || '0x0000'}
                explorerUrl={explorerUrl || liveExplorerUrl}
                onClose={onClose}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
