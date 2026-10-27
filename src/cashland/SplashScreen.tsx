import { useEffect } from 'react';
import { motion } from 'framer-motion';


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
        {/* Full logo card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div
            className="rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ width: 280, height: 175, background: '#1a2744', border: '1.5px solid rgba(148,163,184,0.18)', boxShadow: '0 0 60px rgba(26,39,68,0.8), 0 12px 48px rgba(0,0,0,0.5)' }}
          >
            <img src="/brand/cashland-logo.svg" alt="Cashland" width="280" height="175" style={{ display: 'block' }} />
          </div>
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
