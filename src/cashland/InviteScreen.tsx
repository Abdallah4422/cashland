import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, UserPlus, Share2, Copy, Check, Gift,
  MessageSquare, Users, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { glass, formatNaira } from './design';

interface Props { onClose: () => void; }

const INVITE_LINK = 'https://cashland.app/invite/musa-ibrahim-xk7p';
const REFERRAL_CODE = 'MUSA500';

const PENDING_INVITES = [
  { name: 'Funke Adeyemi', phone: '0802 *** 1234', amount: 5000, sent: '2 days ago', status: 'pending' },
  { name: 'Emeka Obi', phone: '0807 *** 5678', amount: 2000, sent: '5 days ago', status: 'pending' },
];

const COMPLETED_INVITES = [
  { name: 'Tunde Bakare', phone: '0809 *** 9012', amount: 3000, sent: '2 weeks ago', bonus: 500, status: 'claimed' },
];

type Step = 'home' | 'send' | 'sent';

export default function InviteScreen({ onClose }: Props) {
  const [step, setStep] = useState<Step>('home');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const chips = [1000, 2000, 5000, 10000];
  const parsedAmount = parseFloat(amount) || 0;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  };

  const [inviteLink] = useState(() => `https://cashland.app/claim/${Math.random().toString(36).slice(2, 10)}`);

  // ---- SENT screen ----
  if (step === 'sent') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('home')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,168,107,0.15), rgba(0,168,107,0.25))' }}>
            <Gift size={44} style={{ color: 'var(--brand)' }} />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="display text-2xl font-bold mb-2 text-center" style={{ color: 'var(--ink)' }}>
            Invite sent!
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-sm mb-8 text-center" style={{ color: 'var(--muted)' }}>
            {formatNaira(parsedAmount)} is protected for {phone}. They'll receive an SMS with a link to claim it by creating a Cashland account.
          </motion.p>

          {/* Claim link card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="w-full rounded-2xl p-4 mb-4" style={{ ...glass.card, border: '1px dashed rgba(0,168,107,0.3)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Claim link (share directly)</p>
            <p className="text-xs font-mono mb-3 break-all" style={{ color: 'var(--ink)' }}>{inviteLink}</p>
            <button onClick={() => copyText(inviteLink, 'link')}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--brand)' }}>
              {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'link' ? 'Copied!' : 'Copy link'}
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex gap-3 w-full">
            <button onClick={() => { setStep('send'); setPhone(''); setAmount(''); setNote(''); }}
              className="flex-1 h-12 rounded-2xl font-semibold text-sm"
              style={{ background: 'rgba(0,168,107,0.1)', color: 'var(--brand)' }}>
              Send Another
            </button>
            <button onClick={onClose}
              className="flex-1 h-12 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'var(--brand)' }}>
              Done
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- SEND screen ----
  if (step === 'send') {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setStep('home')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
          </button>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Send money + invite</h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>They'll claim it when they join Cashland</p>
          </div>
        </div>
        <div className="flex-1 px-5 pb-8">
          <div className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: 'rgba(0,168,107,0.07)', border: '1px solid rgba(0,168,107,0.15)' }}>
            <Gift size={18} style={{ color: 'var(--brand)' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: 'var(--ink)' }}>
              The money stays protected until they create a Cashland account. If unclaimed in 30 days, it returns to your balance.
            </p>
          </div>

          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Their phone number</p>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="0803 000 0000"
            className="w-full px-4 py-3.5 rounded-2xl text-base outline-none mb-4"
            style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.2)' }} />

          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Amount to send</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {chips.map(c => (
              <button key={c} onClick={() => setAmount(String(c))}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: parsedAmount === c ? 'var(--brand)' : 'rgba(0,168,107,0.1)', color: parsedAmount === c ? 'white' : 'var(--brand)' }}>
                {formatNaira(c)}
              </button>
            ))}
          </div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Or enter amount"
            className="w-full px-4 py-3.5 rounded-2xl outline-none mb-4"
            style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,168,107,0.15)' }} />

          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Message (optional)</p>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Join me on Cashland!"
            className="w-full px-4 py-3.5 rounded-2xl outline-none mb-6"
            style={{ ...glass.card, color: 'var(--ink)', border: '1.5px solid rgba(0,0,0,0.06)' }} />

          <motion.button onClick={() => setStep('sent')} disabled={!parsedAmount || phone.length < 11}
            className="w-full h-14 rounded-2xl font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
            Send {parsedAmount > 0 ? formatNaira(parsedAmount) : ''} + Invite
          </motion.button>
        </div>
      </div>
    );
  }

  // ---- HOME screen ----
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={20} style={{ color: 'var(--ink)' }} />
        </button>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Invite & Earn</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Share Cashland, earn rewards</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Referral card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 mb-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #00A86B, #00C57E)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', transform: 'translate(30%, -30%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} color="white" />
              <span className="text-sm font-semibold text-white">Your referral code</span>
            </div>
            <p className="display text-3xl font-bold text-white tracking-widest mb-1">{REFERRAL_CODE}</p>
            <p className="text-sm text-white/70 mb-4">Earn ₦500 for every friend who joins</p>
            <div className="flex gap-2">
              <button onClick={() => copyText(REFERRAL_CODE, 'code')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </button>
              <button onClick={() => copyText(INVITE_LINK, 'sharelink')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <Share2 size={14} />
                Share link
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Invited', value: String(PENDING_INVITES.length + COMPLETED_INVITES.length), icon: Users },
            { label: 'Joined', value: String(COMPLETED_INVITES.length), icon: CheckCircle2 },
            { label: 'Earned', value: '₦500', icon: Gift },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={glass.card}>
              <Icon size={18} style={{ color: 'var(--brand)' }} className="mx-auto mb-1" />
              <p className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* CTA cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <motion.button onClick={() => setStep('send')}
            className="rounded-2xl p-4 flex flex-col items-start gap-2 text-left" style={glass.card}
            whileTap={{ scale: 0.97 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
              <UserPlus size={18} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Send + Invite</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Send money to someone new</p>
            </div>
          </motion.button>
          <motion.button
            className="rounded-2xl p-4 flex flex-col items-start gap-2 text-left" style={glass.card}
            whileTap={{ scale: 0.97 }}
            onClick={() => copyText(INVITE_LINK, 'whatsapp')}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <MessageSquare size={18} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Share via SMS</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{copied === 'whatsapp' ? 'Link copied!' : 'Copy invite link'}</p>
            </div>
          </motion.button>
        </div>

        {/* Pending invites */}
        <AnimatePresence>
          {PENDING_INVITES.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Pending Invites</h3>
              <div className="rounded-2xl overflow-hidden" style={glass.card}>
                {PENDING_INVITES.map((inv, i) => (
                  <div key={inv.phone}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
                        {inv.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{inv.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{inv.phone} · {inv.sent}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{formatNaira(inv.amount)}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#F59E0B' }}>Pending</p>
                      </div>
                    </div>
                    {i < PENDING_INVITES.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed invites */}
        {COMPLETED_INVITES.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Completed</h3>
            <div className="rounded-2xl overflow-hidden" style={glass.card}>
              {COMPLETED_INVITES.map(inv => (
                <div key={inv.phone} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--brand), #00C57E)' }}>
                    {inv.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{inv.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{inv.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{formatNaira(inv.amount)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>+{formatNaira(inv.bonus)} bonus</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(91,108,246,0.06)', border: '1px solid rgba(91,108,246,0.12)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>How it works</p>
          {[
            { step: '1', text: 'Share your code or send money to a new phone number' },
            { step: '2', text: 'They create a Cashland account and claim their money' },
            { step: '3', text: 'You earn ₦500 when they complete their first transaction' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3 mb-2 last:mb-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: '#5B6CF6' }}>
                {item.step}
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.text}</p>
            </div>
          ))}
        </div>

        <motion.button onClick={() => setStep('send')}
          className="w-full h-14 rounded-2xl font-bold text-white mt-5"
          style={{ background: 'var(--brand)' }} whileTap={{ scale: 0.97 }}>
          <div className="flex items-center justify-center gap-2">
            <UserPlus size={18} />
            Invite a Friend
          </div>
        </motion.button>

        {/* Terms */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Referral T&Cs apply</p>
        </div>
      </div>
    </div>
  );
}
