// Cashland Design System — Arc Light edition
import type React from 'react';

// ── Glass surfaces ────────────────────────────────────────────────────────────
export const glass = {
  card: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '0 8px 32px rgba(18,45,69,0.09), inset 0 1px 0 rgba(255,255,255,0.70)',
  } as React.CSSProperties,
  inner: {
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(18,45,69,0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  pill: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(18,45,69,0.10)',
  } as React.CSSProperties,
  receipt: {
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(18,45,69,0.10)',
    boxShadow: '0 20px 60px rgba(18,45,69,0.12)',
  } as React.CSSProperties,
  sheet: {
    background: 'rgba(249,249,252,0.96)',
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
    border: '1px solid rgba(18,45,69,0.08)',
    boxShadow: '0 -8px 40px rgba(18,45,69,0.10)',
  } as React.CSSProperties,
};

// ── Gradients ─────────────────────────────────────────────────────────────────
// Arc Light canvas
export const arcCanvas = 'linear-gradient(180deg, #f9f9fc 0%, #fffcf7 52%, #fbf7f2 100%)';

// Primary CTA gradient — Arc dark navy
export const navyGradient = 'linear-gradient(135deg, #1a3a5c 0%, #122d45 60%, #0d2035 100%)';

// Hero balance card — warm navy with subtle depth
export const heroGradient = 'linear-gradient(145deg, #1a3a5c 0%, #122d45 55%, #0f2538 100%)';

// Cashland brand green — semantic / verified accent only
export const brandGradient = 'linear-gradient(135deg, #00c47d 0%, #00a86b 50%, #007a4d 100%)';
export const brandGradientLight = 'linear-gradient(135deg, #e6f7f1 0%, #d0f0e4 100%)';

// Spectral accent — used sparingly (2-4px strip, selected state only)
export const spectral = 'linear-gradient(90deg, #122d45, #1061a6, #00a86b, #85b1ed, #122d45)';

// ── Motion springs ────────────────────────────────────────────────────────────
export const springs = {
  sheet: { type: 'spring', stiffness: 400, damping: 40 } as const,
  card:  { type: 'spring', stiffness: 300, damping: 30 } as const,
  fade:  { duration: 0.2 } as const,
};

// ── Currency formatter ────────────────────────────────────────────────────────
export const formatNaira = (amount: number): string => {
  const abs = Math.abs(amount);
  const formatted = '₦' + abs.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? '-' + formatted : formatted;
};

// ── Contacts ──────────────────────────────────────────────────────────────────
// walletAddress values are Arc Testnet demo addresses
export const contacts = [
  { id: '1', name: 'Aisha',   surname: 'Bello',  tag: '@aisha',     phone: '0803 *** 4567', initials: 'AB', color: '#1061a6', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '2', name: 'David',   surname: 'Okafor', tag: '@david_ok',  phone: '0806 *** 2341', initials: 'DO', color: '#122d45', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '3', name: 'Abdul',   surname: 'Musa',   tag: '@abdulmusa', phone: '0701 *** 9823', initials: 'AM', color: '#00a86b', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '4', name: 'Chioma',  surname: 'Eze',    tag: '@chioma_e',  phone: '0810 *** 7761', initials: 'CE', color: '#334155', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
];
