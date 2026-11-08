# SafePay redeploy to Arc Mainnet

Mainnet transactions are irreversible. You deploy this yourself, from your own wallet, outside Arc Studio. Review everything below before you sign.

## What changed from the live contract

| Area | Live contract (`0x75d9...1ca5`) | New contract |
| --- | --- | --- |
| Owner | Shared Arc Studio platform wallet (nobody on the team can use it) | `0x8F416268f542CC64ADBC31555113ddbC6BdFE2CD` (Trust Wallet) |
| Emergency refund | Can refund a finished escrow a second time | Only works while an escrow is still Active or Disputed |
| Auto-release | Pays the seller even if they never engaged | Pays only a seller who engaged before the deadline |
| Late engagement | Seller can engage after the deadline | Blocked after the deadline |
| Payouts | Sent straight to the recipient | Credited as a balance. The recipient calls `withdraw()` |

The pull-payment change means a blocklisted USDC address cannot stop anyone else's settlement.

## Constructor values (in this order)

1. `usdcToken_`: `0x3600000000000000000000000000000000000000`
2. `initialOwner`: `0x8F416268f542CC64ADBC31555113ddbC6BdFE2CD`

ABI-encoded, if your tool asks for one string:

```
0x00000000000000000000000036000000000000000000000000000000000000000000000000000000000000008f416268f542cc64adbc31555113ddbc6bdfe2cd
```

## Files

- Source to compile: `contracts/CashlandSafePay_flat.sol` (contract name `CashlandSafePay`, Solidity 0.8.28, optimizer on, 200 runs)
- ABI: `contracts/safepay-abi.json`
- Creation bytecode (without constructor args): `contracts/safepay-bytecode.txt`
- Constructor args: `contracts/safepay-constructor-args.txt`

The flattened file compiles to the same code that was reviewed and tested (57 passing tests).

## Deploy

1. Fund the wallet that sends the deployment with a little USDC on Arc Mainnet. USDC pays the gas.
2. In Circle Console, deploy a contract on Arc Mainnet using the flattened source or the bytecode and ABI above. Menu names may differ from this guide.
3. Enter the two constructor values exactly as shown.
4. Copy the new contract address and the deployment transaction hash.

## Check it after deploying

On the explorer for the new address, read these and compare:

- `owner()` must be `0x8F416268f542CC64ADBC31555113ddbC6BdFE2CD`
- `usdcToken()` must be `0x3600000000000000000000000000000000000000`
- `nextSafePayId()` must be `1`
- `totalClaimable()` must be `0`

If any value is wrong, do not use the contract. Do not send it USDC.

## Known limits

- The owner can refund any escrow that is still Active or Disputed, and rules on disputes. Keep the owner wallet safe.
- If Circle blocklists an address, that address cannot withdraw its credited balance. It cannot block anyone else.
- A seller who never engages leaves the buyer's money in escrow until the buyer cancels or the owner refunds it.
- Automated review is not a substitute for an independent professional audit before real funds are locked.

## Then update the app

Give Arc Studio the new address and the deployment transaction hash. It updates `src/cashland/SafePayScreen.tsx`, `README.md` and `AGENTS.md`, then redeploys the app. Mark the old contract as superseded. It holds no escrow.
