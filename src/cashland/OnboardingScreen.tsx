import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Smartphone, ShieldCheck, Wallet } from 'lucide-react';
import { glass, brandGradient } from './design';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const cards = [
  {
    icon: Smartphone,
    title: 'Send money with a phone number',
    description: 'No complicated wallet addresses. Just find someone and send.',
    color: '#00A86B',
    bg: '#E6F7F1',
  },
  {
    icon: ShieldCheck,
    title: 'Powered onchain',
    description: 'Eligible payments are backed by verifiable blockchain settlement.',
    color: '#5B6CF6',
    bg: '#EEF0FE',
  },
  {
    icon: Wallet,
    title: 'Your money. One simple wallet.',
    description: 'Pay, receive and manage digital money from one Cashland account.',
    color: '#D97706',
    bg: '#FEF3C7',
  },
];

export default function OnboardingScreen({ onGetStarted, onLogin }: Props) {
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < cards.length - 1) setIndex(index + 1);
    else onGetStarted();
  };

  const card = cards[index];
  const Icon = card.icon;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 100%)' }}>
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '5%', right: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '-5%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,108,246,0.09) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Skip */}
      <div className="relative z-10 flex justify-end px-6 pt-12">
        <button onClick={onGetStarted} className="text-sm font-medium" style={{ color: 'var(--subtle)' }}>
          Skip
        </button>
      </div>

      {/* Card area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="w-full max-w-sm"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="rounded-3xl p-8" style={glass.card}>
              {/* Spectral strip */}
              <div className="h-1 rounded-full mb-8" style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}88)` }} />

              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: card.bg }}
              >
                <Icon size={30} style={{ color: card.color }} />
              </div>

              <h2 className="display text-2xl font-bold mb-3 text-balance" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                {card.title}
              </h2>
              <p className="text-base leading-relaxed text-pretty" style={{ color: 'var(--subtle)' }}>
                {card.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="relative z-10 flex justify-center gap-2 pb-6">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="transition-all duration-300"
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === index ? 'var(--brand)' : 'var(--brand-light)',
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="relative z-10 px-6 pb-12 space-y-3">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: brandGradient, boxShadow: '0 8px 24px rgba(0,168,107,0.35)' }}
        >
          {index < cards.length - 1 ? (
            <>Next <ChevronRight size={18} /></>
          ) : (
            'Get Started'
          )}
        </button>
        <button
          onClick={onLogin}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ color: 'var(--brand)' }}
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
