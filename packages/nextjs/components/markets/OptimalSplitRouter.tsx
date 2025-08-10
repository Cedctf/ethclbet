"use client";

import { useState, useEffect } from 'react';
import { CombinedMarket, NormalizedMarket } from '~~/hooks/useCombinedMarkets';
import { 
  findOptimalSplit, 
  generateOrderBookFromStats, 
  generateLMSRFromStats,
  type MarketStatistics,
  type OrderBookData,
  type LMSRData,
  type SplitResult
} from '~~/optimal-split-router';
import { parseEther, formatEther } from "viem";
import { useAccount, useChainId, useBalance } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getSapphireProvider, getSapphireEthersSigner, isSapphireNetwork } from "~~/utils/scaffold-eth/sapphireProviders";
import { ethers } from "ethers";


interface OptimalSplitRouterProps {
  market: CombinedMarket | NormalizedMarket;
}

interface OptimalSplitResponse {
  success: boolean;
  result?: {
    orderBookAllocation: number;
    lmsrAllocation: number;
    orderBookShares: number;
    lmsrShares: number;
    totalShares: number;
    totalCost: number;
    strategy: string;
    efficiency: {
      costPerShare: number;
      allocationRatio: {
        orderBookPercent: number;
        lmsrPercent: number;
      };
    };
    platformData: {
      orderBook: {
        orderLevels: number;
        totalLiquidity: number;
        priceRange: {
          min: number;
          max: number;
        };
      };
      lmsr: {
        yesShares: number;
        noShares: number;
        liquidityParameter: number;
      };
    };
  };
    error?: string;
}

