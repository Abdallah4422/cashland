import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { navyGradient } from './design';

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
      style={{ background: 'linear-gradient(160deg, #080f1a 0%, #0a1628 50%, #0c1c32 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,125,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }} />
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
            className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ background: '#0a1628', border: '1.5px solid rgba(0,168,107,0.35)', boxShadow: '0 0 40px rgba(0,168,107,0.25), 0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <img src="/brand/cashland-icon.svg" alt="Cashland" width="96" height="96" style={{ display: 'block' }} />
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
