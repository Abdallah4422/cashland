import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, WifiOff, Signal, Battery, X } from 'lucide-react';
import { glass, formatNaira } from './design';

interface Props { onClose: () => void; }

// ── USSD session engine ────────────────────────────────────────
// Each node is a menu screen or prompt. "next" maps input → next node id.
type NodeType = 'menu' | 'input' | 'confirm' | 'result';

interface USSDNode {
  id: string;
  type: NodeType;
  title: string;
  body: string;
  options?: { digit: string; label: string; next: string }[];
  inputHint?: string;
  inputType?: 'number' | 'text' | 'phone' | 'amount' | 'pin';
  next?: string; // for confirm/result
  onConfirm?: string; // next node after confirm
}

const NODES: Record<string, USSDNode> = {
  // ── Main menu ──
  main: {
    id: 'main', type: 'menu',
    title: 'Welcome to Cashland',
    body: 'CON',
    options: [
      { digit: '1', label: 'Send Money', next: 'send_phone' },
      { digit: '2', label: 'Check Balance', next: 'balance' },
      { digit: '3', label: 'Buy Airtime', next: 'airtime_phone' },
      { digit: '4', label: 'Pay Bills', next: 'bills_menu' },
      { digit: '5', label: 'Mini Statement', next: 'statement' },
      { digit: '0', label: 'Exit', next: 'exit' },
    ],
  },

  // ── Send Money ──
  send_phone: {
    id: 'send_phone', type: 'input',
    title: 'Send Money',
    body: 'CON Enter recipient phone number or CashTag:',
    inputHint: 'e.g. 08031234567 or @aisha',
    inputType: 'phone',
    next: 'send_amount',
  },
  send_amount: {
    id: 'send_amount', type: 'input',
    title: 'Send Money',
    body: 'CON Enter amount in Naira:',
    inputHint: 'e.g. 5000',
    inputType: 'amount',
    next: 'send_pin',
  },
  send_pin: {
    id: 'send_pin', type: 'input',
    title: 'Send Money',
    body: 'CON Enter your Cashland PIN:',
    inputHint: '6-digit PIN',
    inputType: 'pin',
    next: 'send_confirm',
  },
  send_confirm: {
    id: 'send_confirm', type: 'confirm',
    title: 'Confirm Transfer',
    body: 'CON',
    onConfirm: 'send_success',
    next: 'main',
  },
  send_success: {
    id: 'send_success', type: 'result',
    title: 'Transfer Successful',
    body: 'END Your transfer was successful.\nRef: CL-USSD-$REF\nCashland Ref sent to your phone.',
  },

  // ── Balance ──
  balance: {
    id: 'balance', type: 'result',
    title: 'Account Balance',
    body: 'END Cashland Balance:\nAvail: $BAL\nAcct: 0803 *** 4567\n\nDial *7379*9# for full statement.',
  },

  // ── Airtime ──
  airtime_phone: {
    id: 'airtime_phone', type: 'input',
    title: 'Buy Airtime',
    body: 'CON Enter phone number\n(Leave blank for self):',
    inputHint: 'e.g. 08031234567',
    inputType: 'phone',
    next: 'airtime_network',
  },
  airtime_network: {
    id: 'airtime_network', type: 'menu',
    title: 'Select Network',
    body: 'CON',
    options: [
      { digit: '1', label: 'MTN', next: 'airtime_amount' },
      { digit: '2', label: 'Airtel', next: 'airtime_amount' },
      { digit: '3', label: 'Glo', next: 'airtime_amount' },
      { digit: '4', label: '9mobile', next: 'airtime_amount' },
      { digit: '0', label: 'Back', next: 'main' },
    ],
  },
  airtime_amount: {
    id: 'airtime_amount', type: 'input',
    title: 'Buy Airtime',
    body: 'CON Enter airtime amount:',
    inputHint: 'e.g. 500',
    inputType: 'amount',
    next: 'airtime_pin',
  },
  airtime_pin: {
    id: 'airtime_pin', type: 'input',
    title: 'Buy Airtime',
    body: 'CON Enter your Cashland PIN:',
    inputHint: '6-digit PIN',
    inputType: 'pin',
    next: 'airtime_success',
  },
  airtime_success: {
    id: 'airtime_success', type: 'result',
    title: 'Airtime Successful',
    body: 'END Airtime top-up successful!\nRef: CL-AIR-$REF\nBalance deducted from Cashland.',
  },

  // ── Bills ──
  bills_menu: {
    id: 'bills_menu', type: 'menu',
    title: 'Pay Bills',
    body: 'CON',
    options: [
      { digit: '1', label: 'Electricity (IKEDC)', next: 'bill_meter' },
      { digit: '2', label: 'DStv / GOtv', next: 'bill_smartcard' },
      { digit: '3', label: 'Water Board', next: 'bill_meter' },
      { digit: '0', label: 'Back', next: 'main' },
    ],
  },
  bill_meter: {
    id: 'bill_meter', type: 'input',
    title: 'Pay Bill',
    body: 'CON Enter meter/account number:',
    inputHint: 'e.g. 1234567890',
    inputType: 'number',
    next: 'bill_amount',
  },
  bill_smartcard: {
    id: 'bill_smartcard', type: 'input',
    title: 'Pay Bill',
    body: 'CON Enter smartcard number:',
    inputHint: 'e.g. 7042564000',
    inputType: 'number',
    next: 'bill_amount',
  },
  bill_amount: {
    id: 'bill_amount', type: 'input',
    title: 'Pay Bill',
    body: 'CON Enter amount:',
    inputHint: 'e.g. 8000',
    inputType: 'amount',
    next: 'bill_pin',
  },
  bill_pin: {
    id: 'bill_pin', type: 'input',
    title: 'Pay Bill',
    body: 'CON Enter your Cashland PIN:',
    inputHint: '6-digit PIN',
    inputType: 'pin',
    next: 'bill_success',
  },
  bill_success: {
    id: 'bill_success', type: 'result',
    title: 'Bill Payment Successful',
    body: 'END Bill payment successful!\nToken: $TOKEN\nRef: CL-BILL-$REF\nSMS confirmation sent.',
  },

  // ── Mini statement ──
  statement: {
    id: 'statement', type: 'result',
    title: 'Mini Statement',
    body: 'END Last 3 transactions:\n1. -N5,000 Aisha Bello 9:42PM\n2. +N12,500 Received 7:15PM\n3. -N8,200 TechHub 3:00PM\n\nFor full history: cashland.app',
  },

  exit: {
    id: 'exit', type: 'result',
    title: 'Session Ended',
    body: 'END Thank you for using Cashland.\nDial *7379# to start a new session.',
  },
};

