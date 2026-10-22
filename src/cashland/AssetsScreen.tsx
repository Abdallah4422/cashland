import { useState } from 'react';
import { TrendingUp, TrendingDown, Info, RefreshCw, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNaira } from './design';
import { useFxRates, loadCurrencyPref, saveCurrencyPref, formatUsdcAs, type Currency } from './useFxRates';
import CurrencyToggle from './CurrencyToggle';

const DEFAULT_USDC_BALANCE = 118.03;

const assets = [
  { symbol: 'USDC', name: 'USD Coin', balance: DEFAULT_USDC_BALANCE, change: '+0.01%', positive: true, color: '#2775CA', glow: 'rgba(39,117,202,0.3)' },
  { symbol: 'EURC', name: 'EUR Coin', balance: 0, change: '+0.01%', positive: true, color: '#003087', glow: 'rgba(0,48,135,0.3)' },
];

const FX_PAIRS = [
  { from: 'USDC', to: 'NGN', label: 'USD Coin → Naira' },
  { from: 'USDC', to: 'GBP', label: 'USD Coin → Pound' },
  { from: 'NGN', to: 'USD', label: 'Naira → US Dollar' },
  { from: 'GBP', to: 'NGN', label: 'Pound → Naira' },
];

export default function AssetsScreen({ liveUsdcBalance }: { liveUsdcBalance?: number }) {
  const [currency, setCurrency] = useState<Currency>(loadCurrencyPref);
  const { rates, updatedAt, isRefreshing, refresh } = useFxRates();

  const handleCurrencyChange = (c: Currency) => {
    saveCurrencyPref(c);
    setCurrency(c);
  };

  const USDC_BALANCE = liveUsdcBalance ?? DEFAULT_USDC_BALANCE;
  const totalValue = formatUsdcAs(USDC_BALANCE, currency, rates);
  const rateTime = updatedAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  function assetValue(usdcBalance: number): string {
    return formatUsdcAs(usdcBalance, currency, rates);
  }

  return (
    <div className="pb-24 pt-6" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 mb-4 flex items-start justify-between">
        <div>
          <h2 className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Assets</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Your onchain portfolio</p>
        </div>
        <CurrencyToggle value={currency} onChange={handleCurrencyChange} />
      </div>

      {/* Total value card */}
      <div className="mx-5 mb-5 rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d2137 0%, #0a1628 50%, #0c1c32 100%)',
          border: '1px solid rgba(0,168,107,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,168,107,0.1)',
        }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00A86B 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2775CA 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <p className="text-xs font-semibold mb-1 relative" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Portfolio Value</p>
        <motion.div
          key={`${currency}-${USDC_BALANCE}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="display text-3xl font-bold text-white tabular relative"
          style={{ letterSpacing: '-0.03em' }}
        >
          {totalValue}
        </motion.div>
        <div className="flex items-center justify-between mt-1 relative">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>≈ {USDC_BALANCE} USDC · Arc Mainnet</p>
          <button onClick={refresh}
            className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw size={11} style={{ color: 'rgba(255,255,255,0.6)' }} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{isRefreshing ? 'Updating…' : rateTime}</span>
          </button>
        </div>

        {/* Mini currency equivalents */}
        <div className="mt-3 pt-3 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-4">
            {(['NGN', 'USD', 'GBP'] as Currency[]).filter(c => c !== currency).map(c => (
              <div key={c}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{c}</p>
                <p className="text-sm font-semibold text-white tabular">{formatUsdcAs(USDC_BALANCE, c, rates)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="px-5 mb-5">
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Holdings</h3>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {assets.map((asset, i) => (
            <div key={asset.symbol}>
              <div className="flex items-center gap-3 px-4 py-4">
                {/* Coin icon */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold relative"
                  style={{ background: `radial-gradient(circle, ${asset.glow} 0%, rgba(0,0,0,0.3) 100%)`, border: `1.5px solid ${asset.color}40`, boxShadow: `0 0 12px ${asset.glow}` }}>
                  <span style={{ color: asset.color }}>{asset.symbol.slice(0, 1)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{asset.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {asset.positive
                      ? <TrendingUp size={11} style={{ color: '#00A86B' }} />
                      : <TrendingDown size={11} style={{ color: '#EF4444' }} />}
                    <span className="text-xs" style={{ color: asset.positive ? '#00A86B' : '#EF4444' }}>{asset.change}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>24h peg</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular" style={{ color: 'rgba(255,255,255,0.9)' }}>{asset.balance.toFixed(2)} {asset.symbol}</p>
                  <p className="text-xs mt-0.5 tabular font-medium" style={{ color: '#00A86B' }}>
                    {asset.balance > 0 ? assetValue(asset.balance) : formatNaira(0)}
                  </p>
                </div>
              </div>
              {i < assets.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Live FX Rates */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Live FX Rates</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00A86B' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Updates every 30s · {rateTime}</span>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {FX_PAIRS.map((pair, i) => {
            let rate = '';
            let change = '';
            if (pair.from === 'USDC' && pair.to === 'NGN') {
              rate = `₦${rates.NGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              change = '+0.08%';
            } else if (pair.from === 'USDC' && pair.to === 'GBP') {
              rate = `£${rates.GBP.toFixed(4)}`;
              change = '-0.02%';
            } else if (pair.from === 'NGN' && pair.to === 'USD') {
              rate = `$${(1 / rates.NGN).toFixed(6)}`;
              change = '+0.08%';
            } else {
              rate = `₦${(rates.NGN / rates.GBP).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              change = '+0.10%';
            }
            const positive = change.startsWith('+');
            return (
              <div key={pair.from + pair.to}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {pair.from.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{pair.from} / {pair.to}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{pair.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular" style={{ color: 'rgba(255,255,255,0.9)' }}>{rate}</p>
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      {positive
                        ? <ArrowUpRight size={10} style={{ color: '#00A86B' }} />
                        : <ArrowDownLeft size={10} style={{ color: '#EF4444' }} />}
                      <span className="text-xs" style={{ color: positive ? '#00A86B' : '#EF4444' }}>{change}</span>
                    </div>
                  </div>
                </div>
                {i < FX_PAIRS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remittance info banner */}
      <div className="mx-5 mb-5 rounded-2xl p-4" style={{ background: 'rgba(0,168,107,0.06)', border: '1px solid rgba(0,168,107,0.15)' }}>
        <div className="flex items-start gap-2.5">
          <Zap size={15} style={{ color: '#00A86B', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Powered by USDC on Arc Mainnet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              All Cashland payments settle in USDC onchain. Your family abroad can send GBP or USD — it arrives as Naira in seconds, with near-zero fees.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          {[
            { label: 'NGN rate', value: `₦${rates.NGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}` },
            { label: 'GBP rate', value: `£${rates.GBP.toFixed(4)}` },
            { label: 'Fee', value: 'Free' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</p>
              <p className="text-sm font-bold tabular" style={{ color: '#00A86B' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rate disclaimer */}
      <div className="mx-5 flex items-start gap-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Info size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Rates are indicative and update every 30 seconds. Settlement rates are locked at time of transaction.
        </p>
      </div>
    </div>
  );
}
