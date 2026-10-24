# Cashland

A Nigerian-first onchain payment app where everyday users send, receive, and settle money in Naira — powered by USDC on Arc Mainnet under the hood.

Built with [Arc Studio](https://studio.arc.io)

---

## What it does

Cashland lets Nigerian users move money the way they already think about it: by phone number, CashTag (@handle), or QR code. The app shows everything in Nigerian Naira (NGN) with live FX rates. Users can also toggle the balance view to USD, EUR, or GBP at a tap.

Behind the scenes every transaction settles onchain as USDC on Arc — Circle's blockchain where USDC is the native gas token. Users never see a wallet address unless they go looking for one.

Key features:

- Send and receive money by phone number, CashTag, or QR code
- Balance displayed in NGN with real-time CoinGecko FX rate; toggle to USD / EUR / GBP
- SafePay escrow: buyer locks USDC, seller ships, buyer releases — dispute resolution built in
- Bills payment: airtime, data, electricity, TV subscription
- Withdraw to Nigerian bank account
- Pseudonymous onchain social feed showing live network activity
- Phone number OTP verification via Termii
- PIN-secured transactions
- Full dark navy UI, no crypto jargon

## Smart Contract

**CashlandSafePay** — escrow contract for peer-to-peer trade with dispute resolution.

| Network | Address | Explorer |
|---|---|---|
| Arc Mainnet | `0x75d9f3fbd8290620b41693de2b8807ed8bec1ca5` | [View on Arc Explorer](https://explorer.arc.io/address/0x75d9f3fbd8290620b41693de2b8807ed8bec1ca5) |
| Arc Testnet | `0x6633247663f5df37d422f2957e986df2f5f1fe55` | [View on Arc Testnet Explorer](https://explorer.testnet.arc.io/address/0x6633247663f5df37d422f2957e986df2f5f1fe55) |

Built with OpenZeppelin 5.1.0: `Ownable2Step`, `ReentrancyGuard`, `SafeERC20`. Audited and deployed on Arc Mainnet.

## Live Demo

- Frontend: [https://keen-profiterole-67c97a.netlify.app](https://keen-profiterole-67c97a.netlify.app)
- Backend API: [https://db-url-sh27.onrender.com](https://db-url-sh27.onrender.com)

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Onchain:** wagmi v2, viem v2, ConnectKit, USDC on Arc Mainnet (Chain ID 5042)
- **Contracts:** Solidity 0.8.28, Foundry, OpenZeppelin 5.1.0
- **Backend:** Bun, Express-style server, PostgreSQL (Render)
- **Notifications:** Termii SMS OTP
- **Payments:** Paystack (NGN card/bank top-up)
- **FX rates:** CoinGecko live API

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.1+
- [Foundry](https://getfoundry.sh) (for contract work)
- Node 20+ (for type checking)

### Install

```bash
bun install
```

### Environment variables

| Variable | Purpose |
|---|---|
| `TERMII_API_KEY` | Termii SMS OTP — required for phone verification |
| `TERMII_SENDER_ID` | Termii sender name (set to `Cashland`) |
| `PAYSTACK_SECRET_KEY` | Paystack NGN payments |
| `CIRCLE_API_KEY` | Circle developer API — USDC wallet operations |
| `CIRCLE_ENTITY_SECRET` | Circle entity secret — registered once per Circle entity |
| `NGN_PER_USDC` | Fallback NGN/USDC rate when CoinGecko is unavailable |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Backend server port (default 3001) |
| `RENDER` | Set to `true` on Render to enable SSL for Postgres |
| `VITE_API_BASE_URL` | Backend base URL for the frontend (set in Netlify dashboard) |

`CIRCLE_API_KEY` and `CIRCLE_ENTITY_SECRET` are provisioned via Arc Studio and are not needed to run the frontend-only demo.

### Run locally

```bash
# Frontend (port 5173)
bun run dev

# Backend (port 3001) — requires DATABASE_URL
bun run server
```

### Build

```bash
bun run build
```

### Contracts

```bash
# Build
bun run contracts:build

# Test
bun run contracts:test
```

## DoraHacks / Arc Micro Grants

Cashland is submitted to the [Arc Micro Grants](https://community.arc.io/public/events/arc-microgrants-f8tijfjhyq) program.

Arc is the right chain for this use case: USDC as the native gas token means Nigerian users pay transaction fees in the same stablecoin they are already moving — no ETH, no BNB, no volatile gas asset to explain. Fees are stable and predictable. Finality is sub-second. That combination makes onchain settlement invisible to end users, which is the whole point.