// ── Session state ──────────────────────────────────────────────
interface SessionEntry {
  nodeId: string;
  input: string;
  display: string; // what we show for this input
}

function generateRef() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function resolveBody(node: USSDNode, context: SessionEntry[]): string {
  let body = node.body;
  if (body.startsWith('CON ') || body.startsWith('END ')) body = body.slice(4);

  // Inject dynamic values
  body = body.replace('$BAL', '₦184,500.00 (118.35 USDC)');
  body = body.replace('$REF', generateRef());
  body = body.replace('$TOKEN', '5724 8931 0012 4456');

  // For send_confirm — build a readable confirmation
  if (node.id === 'send_confirm') {
    const phoneEntry = context.find(e => e.nodeId === 'send_phone');
    const amountEntry = context.find(e => e.nodeId === 'send_amount');
    const phone = phoneEntry?.input || '08031234567';
    const rawAmt = parseFloat(amountEntry?.input || '5000');
    const amount = isNaN(rawAmt) ? 5000 : rawAmt;
    body = `Send ${formatNaira(amount)} to ${phone}?\nNetwork fee: ₦0\nTotal: ${formatNaira(amount)}\n\nPress 1 to confirm\nPress 2 to cancel`;
  }

  return body;
}

// ── Phone dialer component ─────────────────────────────────────
function Dialer({ onDial }: { onDial: (code: string) => void }) {
  const [input, setInput] = useState('');
  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  const tap = (k: string) => setInput(p => p + k);
  const del = () => setInput(p => p.slice(0, -1));
  const dial = () => { if (input) onDial(input); };

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-4">
      {/* Display */}
      <div className="w-full mb-6">
        <div
          className="w-full text-center py-4 px-4 rounded-2xl font-mono text-2xl font-semibold tracking-widest min-h-[64px]"
          style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--ink)' }}
        >
          {input || <span style={{ color: 'var(--muted)' }}>*7379#</span>}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full mb-4">
        {keys.map(k => (
          <button
            key={k}
            onClick={() => tap(k)}
            className="h-16 rounded-2xl flex flex-col items-center justify-center font-semibold text-xl transition-all active:scale-90"
            style={{ background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <span>{k}</span>
            {k === '2' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>ABC</span>}
            {k === '3' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>DEF</span>}
            {k === '4' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>GHI</span>}
            {k === '5' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>JKL</span>}
            {k === '6' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>MNO</span>}
            {k === '7' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>PQRS</span>}
            {k === '8' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>TUV</span>}
            {k === '9' && <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--muted)' }}>WXYZ</span>}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <button
          onClick={del}
          className="h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#FEF2F2', color: '#E53E3E' }}
        >
          <X size={20} />
        </button>
        <button
          onClick={dial}
          disabled={!input}
          className="col-span-2 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: input ? 'var(--brand)' : 'var(--muted)' }}
        >
          <Phone size={18} />
          Dial
        </button>
      </div>

      {/* Quick dial shortcuts */}
      <div className="w-full mt-5">
        <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--muted)' }}>QUICK DIAL</p>
        <div className="flex flex-wrap gap-2">
          {[
            { code: '*7379#', label: 'Main Menu' },
            { code: '*7379*2#', label: 'Balance' },
            { code: '*7379*1#', label: 'Send Money' },
            { code: '*7379*3#', label: 'Buy Airtime' },
          ].map(s => (
            <button
              key={s.code}
              onClick={() => onDial(s.code)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
            >
              <span className="font-mono">{s.code}</span>
              <span style={{ color: 'var(--subtle)' }}>· {s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── USSD session screen ────────────────────────────────────────
function USSDSession({
  startNodeId,
  onEnd,
}: {
  startNodeId: string;
  onEnd: () => void;
}) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [history, setHistory] = useState<SessionEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const node = NODES[currentNodeId] ?? NODES['main'];
  const isEnd = node.type === 'result';
  const bodyText = resolveBody(node, history);

  useEffect(() => {
    if (!isEnd && node.type !== 'menu') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentNodeId, isEnd, node.type]);

  const advance = (input: string, display?: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const entry: SessionEntry = { nodeId: node.id, input, display: display ?? input };
      const newHistory = [...history, entry];
      setHistory(newHistory);

      let nextId: string | undefined;
      if (node.type === 'menu') {
        nextId = node.options?.find(o => o.digit === input)?.next;
      } else if (node.type === 'confirm') {
        nextId = input === '1' ? node.onConfirm : node.next;
      } else {
        nextId = node.next;
      }

      // Handle balance and statement — they may need dynamic resolution
      if (nextId === 'balance' && input === '2') nextId = 'balance';

      setCurrentNodeId(nextId ?? 'main');
      setTextInput('');
      setIsProcessing(false);
    }, 380);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const masked = node.inputType === 'pin' ? '••••••' : textInput;
    advance(textInput, masked);
  };

  const goBack = () => {
    if (history.length === 0) { onEnd(); return; }
    const prev = history[history.length - 1];
    setCurrentNodeId(prev.nodeId);
    setHistory(h => h.slice(0, -1));
    setTextInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fake phone status bar */}
      <div
        className="flex items-center justify-between px-5 py-2 text-xs font-semibold"
        style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.7)' }}
      >
        <span>9:42 AM</span>
        <div className="flex items-center gap-1.5">
          <Signal size={12} />
          <WifiOff size={12} style={{ color: '#F97316' }} />
          <Battery size={14} />
        </div>
      </div>

      {/* USSD dialog box */}
      <div className="flex-1 flex flex-col" style={{ background: '#1a1a2e' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col px-4 pt-6"
          >
            {/* USSD dialog chrome */}
            <div
              className="rounded-3xl overflow-hidden flex-1 flex flex-col"
              style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              {/* Dialog header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>USSD · *7379#</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: 'var(--ink)' }}>{node.title}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-light)' }}
                  >
                    <Phone size={15} style={{ color: 'var(--brand)' }} />
                  </div>
                </div>
              </div>

              {/* Dialog body */}
              <div className="flex-1 px-5 py-4 flex flex-col">
                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--brand)' }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Processing...</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <pre
                    className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                    style={{ color: 'var(--ink)' }}
                  >
                    {bodyText}
                  </pre>

                  {/* Menu options */}
                  {node.type === 'menu' && !isProcessing && (
                    <div className="mt-4 space-y-2">
                      {node.options?.map(opt => (
                        <button
                          key={opt.digit}
                          onClick={() => advance(opt.digit)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98]"
                          style={{ background: 'var(--brand-light)' }}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ background: 'var(--brand)', color: 'white' }}
                          >
                            {opt.digit}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text input */}
                  {(node.type === 'input') && !isProcessing && (
                    <div className="mt-4">
                      <div
                        className="flex items-center rounded-xl overflow-hidden border"
                        style={{ borderColor: 'var(--brand)', background: 'white' }}
                      >
                        <input
                          ref={inputRef}
                          type={node.inputType === 'pin' ? 'password' : node.inputType === 'amount' || node.inputType === 'number' ? 'tel' : 'text'}
                          value={textInput}
                          onChange={e => setTextInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                          placeholder={node.inputHint}
                          maxLength={node.inputType === 'pin' ? 6 : 30}
                          className="flex-1 px-3 py-3 text-sm font-mono outline-none bg-transparent"
                          style={{ color: 'var(--ink)' }}
                        />
                        <button
                          onClick={handleTextSubmit}
                          disabled={!textInput.trim()}
                          className="px-4 py-3 text-sm font-bold transition-all disabled:opacity-40"
                          style={{ color: 'var(--brand)' }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirm input */}
                  {node.type === 'confirm' && !isProcessing && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => advance('2', 'Cancel')}
                        className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        style={{ background: '#FEF2F2', color: '#E53E3E' }}
                      >
                        2. Cancel
                      </button>
                      <button
                        onClick={() => advance('1', 'Confirm')}
                        className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                        style={{ background: 'var(--brand)' }}
                      >
                        1. Confirm
                      </button>
                    </div>
                  )}
                </div>

                {/* END state action */}
                {isEnd && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => { setCurrentNodeId('main'); setHistory([]); }}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      New Session
                    </button>
                    <button
                      onClick={onEnd}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--subtle)' }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Back nav */}
              {!isEnd && (
                <div className="px-5 pb-4">
                  <button
                    onClick={goBack}
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    <ChevronLeft size={13} /> Back
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────
type View = 'info' | 'dialer' | 'session';

export default function USSDScreen({ onClose }: Props) {
  const [view, setView] = useState<View>('info');
  const [sessionNodeId, setSessionNodeId] = useState('main');

  const startSession = (nodeId: string) => {
    setSessionNodeId(nodeId);
    setView('session');
  };

  const handleDial = (code: string) => {
    // Parse USSD shortcode to direct entry node
    const clean = code.replace(/[^0-9*#]/g, '');
    if (clean === '*7379#' || clean === '*7379') { startSession('main'); return; }
    if (clean === '*73792#' || clean === '*7379*2#') { startSession('balance'); return; }
    if (clean === '*73791#' || clean === '*7379*1#') { startSession('send_phone'); return; }
    if (clean === '*73793#' || clean === '*7379*3#') { startSession('airtime_phone'); return; }
    if (clean === '*73794#' || clean === '*7379*4#') { startSession('bills_menu'); return; }
    // Any other code → main menu
    startSession('main');
  };

  if (view === 'session') {
    return (
      <div
        className="flex flex-col h-full max-w-md mx-auto"
        style={{ background: '#1a1a2e' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <button
            onClick={() => setView('dialer')}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <ChevronLeft size={18} /> Dialer
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <USSDSession startNodeId={sessionNodeId} onEnd={() => setView('dialer')} />
        </div>
      </div>
    );
  }

  if (view === 'dialer') {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto" style={{ background: 'var(--page)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={18} style={{ color: 'var(--ink)' }} />
          </button>
          <div>
            <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>USSD Dialer</h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No internet needed</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7' }}>
            <WifiOff size={11} style={{ color: '#D97706' }} />
            <span className="text-xs font-semibold" style={{ color: '#D97706' }}>Offline mode</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Dialer onDial={handleDial} />
        </div>
      </div>
    );
  }

  // ── Info / explainer view ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full max-w-md mx-auto overflow-y-auto pb-10" style={{ background: 'var(--page)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onClose} className="mb-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={18} style={{ color: 'var(--ink)' }} />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#1a1a2e' }}>
            <Phone size={22} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>USSD Banking</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No internet required</p>
          </div>
        </div>
      </div>

      {/* Hero code card */}
      <div className="mx-5 mb-6 rounded-3xl p-6 text-center" style={{ background: '#1a1a2e', boxShadow: '0 12px 32px rgba(26,26,46,0.35)' }}>
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Cashland USSD Code</p>
        <p className="font-mono text-5xl font-bold text-white mb-3" style={{ letterSpacing: '0.04em' }}>*7379#</p>
        <p className="text-white/60 text-sm">Works on any phone, any network, anywhere in Nigeria.</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          {['MTN', 'Airtel', 'Glo', '9mobile'].map(n => (
            <span key={n} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>{n}</span>
          ))}
        </div>
      </div>

      {/* What you can do */}
      <div className="px-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>WHAT YOU CAN DO</p>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {[
            { code: '*7379*1#', label: 'Send Money', sub: 'Transfer to phone or CashTag' },
            { code: '*7379*2#', label: 'Check Balance', sub: 'View your Cashland balance' },
            { code: '*7379*3#', label: 'Buy Airtime', sub: 'Top up any network instantly' },
            { code: '*7379*4#', label: 'Pay Bills', sub: 'Electricity, cable TV, water' },
            { code: '*7379*5#', label: 'Mini Statement', sub: 'Last 3 transactions' },
          ].map((item, i, arr) => (
            <div key={item.code}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className="font-mono text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  {item.code}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.sub}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>HOW IT WORKS</p>
        <div className="space-y-3">
          {[
            { n: '1', title: 'No internet needed', body: 'USSD works over your mobile network, even with no data or Wi-Fi.' },
            { n: '2', title: 'Same Cashland account', body: 'Your balance, contacts and history are the same whether you use the app or USSD.' },
            { n: '3', title: 'Secured by your PIN', body: 'Every transaction requires your 6-digit Cashland PIN.' },
            { n: '4', title: 'Free to use', body: 'Cashland does not charge for USSD access. Network operator charges may apply.' },
          ].map(step => (
            <div key={step.n} className="flex gap-3 p-4 rounded-2xl" style={glass.card}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: 'var(--brand)' }}
              >
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--subtle)' }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline notice */}
      <div className="mx-5 mb-6 rounded-2xl p-4 flex items-start gap-3" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
        <WifiOff size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: '#92400E' }}>Works without internet</p>
          <p className="text-xs leading-relaxed" style={{ color: '#B45309' }}>
            USSD uses your phone network, not data. It works in areas with poor or no internet connectivity — just a basic signal is enough.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 space-y-3">
        <button
          onClick={() => setView('dialer')}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98]"
          style={{ background: '#1a1a2e', boxShadow: '0 4px 16px rgba(26,26,46,0.3)' }}
        >
          Open Dialer
        </button>
        <button
          onClick={() => startSession('main')}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          Try *7379# demo
        </button>
      </div>
    </div>
  );
}
