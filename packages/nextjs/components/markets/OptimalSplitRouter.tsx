"use client";

import React, { useState } from 'react';
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

interface OptimalSplitRouterProps {
  market: CombinedMarket | NormalizedMarket;
}

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if market is combined
  const isCombinedMarket = (market: CombinedMarket | NormalizedMarket): market is CombinedMarket => {
    return 'combinedVolume' in market;
  };

  // Extract market statistics from market data
  const extractMarketStats = (marketData: any, source: 'polymarket' | 'omen'): MarketStatistics | null => {
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

  const handleOptimize = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      // Extract market statistics for both platforms
      const polymarketStats = extractMarketStats(market, 'polymarket');
      const omenStats = extractMarketStats(market, 'omen');

      // Console log the actual fetched data
      if (polymarketStats) {
        console.log('POLYMARKET DATA FETCHED:');
        console.log('  tradesQuantity:', polymarketStats.tradesQuantity);
        console.log('  buysQuantity:', polymarketStats.buysQuantity);
        console.log('  sellsQuantity:', polymarketStats.sellsQuantity);
        console.log('  scaledCollateralVolume:', polymarketStats.scaledCollateralVolume);
        console.log('  scaledCollateralBuyVolume:', polymarketStats.scaledCollateralBuyVolume);
        console.log('  scaledCollateralSellVolume:', polymarketStats.scaledCollateralSellVolume);
      }

      if (omenStats) {
        console.log('OMEN DATA FETCHED:');
        console.log('  tradesQuantity:', omenStats.tradesQuantity);
        console.log('  buysQuantity:', omenStats.buysQuantity);
        console.log('  sellsQuantity:', omenStats.sellsQuantity);
        console.log('  scaledCollateralVolume:', omenStats.scaledCollateralVolume);
        console.log('  scaledCollateralBuyVolume:', omenStats.scaledCollateralBuyVolume);
        console.log('  scaledCollateralSellVolume:', omenStats.scaledCollateralSellVolume);
      }

      if (!polymarketStats && !omenStats) {
        throw new Error('No market data available for optimization');
      }

      // Generate platform data
      let orderBookData: OrderBookData | null = null;
      let lmsrData: LMSRData | null = null;

      if (polymarketStats) {
        orderBookData = generateOrderBookFromStats(polymarketStats, "Polymarket OrderBook");
      }

      if (omenStats) {
        lmsrData = generateLMSRFromStats(omenStats, "Omen LMSR");
      }

      // If we only have one platform, create mock data for the other
      if (!orderBookData && omenStats) {
        orderBookData = generateOrderBookFromStats(omenStats, "Mock OrderBook");
      }

      if (!lmsrData && polymarketStats) {
        lmsrData = generateLMSRFromStats(polymarketStats, "Mock LMSR");
      }

      if (!orderBookData || !lmsrData) {
        throw new Error('Unable to generate platform data for optimization');
      }

      // Calculate optimal split
      console.log('CALLING findOptimalSplit WITH:');
      console.log('  budget:', budget);
      console.log('  orderBookData:', orderBookData);
      console.log('  lmsrData:', lmsrData);
      
      const optimization = findOptimalSplit(budget, orderBookData, lmsrData);
      setResult(optimization);

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
    <div className="bg-base-100 rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-base-content">Optimal Split Router</h3>

      {/* Data Availability Status */}
      <div className="mb-4 p-3 bg-base-200 rounded-lg">
        <div className="text-sm text-base-content/70 mb-2">Available Platforms:</div>
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 ${hasPolymarket ? 'text-success' : 'text-base-content/40'}`}>
            <div className={`w-2 h-2 rounded-full ${hasPolymarket ? 'bg-success' : 'bg-base-content/30'}`}></div>
            Polymarket (Order Book)
          </div>
          <div className={`flex items-center gap-2 ${hasOmen ? 'text-primary' : 'text-base-content/40'}`}>
            <div className={`w-2 h-2 rounded-full ${hasOmen ? 'bg-primary' : 'bg-base-content/30'}`}></div>
            Omen (LMSR)
          </div>
        </div>
      </div>

      {/* Budget Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-base-content mb-2">
          Budget: ${budget}
        </label>
        <input
          type="range"
          min="50"
          max="5000"
          step="50"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-base-content/70 mt-1">
          <span>$50</span>
          <span>$5,000</span>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={isCalculating || (!hasPolymarket && !hasOmen)}
        className="w-full bg-primary text-primary-content py-2 px-4 rounded-lg hover:bg-primary/80 disabled:bg-base-content/40 disabled:cursor-not-allowed transition-colors"
      >
        {isCalculating ? 'Calculating...' : 'Optimize Split'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg">
          <div className="text-error text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-base-content">Optimization Results</h4>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-sm text-primary font-medium">Order Book Allocation</div>
              <div className="text-xl font-bold text-primary">${result.orderBookAllocation.toFixed(2)}</div>
              <div className="text-sm text-primary/80">{result.orderBookShares.toFixed(2)} shares</div>
            </div>
            <div className="bg-success/10 p-4 rounded-lg">
              <div className="text-sm text-success font-medium">LMSR Allocation</div>
              <div className="text-xl font-bold text-success">${result.lmsrAllocation.toFixed(2)}</div>
              <div className="text-sm text-success/80">{result.lmsrShares.toFixed(2)} shares</div>
            </div>
          </div>

          {/* Total Results */}
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-base-content/70">Total Shares</div>
                <div className="text-lg font-bold text-base-content">{result.totalShares.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-base-content/70">Total Cost</div>
                <div className="text-lg font-bold text-base-content">${result.totalCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-base-content/70">Strategy</div>
                <div className="text-lg font-bold text-base-content">{result.strategy}</div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-warning/10 p-4 rounded-lg">
            <div className="text-sm text-warning font-medium mb-2">Efficiency Analysis</div>
            <div className="text-sm text-warning/80">
              Cost per share: ${(result.totalCost / result.totalShares).toFixed(4)}
            </div>
            <div className="text-sm text-warning/80">
              Allocation ratio: {((result.orderBookAllocation / budget) * 100).toFixed(1)}% OB / {((result.lmsrAllocation / budget) * 100).toFixed(1)}% LMSR
            </div>
          </div>
        </div>
      )}
    </div>
  );
}