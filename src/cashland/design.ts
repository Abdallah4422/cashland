// Cashland Design System
import type React from 'react';

export const glass = {
  card: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '0 8px 32px rgba(0,60,30,0.09), inset 0 1px 0 rgba(255,255,255,0.60)',
  } as React.CSSProperties,
  inner: {
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  pill: {
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.75)',
  } as React.CSSProperties,
  receipt: {
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(0,168,107,0.12)',
    boxShadow: '0 20px 60px rgba(0,60,30,0.14)',
  } as React.CSSProperties,
};

export const brandGradient = 'linear-gradient(135deg, #00C47D 0%, #00A86B 50%, #007A4D 100%)';
export const brandGradientLight = 'linear-gradient(135deg, #E6F7F1 0%, #D0F0E4 100%)';
export const spectral = 'linear-gradient(90deg, #00C47D, #5fbeff, #af8ff4, #f05c6b, #ffcd83)';

export const springs = {
  sheet: { type: 'spring', stiffness: 400, damping: 40 } as const,
  card: { type: 'spring', stiffness: 300, damping: 30 } as const,
  fade: { duration: 0.2 } as const,
};

export const formatNaira = (amount: number): string => {
  const abs = Math.abs(amount);
  const formatted = '₦' + abs.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? '-' + formatted : formatted;
};

// walletAddress values are Arc Testnet demo addresses — users can override
// with any real address via the "Send to wallet address" option in the send flow.
export const contacts = [
  { id: '1', name: 'Aisha', surname: 'Bello', tag: '@aisha', phone: '0803 *** 4567', initials: 'AB', color: '#F97316', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '2', name: 'David', surname: 'Okafor', tag: '@david_ok', phone: '0806 *** 2341', initials: 'DO', color: '#8B5CF6', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '3', name: 'Abdul', surname: 'Musa', tag: '@abdulmusa', phone: '0701 *** 9823', initials: 'AM', color: '#EC4899', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
  { id: '4', name: 'Chioma', surname: 'Eze', tag: '@chioma_e', phone: '0810 *** 7761', initials: 'CE', color: '#0EA5E9', walletAddress: '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' },
];
