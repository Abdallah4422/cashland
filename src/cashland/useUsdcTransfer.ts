import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { erc20Abi, isAddress } from 'viem';
import { arcTestnet } from 'viem/chains';
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts';
import { parseAmount } from '@/onchain-money';

const CHAIN_ID = arcTestnet.id;
const usdcFact = getUsdc(CHAIN_ID);

export type TransferStatus =
  | 'idle'
  | 'wrong-chain'
  | 'signing'       // waiting for wallet signature
  | 'confirming'    // tx submitted, waiting for block
  | 'success'
  | 'error';

export function parseOnchainError(error: unknown): string {
  const msg = (error as Error)?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || msg.includes('denied')) return 'cancelled';
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
    return 'Not enough USDC. Please add funds and try again.';
  }
  if (msg.includes('reverted')) return 'Transaction failed on-chain. Please try again.';
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Check your connection.';
  return 'Something went wrong. Please try again.';
}

export function useUsdcTransfer() {
  const { chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const {
    writeContract,
    data: hash,
    isPending: isSigning,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const isWrongChain = !!chainId && chainId !== CHAIN_ID;

  let status: TransferStatus = 'idle';
  if (isWrongChain) status = 'wrong-chain';
  else if (isSigning) status = 'signing';
  else if (isConfirming) status = 'confirming';
  else if (isSuccess) status = 'success';
  else if (writeError || receiptError) status = 'error';

  const error = writeError || receiptError;
  const parsedError = error ? parseOnchainError(error) : null;

  // User cancelled — not really an error, just reset
  const isCancelled = parsedError === 'cancelled';

  const explorerUrl = hash ? buildTxExplorerUrl(CHAIN_ID, hash) : null;

  const send = (recipientAddress: string, ngnAmount: number) => {
    if (!usdcFact) return;
    if (!isAddress(recipientAddress)) return;

    if (isWrongChain) {
      switchChain({ chainId: CHAIN_ID });
      return;
    }

    // Convert NGN → USDC → raw units
    const usdcAmount = ngnAmount / 1559; // same rate as useUsdcBalance
    const usdcString = usdcAmount.toFixed(6);
    const parsed = parseAmount(CHAIN_ID, usdcString);

    writeContract({
      address: usdcFact.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, parsed.raw],
      chainId: CHAIN_ID,
    });
  };

  return {
    send,
    status,
    hash,
    explorerUrl,
    isSwitching,
    parsedError,
    isCancelled,
    reset,
  };
}
