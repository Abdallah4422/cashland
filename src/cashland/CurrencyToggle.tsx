// CurrencyToggle — NGN / USD / GBP pill switcher
import { motion } from 'framer-motion';
import { type Currency, CURRENCY_SYMBOLS, saveCurrencyPref } from './useFxRates';

interface Props {
  value: Currency;
  onChange: (c: Currency) => void;
  white?: boolean; // for use on dark/green backgrounds
}

const CURRENCIES: Currency[] = ['NGN', 'USD', 'GBP'];

export default function CurrencyToggle({ value, onChange, white = false }: Props) {
  const handleChange = (c: Currency) => {
    saveCurrencyPref(c);
    onChange(c);
  };

  return (
    <div
      className="inline-flex rounded-xl p-0.5 gap-0.5"
      style={{
        background: white ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)',
      }}
    >
      {CURRENCIES.map(c => {
        const active = c === value;
        return (
          <button
            key={c}
            onClick={() => handleChange(c)}
            className="relative px-2.5 py-1 rounded-[10px] text-xs font-bold transition-colors"
            style={{
              color: active
                ? white ? 'var(--brand)' : 'white'
                : white ? 'rgba(255,255,255,0.65)' : 'var(--subtle)',
              minWidth: 42,
            }}
          >
            {active && (
              <motion.div
                layoutId="currency-pill"
                className="absolute inset-0 rounded-[10px]"
                style={{ background: white ? 'white' : 'var(--brand)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{CURRENCY_SYMBOLS[c]}{c}</span>
          </button>
        );
      })}
    </div>
  );
}
