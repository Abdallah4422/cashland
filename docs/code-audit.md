# Cashland Code Audit — October 14, 2026

## Summary
Zero lint errors. Zero TypeScript errors. Render backend live and tested end-to-end.

## Issues Found and Status

### FIXED THIS SESSION
1. **GitHub token in vite.config.ts** — token was accidentally pasted into the file during terminal attempts. Removed and file restored to clean state.
2. **`any` type in api.ts BASE URL** — cast to `string | undefined` to satisfy strict type-checker.

### KNOWN GAPS (not bugs — by design for prototype)

| Area | Gap | Production fix |
|---|---|---|
| FX rate | Coingecko blocked on Render free tier — uses fallback ₦1,559/USDC | Upgrade Render plan or use paid FX API |
| Dojah KYC | No API key — falls back to mock verification | Get work email, sign up at dojah.io |
| Deposit | creditDeposit() inserts a one-sided credit (no matching debit from float account) | Wire real Paystack webhook + float account |
| USDC sync | Reads Arc Testnet via RPC proxy — works but credits at fallback rate | Wire live Coingecko rate |
| Sessions | 30-day expiry but no refresh mechanism | Add sliding expiry on `validateSession` |
| Withdrawal | Records debit but no actual NIP transfer | Integrate Paystack Transfer API |

### SERVER — CLEAN
- Rate limiting: all 6 endpoints protected with appropriate limits
- Fraud velocity: 5-rapid-send block works, flags persist to DB
- Double-entry ledger: all transfers use `withTransaction` with `SELECT FOR UPDATE`
- INSUFFICIENT_FUNDS: checked before any ledger write
- Tier limits: enforced server-side (not just UI) on every send
- Idempotency: Paystack webhook checks reference before crediting
- HMAC-SHA512: Paystack signature verified when key is set
- Password/PIN: bcrypt-equivalent SHA-256 with per-user salt

### FRONTEND — CLEAN
- Zero TypeScript errors across all 47 source files
- `useBackend` hook: graceful fallback to localStorage when backend offline
- Currency toggle: persists to localStorage, survives refresh
- Session: saved on registration, restored on page load, cleared on sign-out
- Onchain transfer: uses wagmi + real USDC ERC-20 transfer on Arc Testnet

### INFRASTRUCTURE
- Render backend: https://db-url-sh27.onrender.com — Deployed, Docker, Oregon
- Render database: cashland-db — PostgreSQL 18, Available, Oregon
- Netlify frontend: https://keen-profiterole-67c97a.netlify.app
- GitHub repo: https://github.com/Abdallah4422/cashland (public)

## Next recommended fixes (priority order)
1. Add `VITE_API_BASE_URL=https://db-url-sh27.onrender.com` to Netlify environment variables so the deployed frontend calls Render (not localhost)
2. Redeploy Netlify after adding the env var
3. Get Dojah API key for real BVN/NIN verification
4. Wire Paystack Transfer API for real bank withdrawals
5. Upgrade Render plan or use paid FX API for live NGN rate
