"use client";

import React, { useState } from 'react';
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

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Adjustable allocations (user can modify these)
  const [adjustedPolymarketAllocation, setAdjustedPolymarketAllocation] = useState<number>(0);
  const [adjustedOmenAllocation, setAdjustedOmenAllocation] = useState<number>(0);

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

  const handleOptimalSplit = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);

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
    if (!result) return null;

    return {
      optimal_split: {
        total_budget: budget,
        allocations: {
          polymarket: {
            platform: "Polymarket",
            type: "Order Book",
            allocation_usd: result.orderBookAllocation,
            allocation_percent: result.efficiency.allocationRatio.orderBookPercent,
            shares: result.orderBookShares,
            avg_price_per_share: result.orderBookAllocation / result.orderBookShares
          },
          omen: {
            platform: "Omen",
            type: "LMSR AMM",
            allocation_usd: result.lmsrAllocation,
            allocation_percent: result.efficiency.allocationRatio.lmsrPercent,
            shares: result.lmsrShares,
            avg_price_per_share: result.lmsrAllocation / result.lmsrShares
          }
        },
        summary: {
          total_shares: result.totalShares,
          total_cost: result.totalCost,
          cost_per_share: result.efficiency.costPerShare,
          strategy: result.strategy
        }
      }
    };
  };

  // Handle adjustment changes
  const handlePolymarketChange = (value: number) => {
    setAdjustedPolymarketAllocation(value);
    setAdjustedOmenAllocation(budget - value);
  };

  const handleOmenChange = (value: number) => {
    setAdjustedOmenAllocation(value);
    setAdjustedPolymarketAllocation(budget - value);
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
        disabled={isCalculating || (!hasPolymarket && !hasOmen)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isCalculating ? 'Calculating optimal split...' : 'Calculate Optimal Split'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm font-medium">Error:</div>
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Optimal Split Results (JSON)</h4>
          
          {/* JSON Display */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(generateOptimalSplitJSON(), null, 2)}
            </pre>
          </div>

          {/* Adjustment Controls */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-3">Adjust Allocations</h5>
            
            {hasPolymarket && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Polymarket: ${adjustedPolymarketAllocation.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={budget}
                  step="10"
                  value={adjustedPolymarketAllocation}
                  onChange={(e) => handlePolymarketChange(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {hasOmen && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Omen: ${adjustedOmenAllocation.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={budget}
                  step="10"
                  value={adjustedOmenAllocation}
                  onChange={(e) => handleOmenChange(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            <div className="text-sm text-blue-700">
              Total: ${(adjustedPolymarketAllocation + adjustedOmenAllocation).toFixed(2)} / ${budget}
            </div>
          </div>

          {/* Current Allocation Summary */}
          <div className="grid grid-cols-2 gap-4">
            {hasPolymarket && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Polymarket</div>
                <div className="text-lg font-bold text-green-900">${adjustedPolymarketAllocation.toFixed(2)}</div>
                <div className="text-xs text-green-700">
                  {((adjustedPolymarketAllocation / budget) * 100).toFixed(1)}% of budget
                </div>
              </div>
            )}
            
            {hasOmen && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Omen</div>
                <div className="text-lg font-bold text-purple-900">${adjustedOmenAllocation.toFixed(2)}</div>
                <div className="text-xs text-purple-700">
                  {((adjustedOmenAllocation / budget) * 100).toFixed(1)}% of budget
                </div>
              </div>
            )}
          </div>

          {/* Place Bet Button */}
          <div className="pt-4 border-t">
            <button 
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              onClick={() => {
                // This will be connected to your bet placement logic
                console.log('Place bet with allocation:', {
                  polymarket: adjustedPolymarketAllocation,
                  omen: adjustedOmenAllocation,
                  total: adjustedPolymarketAllocation + adjustedOmenAllocation
                });
              }}
            >
              Place Bet with Current Allocation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}