import { defineChain } from "viem";

export const sapphireTestnet = defineChain({
  id: 0x5aff,
  name: "Sapphire Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "TEST",
    symbol: "TEST",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.sapphire.oasis.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Oasis Sapphire Testnet Explorer",
      url: "https://testnet.explorer.sapphire.oasis.io",
    },
  },
  testnet: true,
});