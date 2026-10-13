import { useReadContract, useAccount } from 'wagmi';
import { erc20Abi } from 'viem';
import { arcTestnet } from 'viem/chains';
import { getUsdc } from '@/onchain-facts';
import { Amount, usdcDecimalsFor } from '@/onchain-money';

const CHAIN_ID = arcTestnet.id;
const usdcFact = getUsdc(CHAIN_ID);

// Prototype NGN/USD rate — labelled clearly in UI
export const NGN_PER_USDC = 1559;

export function formatNgnFromUsdc(usdc: number): string {
  const ngn = usdc * NGN_PER_USDC;
  return '₦' + ngn.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function usdcToNgn(usdc: number): number {
  return usdc * NGN_PER_USDC;
}

export function ngnToUsdc(ngn: number): number {
  return ngn / NGN_PER_USDC;
}

export function useUsdcBalance() {
  const { address, isConnected } = useAccount();

  const { data: rawBalance, isLoading, refetch } = useReadContract({
    address: usdcFact?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: CHAIN_ID,
    query: {
      enabled: !!address && !!usdcFact,
      refetchInterval: 8000,
    },
  });

  const decimals = usdcDecimalsFor(CHAIN_ID);
  const usdcAmount = rawBalance != null
    ? Amount.fromRaw(rawBalance, decimals)
    : null;

  const usdcFloat = usdcAmount ? parseFloat(usdcAmount.toFixed(6)) : 0;
  const ngnFloat = usdcToNgn(usdcFloat);

  const formattedUsdc = usdcAmount ? usdcAmount.toFixed(2) : '0.00';
  const formattedNgn = '₦' + ngnFloat.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    isConnected,
    isLoading,
    usdcFloat,
    ngnFloat,
    formattedUsdc,
    formattedNgn,
    rawBalance: rawBalance,
    refetch,
  };
}
