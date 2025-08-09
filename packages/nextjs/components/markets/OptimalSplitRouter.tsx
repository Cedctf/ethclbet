"use client";

import React, { useState } from 'react';
import { parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getSapphireProvider, getSapphireEthersSigner, isSapphireNetwork } from "~~/utils/scaffold-eth/sapphireProviders";
import { ethers } from "ethers";
import { CombinedMarket, NormalizedMarket } from '~~/hooks/useCombinedMarkets';

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
}

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: deployedContractData } = useDeployedContractInfo("SimpleBet");
  
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Betting outcome selection
  const [betOutcome, setBetOutcome] = useState(0); // 0 = YES, 1 = NO
  const [betDescription, setBetDescription] = useState("");
  
  // Adjustable allocations (user can modify these)
  const [adjustedPolymarketAllocation, setAdjustedPolymarketAllocation] = useState<number>(0);
  const [adjustedOmenAllocation, setAdjustedOmenAllocation] = useState<number>(0);

  // Price conversion data
  const [priceData, setPriceData] = useState<{
    polymarketEth: number;
    omenEth: number;
    totalEth: number;
    ethUsdPrice: number;
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

  // Convert USD to ETH using Pyth price feed
  const convertToEth = async (polymarketUsd: number, omenUsd: number) => {
    setIsLoadingPrice(true);
    try {
      // Get price for Polymarket allocation
      const polymarketResponse = await fetch('/api/pyth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount: polymarketUsd })
      });
      
      if (!polymarketResponse.ok) {
        throw new Error('Failed to get Polymarket ETH conversion');
      }
      
      const polymarketData: PriceConversion = await polymarketResponse.json();

      // Validate the response data
      if (!polymarketData.ethUsdPrice || !polymarketData.ethEquivalent) {
        throw new Error('Invalid price data received from Pyth API');
      }

      // Get price for Omen allocation
      const omenResponse = await fetch('/api/pyth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount: omenUsd })
      });
      
      if (!omenResponse.ok) {
        throw new Error('Failed to get Omen ETH conversion');
      }
      
      const omenData: PriceConversion = await omenResponse.json();

      // Validate the response data
      if (!omenData.ethUsdPrice || !omenData.ethEquivalent) {
        throw new Error('Invalid price data received from Pyth API');
      }

      // Set price data with validation
      setPriceData({
        polymarketEth: polymarketData.ethEquivalent || 0,
        omenEth: omenData.ethEquivalent || 0,
        totalEth: (polymarketData.ethEquivalent || 0) + (omenData.ethEquivalent || 0),
        ethUsdPrice: polymarketData.ethUsdPrice || 0
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
          // For combined markets, prefer the main title or question
          marketTitle = market.title || 
                      market.polymarketMarket?.question || 
                      market.omenMarket?.question || 
                      'Combined Market Bet';
        } else {
          // For individual markets
          marketTitle = market.title || market.question || 'Market Bet';
        }
        
        setBetDescription(marketTitle);
        
        // Convert to ETH
        await convertToEth(data.result.orderBookAllocation, data.result.lmsrAllocation);
        
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
        amounts.push(parseEther(priceData.polymarketEth.toString()));
        
        // Get market ID from the market data
        const polymarketStats = extractMarketStats(market, 'polymarket');
        marketIds.push(polymarketStats?.id || 'polymarket_optimal_split');
      }

      // Add Omen subbet if allocation > 0
      if (adjustedOmenAllocation > 0) {
        platforms.push("Omen");
        amounts.push(parseEther(priceData.omenEth.toString()));
        
        // Get market ID from the market data
        const omenStats = extractMarketStats(market, 'omen');
        marketIds.push(omenStats?.id || 'omen_optimal_split');
      }

      const totalValue = parseEther(priceData.totalEth.toString());

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
              Outcome: {betOutcome === 0 ? 'YES' : 'NO'} | Total: {priceData.totalEth.toFixed(6)} ETH
            </div>
            <div className="mt-2">
              <a 
                href={`https://explorer.sapphire.oasis.io/tx/${txHash}`}
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
              Outcome: {betOutcome === 0 ? 'YES' : 'NO'} | Total: {priceData.totalEth.toFixed(6)} ETH
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
        amounts: amounts.map(a => a.toString()),
        marketIds,
        totalValue: totalValue.toString(),
        ethAmounts: {
          polymarket: priceData.polymarketEth,
          omen: priceData.omenEth,
          total: priceData.totalEth
        }
      });

    } catch (error) {
      console.error("Error placing optimal split bet:", error);
      notification.error("Failed to place bet");
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
          <div className={`flex items-center gap-2 ${hasPolymarket ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${hasPolymarket ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Polymarket (Order Book)
          </div>
          <div className={`flex items-center gap-2 ${hasOmen ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${hasOmen ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            Omen (LMSR)
          </div>
        </div>
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
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

          {/* ETH Price Info */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm text-yellow-800 font-medium mb-1">Live ETH Price</div>
            <div className="text-yellow-700 text-sm">
              1 ETH = ${priceData.ethUsdPrice?.toFixed(2) || 'N/A'} USD (via Pyth Network)
            </div>
          </div>

          {/* Bet Configuration */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-3">Bet Configuration</h5>
            
            {/* Bet Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Bet Description
              </label>
              <input
                type="text"
                value={betDescription}
                onChange={(e) => setBetDescription(e.target.value)}
                className="w-full p-2 border border-purple-200 rounded-lg text-sm"
                placeholder="Enter bet description..."
              />
              </div>

            {/* Outcome Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-800 mb-2">
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-3">Adjust Allocations</h5>
            
            {hasPolymarket && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Polymarket: ${adjustedPolymarketAllocation.toFixed(2)} 
                  <span className="text-xs text-blue-600 ml-2">
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
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isLoadingPrice}
                />
              </div>
            )}

            {hasOmen && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Omen: ${adjustedOmenAllocation.toFixed(2)}
                  <span className="text-xs text-blue-600 ml-2">
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
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isLoadingPrice}
                />
              </div>
            )}

            <div className="text-sm text-blue-700">
              Total: ${(adjustedPolymarketAllocation + adjustedOmenAllocation).toFixed(2)} / ${budget}
              <span className="block text-xs">
                (≈ {priceData.totalEth?.toFixed(6) || '0.000000'} ETH total)
              </span>
            </div>
          </div>

          {/* Current Allocation Summary with ETH */}
          <div className="grid grid-cols-2 gap-4">
            {hasPolymarket && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Polymarket</div>
                <div className="text-lg font-bold text-green-900">${adjustedPolymarketAllocation.toFixed(2)}</div>
                <div className="text-sm font-medium text-green-800">{priceData.polymarketEth?.toFixed(6) || '0.000000'} ETH</div>
                <div className="text-xs text-green-700">
                  {((adjustedPolymarketAllocation / budget) * 100).toFixed(1)}% of budget
                </div>
              </div>
            )}
            
            {hasOmen && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Omen</div>
                <div className="text-lg font-bold text-purple-900">${adjustedOmenAllocation.toFixed(2)}</div>
                <div className="text-sm font-medium text-purple-800">{priceData.omenEth?.toFixed(6) || '0.000000'} ETH</div>
                <div className="text-xs text-purple-700">
                  {((adjustedOmenAllocation / budget) * 100).toFixed(1)}% of budget
                </div>
              </div>
            )}
            </div>

          {/* Place Bet Button */}
          <div className="pt-4 border-t">
            <button 
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handlePlaceBet}
              disabled={isPlacingBet || !isConnected || !betDescription.trim()}
            >
              {isPlacingBet 
                ? "Placing Bet..." 
                : `Place ${betOutcome === 0 ? 'YES' : 'NO'} Bet (${priceData.totalEth?.toFixed(6) || '0.000000'} ETH)`
              }
            </button>
            {!isConnected && (
              <p className="text-sm text-gray-500 text-center mt-2">Please connect your wallet to place a bet</p>
            )}
            {isOnSapphire && (
              <p className="text-sm text-green-600 text-center mt-2">🔒 Encrypted transaction on Sapphire Network</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}