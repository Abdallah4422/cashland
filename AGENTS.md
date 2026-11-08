# Cashland

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Cashland is a Nigerian-first onchain payment wallet. Users send and receive money using phone numbers, CashTags (@musa), QR codes, or wallet addresses. Money is displayed in Nigerian Naira (NGN). Blockchain settlement runs invisibly underneath using USDC on Arc Mainnet.

## Deployed Contracts

### CashlandSafePay (Arc Mainnet)
- Address: `0x75d9f3fbd8290620b41693de2b8807ed8bec1ca5`
- Network: Arc Mainnet (Chain ID 5042)
- USDC: `0x3600000000000000000000000000000000000000`
- Explorer: https://explorer.arc.io/address/0x75d9f3fbd8290620b41693de2b8807ed8bec1ca5
- Deploy tx: 0x274e82569f10db6bd342a3bedf1ca002f9e74c964c6f42ad12089ec248801f22
- Deploy tx explorer: https://explorer.arc.io/tx/0x274e82569f10db6bd342a3bedf1ca002f9e74c964c6f42ad12089ec248801f22
- Deploy block: 712068 (sent to the CREATE2 proxy 0x4e59b44847b379578588920ca78fbf26c0b4956c)
- Deploying wallet (tx sender): `0xe89410922a00401a849b2c9661dccc4577ad3ad4` (confirm against Circle Console)
- On-chain owner: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (shared Arc Studio platform wallet, NOT controlled by the project team)
- OPEN ISSUE: nobody on the team can call owner-only functions (dispute resolution, emergencyWithdraw, transferOwnership) on this contract. Redeploy `contracts/CashlandSafePay_flat.sol` with constructor args (USDC `0x3600000000000000000000000000000000000000`, initialOwner = a wallet the team controls), then update this file, README.md and the app. Do this before real funds are locked in SafePay.

| Contract | Network | Address | Explorer |
|---|---|---|---|
| CashlandSafePay | Arc Testnet | 0x6633247663f5df37d422f2957e986df2f5f1fe55 | https://explorer.testnet.arc.io/address/0x6633247663f5df37d422f2957e986df2f5f1fe55 |

## Backend

- Render: https://db-url-sh27.onrender.com
- Database: Render PostgreSQL (cashland-db)
- GitHub: https://github.com/Abdallah4422/cashland

## Live Deployment

- Netlify: https://keen-profiterole-67c97a.netlify.app

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Mainnet (Chain ID: 5042, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Mainnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
