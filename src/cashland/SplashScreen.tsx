import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { brandGradient } from './design';

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: brandGradient }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <motion.div
        className="flex flex-col items-center gap-4 relative z-10"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 }}
      >
        {/* Logo mark */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.40)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
          >
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M22 6C13.16 6 6 13.16 6 22C6 30.84 13.16 38 22 38C30.84 38 38 30.84 38 22C38 13.16 30.84 6 22 6Z" fill="rgba(255,255,255,0.95)"/>
              <path d="M27.5 16.5H19C17.9 16.5 17 17.4 17 18.5V19.5C17 20.6 17.9 21.5 19 21.5H25C26.1 21.5 27 22.4 27 23.5V25.5C27 26.6 26.1 27.5 25 27.5H16.5" stroke="#00A86B" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M22 14V16.5M22 27.5V30" stroke="#00A86B" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <h1 className="display text-4xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Cashland
          </h1>
          <p className="text-white/70 text-base mt-1.5 font-medium">
            Money moves better here.
          </p>
        </motion.div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/50"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
