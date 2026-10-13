import { useState } from 'react';
import { TrendingUp, TrendingDown, Info, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { glass, brandGradient, formatNaira } from './design';
import { useFxRates, loadCurrencyPref, saveCurrencyPref, formatUsdcAs, type Currency } from './useFxRates';
import CurrencyToggle from './CurrencyToggle';

const DEFAULT_USDC_BALANCE = 118.03;

const assets = [
  { symbol: 'USDC', name: 'USD Coin', balance: DEFAULT_USDC_BALANCE, change: '+0.01%', positive: true, color: '#2775CA', bg: '#EBF4FF' },
  { symbol: 'EURC', name: 'EUR Coin', balance: 0, change: '+0.01%', positive: true, color: '#003087', bg: '#EEF2FF' },
];

function CoinIcon({ symbol, color, bg }: { symbol: string; color: string; bg: string }) {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: bg, color, border: `1.5px solid ${color}30` }}>
      {symbol.slice(0, 1)}
    </div>
  );
}

const FX_PAIRS = [
  { from: 'USDC', to: 'NGN', flag: 'NG', label: 'US Dollar → Naira' },
  { from: 'USDC', to: 'GBP', flag: 'GB', label: 'US Dollar → Pound' },
  { from: 'NGN', to: 'USD', flag: 'US', label: 'Naira → US Dollar' },
  { from: 'GBP', to: 'NGN', flag: 'NG', label: 'Pound → Naira' },
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
    <div className="pb-24 pt-6">
      <div className="px-5 mb-4 flex items-start justify-between">
        <div>
          <h2 className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Assets</h2>
          <p className="text-sm" style={{ color: 'var(--subtle)' }}>Your digital asset balances</p>
        </div>
        <CurrencyToggle value={currency} onChange={handleCurrencyChange} />
      </div>

      {/* Total value card */}
      <div className="mx-5 mb-5 rounded-3xl p-5" style={{ background: brandGradient, boxShadow: '0 12px 32px rgba(0,168,107,0.30)' }}>
        <p className="text-sm font-medium text-white/70 mb-1">Total Portfolio Value</p>
        <motion.div
          key={`${currency}-${USDC_BALANCE}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="display text-3xl font-bold text-white tabular"
          style={{ letterSpacing: '-0.03em' }}
        >
          {totalValue}
        </motion.div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-white/70">≈ {USDC_BALANCE} USDC · Settled onchain</p>
          <button onClick={refresh} className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all active:scale-95" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <RefreshCw size={11} style={{ color: 'rgba(255,255,255,0.8)' }} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{isRefreshing ? 'Updating' : rateTime}</span>
          </button>
        </div>

        {/* Mini currency equivalents */}
        <div className="mt-3 pt-3 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
          {(['NGN', 'USD', 'GBP'] as Currency[]).filter(c => c !== currency).map(c => (
            <div key={c}>
              <p className="text-xs text-white/50">{c}</p>
              <p className="text-sm font-semibold text-white tabular">{formatUsdcAs(USDC_BALANCE, c, rates)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assets list */}
      <div className="px-5 mb-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Holdings</h3>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
          {assets.map((asset, i) => (
            <div key={asset.symbol}>
              <div className="flex items-center gap-3 px-4 py-4">
                <CoinIcon symbol={asset.symbol} color={asset.color} bg={asset.bg} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{asset.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {asset.positive
                      ? <TrendingUp size={11} style={{ color: 'var(--brand)' }} />
                      : <TrendingDown size={11} style={{ color: 'var(--error)' }} />
                    }
                    <span className="text-xs" style={{ color: asset.positive ? 'var(--brand)' : 'var(--error)' }}>
                      {asset.change}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>24h peg</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{asset.balance.toFixed(2)} {asset.symbol}</p>
                  <p className="text-xs mt-0.5 tabular font-medium" style={{ color: 'var(--brand)' }}>
                    {asset.balance > 0 ? assetValue(asset.balance) : formatNaira(0)}
                  </p>
                </div>
              </div>
              {i < assets.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* FX Rates panel */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Live FX Rates</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Indicative · {rateTime}</span>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={glass.card}>
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
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: '#F3F4F6', color: 'var(--ink)' }}>
                    {pair.from.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                      {pair.from} / {pair.to}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{pair.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular" style={{ color: 'var(--ink)' }}>{rate}</p>
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      {positive
                        ? <ArrowUpRight size={10} style={{ color: 'var(--brand)' }} />
                        : <ArrowDownLeft size={10} style={{ color: 'var(--error)' }} />
                      }
                      <span className="text-xs" style={{ color: positive ? 'var(--brand)' : 'var(--error)' }}>{change}</span>
                    </div>
                  </div>
                </div>
                {i < FX_PAIRS.length - 1 && <div className="mx-4 h-px" style={{ background: 'rgba(0,0,0,0.05)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remittance info banner */}
      <div className="mx-5 mb-5 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,168,107,0.08), rgba(91,108,246,0.06))', border: '1px solid rgba(0,168,107,0.12)' }}>
        <div className="flex items-start gap-2.5">
          <Info size={15} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>Powered by USDC settlement</p>
            <p className="text-xs text-pretty" style={{ color: 'var(--subtle)' }}>
              All Cashland payments settle in USDC onchain regardless of the display currency. Your family abroad can send GBP or USD — it arrives as Naira in seconds.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>NGN daily rate</p>
            <p className="text-sm font-bold tabular" style={{ color: 'var(--brand)' }}>₦{rates.NGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>GBP daily rate</p>
            <p className="text-sm font-bold tabular" style={{ color: 'var(--brand)' }}>£{rates.GBP.toFixed(4)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Fee</p>
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>Free</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-5 flex items-start gap-2.5 px-4 py-3.5 rounded-2xl" style={{ background: 'var(--brand-light)' }}>
        <Info size={15} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs text-pretty" style={{ color: 'var(--subtle)' }}>
          Rates are indicative and update every 30 seconds. Actual settlement rates are locked at the time of each transaction.
        </p>
      </div>
    </div>
  );
}
