import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { sapphireHttpTransport, injectedWithSapphire } from "@oasisprotocol/sapphire-wagmi-v2";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";
import { sapphireTestnet } from "~~/utils/scaffold-eth/customChains";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Create transports object following Sapphire docs pattern
const createTransports = () => {
  const transports: Record<number, any> = {};
  
  // Add Sapphire transport for Sapphire networks
  transports[sapphireTestnet.id] = sapphireHttpTransport();
  
  // Add default transports for other networks
  enabledChains.forEach((chain) => {
    if (chain.id !== sapphireTestnet.id) {
      let rpcFallbacks = [http()];
      const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
      if (rpcOverrideUrl) {
        rpcFallbacks = [http(rpcOverrideUrl), http()];
      } else {
        const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
        if (alchemyHttpUrl) {
          const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
          rpcFallbacks = isUsingDefaultKey ? [http(), http(alchemyHttpUrl)] : [http(alchemyHttpUrl), http()];
        }
      }
      transports[chain.id] = fallback(rpcFallbacks);
    }
  });
  
  return transports;
};

export const wagmiConfig = createConfig({
  multiInjectedProviderDiscovery: false,
  chains: enabledChains,
  connectors: [injectedWithSapphire(), ...wagmiConnectors],
  transports: createTransports(),
  ssr: true,
});
