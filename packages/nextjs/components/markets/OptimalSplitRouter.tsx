"use client";

import React, { useState } from 'react';
import { CombinedMarket, NormalizedMarket } from '~~/hooks/useCombinedMarkets';

interface OptimalSplitRouterProps {
  market: CombinedMarket | NormalizedMarket;
}

interface AIResponse {
  message: {
    role: string;
    content: string;
  };
  actionResults?: Array<{
    actionName: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
  executedActions?: boolean;
}

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');

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

  const handlePlaceBet = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);
    setAiResponse('');

    try {
      // Extract market statistics for both platforms
      const polymarketStats = extractMarketStats(market, 'polymarket');
      const omenStats = extractMarketStats(market, 'omen');

      if (!polymarketStats && !omenStats) {
        throw new Error('No market data available for optimization');
      }

      // Prepare the request for the AI agent
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: `I want to place a bet with a budget of $${budget}. Please analyze the market data and calculate the optimal split between platforms. Here's the market data:

${polymarketStats ? `Polymarket Data:
- Trades: ${polymarketStats.tradesQuantity}
- Buys: ${polymarketStats.buysQuantity}
- Sells: ${polymarketStats.sellsQuantity}
- Volume: $${polymarketStats.scaledCollateralVolume}
- Buy Volume: $${polymarketStats.scaledCollateralBuyVolume}
- Sell Volume: $${polymarketStats.scaledCollateralSellVolume}` : ''}

${omenStats ? `Omen Data:
- Trades: ${omenStats.tradesQuantity}
- Buys: ${omenStats.buysQuantity}
- Sells: ${omenStats.sellsQuantity}
- Volume: $${omenStats.scaledCollateralVolume}
- Buy Volume: $${omenStats.scaledCollateralBuyVolume}
- Sell Volume: $${omenStats.scaledCollateralSellVolume}` : ''}

Please execute the optimization and provide detailed recommendations.`
          }
        ],
        options: {
          executeActions: true,
          temperature: 0.3,
          maxTokens: 1500
        }
      };

      // Call the AI agent API
      const response = await fetch('/api/rofl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiData: AIResponse = await response.json();
      setAiResponse(aiData.message.content);

      // Extract the optimization result from action results
      if (aiData.actionResults && aiData.actionResults.length > 0) {
        const optimizationResult = aiData.actionResults.find(
          action => action.actionName === 'optimizeBettingSplit' && action.success
        );

        if (optimizationResult && optimizationResult.result) {
          setResult(optimizationResult.result);
        } else {
          const errorAction = aiData.actionResults.find(action => !action.success);
          throw new Error(errorAction?.error || 'Optimization failed');
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during optimization');
    } finally {
      setIsCalculating(false);
    }
  };

  // Check what data is available
  const hasPolymarket = isCombinedMarket(market) ? !!market.polymarketMarket : market.source === 'polymarket';
  const hasOmen = isCombinedMarket(market) ? !!market.omenMarket : market.source === 'omen';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">AI-Powered Betting Optimizer</h3>
      
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

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={isCalculating || (!hasPolymarket && !hasOmen)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isCalculating ? 'AI is calculating...' : 'Place Bet'}
      </button>

      {/* AI Response */}
      {aiResponse && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800 font-medium mb-2">AI Analysis:</div>
          <div className="text-sm text-blue-700 whitespace-pre-wrap">{aiResponse}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Optimization Results</h4>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Order Book Allocation</div>
              <div className="text-xl font-bold text-blue-900">${result.orderBookAllocation.toFixed(2)}</div>
              <div className="text-sm text-blue-700">{result.orderBookShares.toFixed(2)} shares</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">LMSR Allocation</div>
              <div className="text-xl font-bold text-green-900">${result.lmsrAllocation.toFixed(2)}</div>
              <div className="text-sm text-green-700">{result.lmsrShares.toFixed(2)} shares</div>
            </div>
          </div>

          {/* Total Results */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Total Shares</div>
                <div className="text-lg font-bold text-gray-900">{result.totalShares.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-lg font-bold text-gray-900">${result.totalCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Strategy</div>
                <div className="text-lg font-bold text-gray-900">{result.strategy}</div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          {result.efficiency && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-800 font-medium mb-2">Efficiency Analysis</div>
              <div className="text-sm text-yellow-700">
                Cost per share: ${result.efficiency.costPerShare.toFixed(4)}
              </div>
              <div className="text-sm text-yellow-700">
                Allocation ratio: {result.efficiency.allocationRatio.orderBookPercent.toFixed(1)}% OB / {result.efficiency.allocationRatio.lmsrPercent.toFixed(1)}% LMSR
              </div>
            </div>
          )}

          {/* Platform Data */}
          {result.platformData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-800 font-medium mb-2">Platform Analysis</div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <strong>Order Book:</strong>
                  <div>Levels: {result.platformData.orderBook.orderLevels}</div>
                  <div>Liquidity: {result.platformData.orderBook.totalLiquidity} shares</div>
                </div>
                <div>
                  <strong>LMSR:</strong>
                  <div>YES Shares: {result.platformData.lmsr.yesShares}</div>
                  <div>Liquidity Param: {result.platformData.lmsr.liquidityParameter}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}