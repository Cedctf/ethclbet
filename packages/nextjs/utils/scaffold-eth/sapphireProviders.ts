import { BrowserProvider } from 'ethers';
import { wrapEthersSigner } from '@oasisprotocol/sapphire-ethers-v6';
import { wrapEthereumProvider } from '@oasisprotocol/sapphire-paratime';
import { createWalletClient } from 'viem';
import { wrapWalletClient, sapphireHttpTransport } from '@oasisprotocol/sapphire-viem-v2';
import { sapphireTestnet } from './customChains';

/**
 * Wrap the Ethereum provider with Sapphire encryption
 */
export const getSapphireProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return wrapEthereumProvider(window.ethereum);
  }
  return null;
};

/**
 * Get a wrapped Ethers signer for Sapphire encrypted transactions
 */
export const getSapphireEthersSigner = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const wrappedSigner = wrapEthersSigner(
      await new BrowserProvider(window.ethereum).getSigner()
    );
    return wrappedSigner;
  }
  return null;
};

/**
 * Get a wrapped Viem wallet client for Sapphire encrypted transactions
 */
export const getSapphireViemWalletClient = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const walletClient = createWalletClient({
      chain: sapphireTestnet,
      transport: sapphireHttpTransport(),
    });
    
    return await wrapWalletClient(walletClient);
  }
  return null;
};

/**
 * Check if we're on a Sapphire network
 */
export const isSapphireNetwork = (chainId: number) => {
  return chainId === sapphireTestnet.id || chainId === 0x5afe; // sapphire mainnet
};