interface PriceConversion {
  usdAmount: number;
  ethUsdPrice: number;
  ethEquivalent: number;
  usingFallback?: boolean;
}

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: deployedContractData } = useDeployedContractInfo("SimpleBet");
  
  // Get user balance
  const { data: userBalance } = useBalance({
    address: address,
  });
  
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Betting outcome selection
  const [betOutcome, setBetOutcome] = useState(0); // 0 = YES, 1 = NO
  const [betDescription, setBetDescription] = useState("");
  
  // Cross-chain bet results
  const [crossChainResults, setCrossChainResults] = useState<any[]>([]);
  const [isPlacingCrossChainBet, setIsPlacingCrossChainBet] = useState(false);
  const [sapphireResult, setSapphireResult] = useState<any>(null);
  
  // Adjustable allocations (user can modify these)
  const [adjustedPolymarketAllocation, setAdjustedPolymarketAllocation] = useState<number>(0);
  const [adjustedOmenAllocation, setAdjustedOmenAllocation] = useState<number>(0);

  // Price conversion data
  const [priceData, setPriceData] = useState<{
    polymarketEth: number;
    omenEth: number;
    totalEth: number;
    ethUsdPrice: number;
    usingFallback?: boolean;
  } | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Check if we're on a Sapphire network for encrypted transactions
  const isOnSapphire = chainId ? isSapphireNetwork(chainId) : false;

  // Contract interactions
  const { writeContractAsync: placeBet, isMining: isPlacingBet } = useScaffoldWriteContract({
    contractName: "SimpleBet",
  });

  // Sapphire-specific contract interaction function
  const placeBetWithSapphire = async (description: string, outcome: number, platforms: string[], amounts: bigint[], marketIds: string[], totalValue: bigint) => {
    if (!deployedContractData) throw new Error("Contract not deployed");
    
    // Use getSapphireProvider for encrypted transactions
    const sapphireProvider = getSapphireProvider();
    if (!sapphireProvider) throw new Error("Failed to get Sapphire provider");
    
    const signer = await getSapphireEthersSigner();
    if (!signer) throw new Error("Failed to get Sapphire signer");
    
    const contract = new ethers.Contract(deployedContractData.address, deployedContractData.abi, signer);
    const tx = await contract.placeBet(description, outcome, platforms, amounts, marketIds, { value: totalValue });
    return await tx.wait();
  };

  // Cross-chain bet placement function
  const placeCrossChainBet = async (userAddress: string, polymarketAmount: number, omenAmount: number) => {
    try {
      // Configuration for different chains
      const CHAINS = {
        gnosis: {
          name: 'Gnosis Testnet',
          chainId: 10200,
          contractAddress: '0x04F367D5aa61617C541136632B1227a74CEEF18e',
          rpcUrl: 'https://gnosis-chiado.g.alchemy.com/v2/6U7t79S89NhHIspqDQ7oKGRWp5ZOfsNj',
          explorerTx: (hash: string) => `https://gnosis-chiado.blockscout.com/tx/${hash}`
        },
        polygon: {
          name: 'Polygon Amoy',
          chainId: 80002,
          contractAddress: '0xbd83b1126C4A2885619C793634a929FF1146dE1d',
          rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/6U7t79S89NhHIspqDQ7oKGRWp5ZOfsNj',
          explorerTx: (hash: string) => `https://amoy.polygonscan.com/tx/${hash}`
        }
      };

      // Minimal ABI for PayToContract
      const ABI = [
        'function pay(address user, uint256 priceWei) payable',
      ];

      // Private keys for cross-chain transactions
      // Different private keys for different chains
      const GNOSIS_PRIVATE_KEY = '0x7c1ecc9314f6d75259fed6e1714d9bd74478f422013d71289d2839fec2972384';
      const POLYGON_PRIVATE_KEY = '0x2a29ac35545d1fe2666f36d5d7976b8b379472d27c226de17777b765dc35633c';
      
      // Validate private keys
      if (!GNOSIS_PRIVATE_KEY || !POLYGON_PRIVATE_KEY) {
        throw new Error('Private keys not found');
      }
      
      if (!ethers.isHexString(GNOSIS_PRIVATE_KEY, 32) || !ethers.isHexString(POLYGON_PRIVATE_KEY, 32)) {
        throw new Error('Invalid private key format. Must be 32-byte hex strings starting with 0x');
      }
      
      // Validate private key lengths (should be 64 hex characters + 0x prefix = 66 characters total)
      if (GNOSIS_PRIVATE_KEY.length !== 66 || POLYGON_PRIVATE_KEY.length !== 66) {
        throw new Error('Invalid private key length. Must be exactly 66 characters (0x + 64 hex chars)');
      }

      const results: any[] = [];

      // Helper function to place bet on a specific chain
      const placeBetOnChain = async (chainConfig: any, amountUsd: number, chainName: string) => {
        try {
          // Convert USD amount to ETH (using current price data)
          const ethAmount = priceData ? (amountUsd / priceData.ethUsdPrice) : (amountUsd / 2000); // fallback price
          const amountWei = ethers.parseEther(ethAmount.toString());
          
          console.log(`🚀 Placing bet on ${chainName}: ${amountUsd} USD (${ethAmount} ETH)`);
          
          // Create provider and signer for the specific chain
          const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          
          // Use appropriate private key for each chain
          const privateKey = chainName === 'Gnosis' ? GNOSIS_PRIVATE_KEY : POLYGON_PRIVATE_KEY;
          const wallet = new ethers.Wallet(privateKey, provider);
          const contract = new ethers.Contract(chainConfig.contractAddress, ABI, wallet);
          
          // Get fee data for EIP-1559 if available
          const feeData = await provider.getFeeData();
          const overrides: any = {};
          
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            overrides.maxFeePerGas = feeData.maxFeePerGas;
            overrides.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
          } else if (feeData.gasPrice) {
            overrides.gasPrice = feeData.gasPrice;
          }
          
          // Gas estimate + safety margin
          const gasEstimate = await contract.pay.estimateGas(userAddress, amountWei, { value: amountWei, ...overrides });
          const gasLimit = gasEstimate + (gasEstimate / 5n); // +20% buffer
          
          console.log(`⛽ [${chainName}] gas estimate: ${gasEstimate} → using gasLimit ${gasLimit}`);
          
          const tx = await contract.pay(userAddress, amountWei, { 
            value: amountWei, 
            gasLimit, 
            ...overrides 
          });
          
          console.log(`🚀 [${chainName}] sent: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(`✅ [${chainName}] confirmed in block ${receipt.blockNumber}`);
          
          return {
            chain: chainName,
            success: true,
            hash: tx.hash,
            amount: amountUsd,
            ethAmount,
            explorer: chainConfig.explorerTx(tx.hash),
            blockNumber: receipt.blockNumber
          };
        } catch (error) {
          console.error(`❌ ${chainName} bet failed:`, error);
          return {
            chain: chainName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      };

      // Place bets on both chains in parallel
      const betPromises = [];
      
      if (polymarketAmount > 0) {
        betPromises.push(placeBetOnChain(CHAINS.gnosis, polymarketAmount, 'Gnosis'));
      }
      
      if (omenAmount > 0) {
        betPromises.push(placeBetOnChain(CHAINS.polygon, omenAmount, 'Polygon'));
      }
      
      // Wait for all bets to complete
      const betResults = await Promise.all(betPromises);
      results.push(...betResults);

      return results;
    } catch (error) {
      console.error('Cross-chain bet placement error:', error);
      throw error;
    }
  };

  // Helper to check if market is combined
  const isCombinedMarket = (market: CombinedMarket | NormalizedMarket): market is CombinedMarket => {
    return 'combinedVolume' in market;
  };

  // Extract market statistics from market data
  const extractMarketStats = (marketData: any, source: 'polymarket' | 'omen') => {
    if (!marketData) return null;

    // For individual markets with source
    if (marketData.source === source) {
      return {
        id: marketData.id,
        tradesQuantity: marketData.tradesQuantity || '0',
        buysQuantity: marketData.buysQuantity || '0',
        sellsQuantity: marketData.sellsQuantity || '0',
        scaledCollateralVolume: marketData.scaledCollateralVolume?.toString() || '0',
        scaledCollateralBuyVolume: marketData.scaledCollateralBuyVolume?.toString() || '0',
        scaledCollateralSellVolume: marketData.scaledCollateralSellVolume?.toString() || '0',
      };
    }

    // For combined markets, extract from nested data
    if (source === 'polymarket' && marketData.polymarketMarket) {
      const pm = marketData.polymarketMarket;
      return {
        id: pm.id,
        tradesQuantity: pm.tradesQuantity || pm.rawData?.orderbook?.tradesQuantity || '0',
        buysQuantity: pm.buysQuantity || pm.rawData?.orderbook?.buysQuantity || '0',
        sellsQuantity: pm.sellsQuantity || pm.rawData?.orderbook?.sellsQuantity || '0',
        scaledCollateralVolume: pm.scaledCollateralVolume?.toString() || pm.rawData?.orderbook?.scaledCollateralVolume || '0',
        scaledCollateralBuyVolume: pm.scaledCollateralBuyVolume?.toString() || pm.rawData?.orderbook?.scaledCollateralBuyVolume || '0',
        scaledCollateralSellVolume: pm.scaledCollateralSellVolume?.toString() || pm.rawData?.orderbook?.scaledCollateralSellVolume || '0',
      };
    }

    if (source === 'omen' && marketData.omenMarket) {
      const om = marketData.omenMarket;
      return {
        id: om.id,
        tradesQuantity: om.tradesQuantity || '0',
        buysQuantity: om.buysQuantity || '0',
        sellsQuantity: om.sellsQuantity || '0',
        scaledCollateralVolume: om.scaledCollateralVolume?.toString() || om.rawData?.market?.scaledCollateralVolume || '0',
        scaledCollateralBuyVolume: om.scaledCollateralBuyVolume?.toString() || '0',
        scaledCollateralSellVolume: om.scaledCollateralSellVolume?.toString() || '0',
      };
    }

    return null;
  };

  // Convert USD to ETH using Pyth price feed with robust fallback handling
  const convertToEth = async (polymarketUsd: number, omenUsd: number) => {
    setIsLoadingPrice(true);
    try {
      // Helper function to get price data with fallback
      const getPriceData = async (usdAmount: number, platform: string): Promise<PriceConversion> => {
        const response = await fetch('/api/pyth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usdAmount })
        });
        
        const data = await response.json();
        
        // Check if we got valid data structure
        if (data && typeof data.ethUsdPrice === 'number' && typeof data.ethEquivalent === 'number') {
          return data;
        }
        
        // If data is invalid, throw to trigger manual fallback
        throw new Error(`Invalid data structure from API for ${platform}`);
      };

      // Get price data for both platforms with fallback handling
      const [polymarketData, omenData] = await Promise.all([
        getPriceData(polymarketUsd, 'Polymarket'),
        getPriceData(omenUsd, 'Omen')
      ]);

      // Log if fallback price is being used
      if (polymarketData.usingFallback || omenData.usingFallback) {
        console.log(`Using fallback ETH price: $${polymarketData.ethUsdPrice.toLocaleString()}`);
      }

      // Set price data - values are guaranteed to be valid numbers at this point
      setPriceData({
        polymarketEth: polymarketData.ethEquivalent,
        omenEth: omenData.ethEquivalent,
        totalEth: polymarketData.ethEquivalent + omenData.ethEquivalent,
        ethUsdPrice: polymarketData.ethUsdPrice,
        usingFallback: polymarketData.usingFallback || omenData.usingFallback
      });

    } catch (err) {
      console.error('Price conversion error:', err);
      setError('Failed to convert USD to ETH. Please try again.');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleOptimalSplit = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);
    setPriceData(null);

    try {
      // Extract market statistics for both platforms
      const polymarketStats = extractMarketStats(market, 'polymarket');
      const omenStats = extractMarketStats(market, 'omen');

      if (!polymarketStats && !omenStats) {
        throw new Error('No market data available for optimization');
      }

      // Prepare the request body for the optimal split API
      const requestBody = {
        budget,
        polymarketStats,
        omenStats
      };

      console.log('Calling optimal split API with:', requestBody);

      // Call the optimal split API from the server (port 3001)
      const response = await fetch('http://localhost:3001/api/optimal-split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        
        // Try to parse as JSON, fallback to text error
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to calculate optimal split';
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data: OptimalSplitResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      if (data.result) {
        setResult(data.result);
        // Initialize adjustable values with optimal split
        setAdjustedPolymarketAllocation(data.result.orderBookAllocation);
        setAdjustedOmenAllocation(data.result.lmsrAllocation);
        
        // Set default bet description based on market title
        let marketTitle = 'Optimal Split Bet';
        
        if (isCombinedMarket(market)) {
          // For combined markets, prefer the main title
          marketTitle = market.title || 'Combined Market Bet';
        } else {
          // For individual markets
          marketTitle = market.title || 'Market Bet';
        }
        
        // Extract only the first part before "-" if it exists
        const titleBeforeDash = marketTitle.split('-')[0].trim();
        setBetDescription(titleBeforeDash);
        
        // Convert to ETH
        await convertToEth(data.result.orderBookAllocation, data.result.lmsrAllocation);
        
        // Save optimal split output to history for AI training
        await saveOptimalSplitToHistory(data.result);
        
        console.log('Optimal split result:', data.result);
      } else {
        throw new Error('No optimization result returned');
      }

    } catch (err) {
      console.error('Optimization error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during optimization');
    } finally {
      setIsCalculating(false);
    }
  };

  // Save optimal split output to history for AI training
  const saveOptimalSplitToHistory = async (optimalSplitResult: any) => {
    try {
      // Extract market statistics for both platforms
      const polymarketStats = extractMarketStats(market, 'polymarket');
      const omenStats = extractMarketStats(market, 'omen');

      // Prepare market info
      let marketInfo: any = {};
      if (isCombinedMarket(market)) {
        marketInfo = {
          title: market.title,
          question: market.title, // Use title as question for combined markets
          source: 'combined',
          category: 'combined'
        };
      } else {
        marketInfo = {
          title: market.title,
          question: market.title, // Use title as question for individual markets
          source: market.source,
          category: 'individual'
        };
      }

      const saveData = {
        userId: address || 'anonymous',
        budget,
        polymarketStats,
        omenStats,
        optimalSplit: optimalSplitResult,
        priceData,
        betOutcome,
        betDescription,
        marketInfo
      };

      const response = await fetch('/api/saveoutput', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        console.warn('Failed to save optimal split to history:', await response.text());
      } else {
        const saveResult = await response.json();
        console.log('Optimal split saved to history:', saveResult);
      }
    } catch (error) {
      console.warn('Error saving optimal split to history:', error);
      // Don't throw error as this is not critical for the main functionality
    }
  };

  // Generate JSON format for display
  const generateOptimalSplitJSON = () => {
    if (!result || !priceData) return null;

    return {
      optimal_split: {
        total_budget_usd: budget,
        total_budget_eth: priceData.totalEth,
        eth_usd_price: priceData.ethUsdPrice,
        bet_outcome: betOutcome === 0 ? "YES" : "NO",
        allocations: {
          polymarket: {
            platform: "Polymarket",
            type: "Order Book",
            allocation_usd: adjustedPolymarketAllocation,
            allocation_eth: priceData.polymarketEth,
            allocation_percent: (adjustedPolymarketAllocation / budget) * 100,
            shares: result.orderBookShares,
            avg_price_per_share_usd: adjustedPolymarketAllocation / result.orderBookShares,
            avg_price_per_share_eth: priceData.polymarketEth / result.orderBookShares
          },
          omen: {
            platform: "Omen",
            type: "LMSR AMM",
            allocation_usd: adjustedOmenAllocation,
            allocation_eth: priceData.omenEth,
            allocation_percent: (adjustedOmenAllocation / budget) * 100,
            shares: result.lmsrShares,
            avg_price_per_share_usd: adjustedOmenAllocation / result.lmsrShares,
            avg_price_per_share_eth: priceData.omenEth / result.lmsrShares
          }
        },
        summary: {
          total_shares: result.totalShares,
          total_cost_usd: adjustedPolymarketAllocation + adjustedOmenAllocation,
          total_cost_eth: priceData.totalEth,
          cost_per_share_usd: (adjustedPolymarketAllocation + adjustedOmenAllocation) / result.totalShares,
          cost_per_share_eth: priceData.totalEth / result.totalShares,
          strategy: result.strategy
        }
      }
    };
  };

  // Handle adjustment changes and recalculate ETH
  const handlePolymarketChange = async (value: number) => {
    setAdjustedPolymarketAllocation(value);
    setAdjustedOmenAllocation(budget - value);
    
    // Recalculate ETH conversion for adjusted amounts
    if (priceData) {
      await convertToEth(value, budget - value);
    }
  };

  const handleOmenChange = async (value: number) => {
    setAdjustedOmenAllocation(value);
    setAdjustedPolymarketAllocation(budget - value);
    
    // Recalculate ETH conversion for adjusted amounts
    if (priceData) {
      await convertToEth(budget - value, value);
    }
  };

  // Place Bet with Optimal Split
  const handlePlaceBet = async () => {
    if (!isConnected) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!betDescription.trim()) {
      notification.error("Please enter a bet description");
      return;
    }

    if (!priceData) {
      notification.error("Price data not loaded. Please calculate optimal split first.");
      return;
    }

    if (adjustedPolymarketAllocation <= 0 && adjustedOmenAllocation <= 0) {
      notification.error("Please allocate funds to at least one platform");
      return;
    }

    try {
      // Prepare subbet data
      const platforms: string[] = [];
      const amounts: bigint[] = [];
      const marketIds: string[] = [];

      // Add Polymarket subbet if allocation > 0
      if (adjustedPolymarketAllocation > 0) {
        platforms.push("Polymarket");
        const polymarketAmount = parseEther(priceData.polymarketEth.toString());
        amounts.push(polymarketAmount);
        
        // Get market ID from the market data
        const polymarketStats = extractMarketStats(market, 'polymarket');
        const marketId = polymarketStats?.id;
        if (!marketId) {
          throw new Error("Polymarket market ID not found");
        }
        marketIds.push(marketId);
      }

      // Add Omen subbet if allocation > 0
      if (adjustedOmenAllocation > 0) {
        platforms.push("Omen");
        const omenAmount = parseEther(priceData.omenEth.toString());
        amounts.push(omenAmount);
        
        // Get market ID from the market data
        const omenStats = extractMarketStats(market, 'omen');
        const marketId = omenStats?.id;
        if (!marketId) {
          throw new Error("Omen market ID not found");
        }
        marketIds.push(marketId);
      }

      // Calculate totalValue as the sum of all amounts to avoid precision issues
      const totalValue = amounts.reduce((sum, amount) => sum + amount, 0n);

      // Check if user has sufficient balance
      if (userBalance && userBalance.value < totalValue) {
        notification.error(`Insufficient balance. You need ${formatEther(totalValue)} TEST but only have ${formatEther(userBalance.value)} TEST`);
        return;
      }

      let txHash: string;

      if (isOnSapphire) {
        // Use Sapphire encrypted transactions
        notification.info("🔒 Processing encrypted optimal split bet on Sapphire...", { duration: 0 });
        const receipt = await placeBetWithSapphire(betDescription, betOutcome, platforms, amounts, marketIds, totalValue);
        txHash = receipt.hash || receipt.transactionHash;
        
        notification.success(
          <div>
            <div>🔒 Encrypted optimal split bet placed successfully!</div>
            <div className="text-sm mt-1">
              Outcome: {betOutcome === 0 ? 'YES' : 'NO'} | Total: {formatEther(totalValue)} ETH
            </div>
            <div className="mt-2">
              <a 
                href={`https://explorer.oasis.io/testnet/sapphire/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        // Use regular contract interaction
        notification.info("Processing optimal split bet...", { duration: 0 });
        const txHash = await placeBet({
          functionName: "placeBet",
          args: [betDescription, betOutcome, platforms, amounts, marketIds],
          value: totalValue,
        });

        notification.success(
          <div>
            <div>Optimal split bet placed successfully!</div>
            <div className="text-sm mt-1">
              Outcome: {betOutcome === 0 ? 'YES' : 'NO'} | Total: {formatEther(totalValue)} ETH
            </div>
            <div className="mt-2">
              <a 
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      // Log the bet details
      console.log('Optimal split bet placed:', {
        description: betDescription,
        outcome: betOutcome === 0 ? 'YES' : 'NO',
        platforms,
        amounts: amounts.map(a => formatEther(a)),
        marketIds,
        totalValue: formatEther(totalValue),
        ethAmounts: {
          polymarket: priceData.polymarketEth,
          omen: priceData.omenEth,
          total: formatEther(totalValue)
        }
      });

      // Save bet placement to history for AI training
      if (result) {
        await saveOptimalSplitToHistory({
          ...result,
          betPlaced: true,
          betOutcome,
          betDescription,
          actualAmounts: amounts.map(a => formatEther(a)),
          actualPlatforms: platforms
        });
      }

    } catch (error) {
      console.error("Error placing optimal split bet:", error);
      notification.error(`Failed to place bet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Place Cross-Chain Bet with Optimal Split
  const handlePlaceCrossChainBet = async () => {
    if (!isConnected) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!betDescription.trim()) {
      notification.error("Please enter a bet description");
      return;
    }

    if (!priceData) {
      notification.error("Price data not loaded. Please calculate optimal split first.");
      return;
    }

    if (adjustedPolymarketAllocation <= 0 && adjustedOmenAllocation <= 0) {
      notification.error("Please allocate funds to at least one platform");
      return;
    }

    setIsPlacingCrossChainBet(true);
    setCrossChainResults([]);

    try {
      notification.info("🚀 Placing cross-chain bets and Sapphire aggregated bet...", { duration: 0 });

      // 1. Execute the current cross-chain function
      const crossChainResults = await placeCrossChainBet(
        address || '',
        adjustedPolymarketAllocation,
        adjustedOmenAllocation
      );

      setCrossChainResults(crossChainResults);

      // 2. Also execute the Oasis Sapphire place aggregated bet function
      let sapphireResult = null;
      if (isOnSapphire && deployedContractData) {
        try {
          notification.info("🔒 Processing encrypted aggregated bet on Sapphire...", { duration: 0 });
          
          // Prepare data for Sapphire aggregated bet
          const totalAmount = adjustedPolymarketAllocation + adjustedOmenAllocation;
          const totalValue = ethers.parseEther((totalAmount / priceData.ethUsdPrice).toString());
          
          // Create platforms array for the aggregated bet
          const platforms = ['Polymarket', 'Omen'];
          const amounts = [
            ethers.parseEther((adjustedPolymarketAllocation / priceData.ethUsdPrice).toString()),
            ethers.parseEther((adjustedOmenAllocation / priceData.ethUsdPrice).toString())
          ];
          const marketIds = ['cross-chain-bet', 'cross-chain-bet']; // Placeholder market IDs
          
          // Place the aggregated bet on Sapphire
          const receipt = await placeBetWithSapphire(
            betDescription, 
            betOutcome, 
            platforms, 
            amounts, 
            marketIds, 
            totalValue
          );
          
          sapphireResult = {
            success: true,
            chain: 'Oasis Sapphire',
            amount: totalAmount,
            ethAmount: totalAmount / priceData.ethUsdPrice,
            explorer: `https://explorer.oasis.io/testnet/sapphire/tx/${receipt.hash || receipt.transactionHash}`,
            txHash: receipt.hash || receipt.transactionHash
          };
          
          // Update the state variable
          setSapphireResult(sapphireResult);
          
          notification.success(
            <div>
              <div>🔒 Sapphire aggregated bet placed successfully!</div>
              <div className="text-sm mt-1">
                Amount: ${totalAmount.toFixed(2)} USD ({totalValue ? ethers.formatEther(totalValue) : '0'} ETH)
                <a 
                  href={sapphireResult.explorer}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline ml-2"
                >
                  View on Sapphire →
                </a>
              </div>
            </div>,
            { duration: 8000 }
          );
          
        } catch (sapphireError) {
          console.error("Error placing Sapphire aggregated bet:", sapphireError);
          sapphireResult = {
            success: false,
            chain: 'Oasis Sapphire',
            error: sapphireError instanceof Error ? sapphireError.message : 'Unknown error'
          };
          
          // Update the state variable
          setSapphireResult(sapphireResult);
          
          notification.error(
            <div>
              <div>❌ Sapphire aggregated bet failed:</div>
              <div className="text-sm mt-1">
                {sapphireResult.error}
              </div>
            </div>,
            { duration: 6000 }
          );
        }
      } else if (!isOnSapphire) {
        notification.info("ℹ️ Not on Sapphire network - skipping encrypted aggregated bet", { duration: 4000 });
        setSapphireResult(null);
      }

      // Show success/error notifications for cross-chain bets
      const successfulBets = crossChainResults.filter(r => r.success);
      const failedBets = crossChainResults.filter(r => !r.success);

      if (successfulBets.length > 0) {
        notification.success(
          <div>
            <div>✅ Cross-chain bets placed successfully!</div>
            <div className="text-sm mt-1">
              {successfulBets.map((bet, index) => (
                <div key={index} className="mt-1">
                  {bet.chain}: ${bet.amount} USD ({bet.ethAmount.toFixed(6)} ETH)
                  <a 
                    href={bet.explorer}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline ml-2"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          </div>,
          { duration: 10000 }
        );
      }

      if (failedBets.length > 0) {
        notification.error(
          <div>
            <div>❌ Some cross-chain bets failed:</div>
            {failedBets.map((bet, index) => (
              <div key={index} className="text-sm mt-1">
                {bet.chain}: {bet.error}
              </div>
            ))}
          </div>,
          { duration: 8000 }
        );
      }

      // Save cross-chain bet results to history for AI training (including Sapphire result)
      if (result) {
        await saveOptimalSplitToHistory({
          ...result,
          betPlaced: true,
          betOutcome,
          betDescription,
          actualAmounts: [adjustedPolymarketAllocation, adjustedOmenAllocation],
          actualPlatforms: ['Gnosis', 'Polygon'],
          crossChainResults: crossChainResults,
          sapphireResult: sapphireResult
        });
      }

    } catch (error) {
      console.error("Error placing cross-chain bet:", error);
      notification.error(`Failed to place cross-chain bet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPlacingCrossChainBet(false);
    }
  };

  // Check what data is available
  const hasPolymarket = isCombinedMarket(market) ? !!market.polymarketMarket : market.source === 'polymarket';
  const hasOmen = isCombinedMarket(market) ? !!market.omenMarket : market.source === 'omen';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Optimal Split Calculator</h3>
      
      {/* Data Availability Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Available Platforms:</div>
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 ${hasPolymarket ? '' : 'text-gray-400'}`} style={hasPolymarket ? { color: '#4c56ab' } : {}}>
            <div className={`w-2 h-2 rounded-full ${hasPolymarket ? '' : 'bg-gray-300'}`} style={hasPolymarket ? { backgroundColor: '#4c56ab' } : {}}></div>
            Polymarket (Order Book)
          </div>
          <div className={`flex items-center gap-2 ${hasOmen ? '' : 'text-gray-400'}`} style={hasOmen ? { color: '#f2a5db' } : {}}>
            <div className={`w-2 h-2 rounded-full ${hasOmen ? '' : 'bg-gray-300'}`} style={hasOmen ? { backgroundColor: '#f2a5db' } : {}}></div>
            Omen (LMSR)
          </div>
        </div>
        {isConnected && userBalance && (
          <div className="text-sm text-gray-600 mt-2">
            Balance: {formatEther(userBalance.value)} TEST
          </div>
        )}
      </div>

      {/* Budget Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget: ${budget}
          {priceData && priceData.totalEth !== undefined && priceData.ethUsdPrice !== undefined && (
            <span className="text-sm text-gray-500 ml-2">
              (≈ {priceData.totalEth.toFixed(6)} ETH @ ${priceData.ethUsdPrice.toFixed(2)}/ETH)
            </span>
          )}
        </label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #746097 0%, #746097 ${(budget - 50) / (5000 - 50) * 100}%, #e5e7eb ${(budget - 50) / (5000 - 50) * 100}%, #e5e7eb 100%)`
            }}
          />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$50</span>
            <span>$5,000</span>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleOptimalSplit}
        disabled={isCalculating || isLoadingPrice || (!hasPolymarket && !hasOmen)}
        className="w-full text-white py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        style={{
          backgroundColor: isCalculating || isLoadingPrice || (!hasPolymarket && !hasOmen) ? '#9ca3af' : '#746097'
        }}
        onMouseEnter={(e) => {
          if (!isCalculating && !isLoadingPrice && (hasPolymarket || hasOmen)) {
            e.currentTarget.style.backgroundColor = '#5a4b7a';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCalculating && !isLoadingPrice && (hasPolymarket || hasOmen)) {
            e.currentTarget.style.backgroundColor = '#746097';
          }
        }}
      >
        {isCalculating ? 'Calculating optimal split...' : 
         isLoadingPrice ? 'Converting to ETH...' : 
         'Calculate Optimal Split'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm font-medium">Error:</div>
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && priceData && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Optimal Split Results (JSON)</h4>
          
          {/* JSON Display */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(generateOptimalSplitJSON(), null, 2)}
            </pre>
            </div>

          

          {/* Bet Configuration */}
          <div className="p-4 rounded-lg border border-gray-300">
            <h5 className="font-medium text-black mb-3">Bet Configuration</h5>
            
            {/* Bet Description */}
                    <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Bet Description
              </label>
                        <input
                type="text"
                value={betDescription}
                onChange={(e) => setBetDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black"
                placeholder="Enter bet description..."
              />
                    </div>

            {/* Outcome Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">
                Betting Outcome
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBetOutcome(0)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    betOutcome === 0
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  YES
                </button>
                <button
                  onClick={() => setBetOutcome(1)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    betOutcome === 1
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  NO
                </button>
                    </div>
                  </div>
                </div>

                                    {/* Adjustment Controls */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#746097' + '10' }}>
                <h5 className="font-medium mb-3 text-black">Adjust Allocations</h5>
              
              {hasPolymarket && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-black">
                    <span className="text-black">Polymarket: ${adjustedPolymarketAllocation.toFixed(2)}</span>
                    <span className="text-xs ml-2 text-black">
                      (≈ {priceData.polymarketEth?.toFixed(6) || '0.000000'} ETH)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={budget}
                    step="10"
                    value={adjustedPolymarketAllocation}
                    onChange={(e) => handlePolymarketChange(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #4c56ab 0%, #4c56ab ${(adjustedPolymarketAllocation / budget) * 100}%, #e5e7eb ${(adjustedPolymarketAllocation / budget) * 100}%, #e5e7eb 100%)`
                    }}
                    disabled={isLoadingPrice}
                  />
                    </div>
                  )}

              {hasOmen && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-black">
                    <span className="text-black">Omen: ${adjustedOmenAllocation.toFixed(2)}</span>
                    <span className="text-xs ml-2 text-black">
                      (≈ {priceData.omenEth?.toFixed(6) || '0.000000'} ETH)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={budget}
                    step="10"
                    value={adjustedOmenAllocation}
                    onChange={(e) => handleOmenChange(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f2a5db 0%, #f2a5db ${(adjustedOmenAllocation / budget) * 100}%, #e5e7eb ${(adjustedOmenAllocation / budget) * 100}%, #e5e7eb 100%)`
                    }}
                    disabled={isLoadingPrice}
                  />
                        </div>
              )}

                              <div className="text-sm text-black">
                  Total: ${(adjustedPolymarketAllocation + adjustedOmenAllocation).toFixed(2)} / ${budget}
                  <span className="block text-xs">
                    (≈ {priceData.totalEth?.toFixed(6) || '0.000000'} ETH total)
                  </span>
                    </div>
                  </div>

          {/* Current Allocation Summary with ETH */}
          <div className="grid grid-cols-2 gap-4">
                        {hasPolymarket && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#4c56ab' + '10' }}>
                <div className="text-sm font-medium" style={{ color: '#4c56ab' }}>Polymarket</div>
                <div className="text-lg font-bold" style={{ color: '#4c56ab' }}>${adjustedPolymarketAllocation.toFixed(2)}</div>
                <div className="text-sm font-medium" style={{ color: '#4c56ab' }}>{priceData.polymarketEth?.toFixed(6) || '0.000000'} ETH</div>
                <div className="text-xs" style={{ color: '#4c56ab' }}>
                  {((adjustedPolymarketAllocation / budget) * 100).toFixed(1)}% of budget
                          </div>
                        </div>
            )}
            
                        {hasOmen && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f2a5db' + '10' }}>
                <div className="text-sm font-medium" style={{ color: '#f2a5db' }}>Omen</div>
                <div className="text-lg font-bold" style={{ color: '#f2a5db' }}>${adjustedOmenAllocation.toFixed(2)}</div>
                <div className="text-sm font-medium" style={{ color: '#f2a5db' }}>{priceData.omenEth?.toFixed(6) || '0.000000'} ETH</div>
                <div className="text-xs" style={{ color: '#f2a5db' }}>
                  {((adjustedOmenAllocation / budget) * 100).toFixed(1)}% of budget
                      </div>
                    </div>
                  )}
                </div>

          {/* Place Bet Button */}
          <div className="pt-4 border-t">
            <button 
              className="w-full text-white py-3 px-4 rounded-lg transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
              onClick={handlePlaceCrossChainBet}
              disabled={isPlacingCrossChainBet || !betDescription.trim() || (adjustedPolymarketAllocation <= 0 && adjustedOmenAllocation <= 0)}
              style={{
                backgroundColor: isPlacingCrossChainBet || !betDescription.trim() || (adjustedPolymarketAllocation <= 0 && adjustedOmenAllocation <= 0) ? '#9ca3af' : '#746097'
              }}
              onMouseEnter={(e) => {
                if (!isPlacingCrossChainBet && betDescription.trim() && (adjustedPolymarketAllocation > 0 || adjustedOmenAllocation > 0)) {
                  e.currentTarget.style.backgroundColor = '#5a4b7a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPlacingCrossChainBet && betDescription.trim() && (adjustedPolymarketAllocation > 0 || adjustedOmenAllocation > 0)) {
                  e.currentTarget.style.backgroundColor = '#746097';
                }
              }}
            >
              {isPlacingCrossChainBet 
                ? "Placing Cross-Chain & Sapphire Bets..." 
                : `Place Cross-Chain ${betOutcome === 0 ? 'YES' : 'NO'} Bet + Sapphire Aggregated (${priceData?.totalEth?.toFixed(6) || '0.000000'} ETH)`
              }
            </button>
            
            {/* Cross-chain bet results display */}
            {(crossChainResults.length > 0 || sapphireResult) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Cross-Chain & Sapphire Bet Results:</h4>
                
                {/* Cross-chain results */}
                {crossChainResults.map((result, index) => (
                  <div key={index} className="text-sm mb-2">
                    {result.success ? (
                      <div className="text-green-600">
                        ✅ {result.chain}: ${result.amount} USD ({result.ethAmount.toFixed(6)} ETH)
                        <a 
                          href={result.explorer}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline ml-2"
                        >
                          View →
                        </a>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ❌ {result.chain}: {result.error}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Sapphire result */}
                {sapphireResult && (
                  <div className="text-sm mb-2">
                    {sapphireResult.success ? (
                      <div className="text-green-600">
                        🔒 {sapphireResult.chain}: ${sapphireResult.amount.toFixed(2)} USD ({sapphireResult.ethAmount.toFixed(6)} ETH)
                        <a 
                          href={sapphireResult.explorer}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline ml-2"
                        >
                          View on Sapphire →
                        </a>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ❌ {sapphireResult.chain}: {sapphireResult.error}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Note about Sapphire aggregated bet */}
                <div className="text-xs text-gray-600 mt-2 italic">
                  💡 Cross-chain bets are placed on Gnosis & Polygon, while the aggregated bet is placed on Oasis Sapphire (if connected)
                </div>
              </div>
            )}
            
            {!isConnected && (
              <p className="text-sm text-gray-500 text-center mt-2">Please connect your wallet to place a bet</p>
            )}
                    </div>
                  </div>
      )}
    </div>
  );
}