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

interface OptimalSplitRouterProps {
  market: CombinedMarket | NormalizedMarket;
}

export default function OptimalSplitRouter({ market }: OptimalSplitRouterProps) {
  const [budget, setBudget] = useState(1000);
  const [result, setResult] = useState<SplitResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isPopupAnimating, setIsPopupAnimating] = useState(false);
  const [popupBudget, setPopupBudget] = useState(1000);

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
      setPopupBudget(budget);
      setShowPopup(true);
      setIsPopupAnimating(true);

      // Trigger animation after a brief delay
      setTimeout(() => setIsPopupAnimating(false), 50);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during optimization');
    } finally {
      setIsCalculating(false);
    }
  };



  // Auto-recalculate when popup budget changes
  useEffect(() => {
    if (!showPopup || !result) return;

    const recalculate = async () => {
      setIsCalculating(true);
      setError(null);

      try {
        // Get market data for both platforms
        const polymarketStats = extractMarketStats(market, 'polymarket');
        const omenStats = extractMarketStats(market, 'omen');

        if (!polymarketStats || !omenStats) {
          throw new Error('Unable to get market statistics for optimization');
        }

        // Generate platform data
        const orderBookData = generateOrderBookFromStats(polymarketStats, 'Polymarket');
        const lmsrData = generateLMSRFromStats(omenStats, 'Omen');

        // Calculate optimal split with new budget
        const optimization = findOptimalSplit(popupBudget, orderBookData, lmsrData);
        setResult(optimization);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during optimization');
      } finally {
        setIsCalculating(false);
      }
    };

    recalculate();
  }, [popupBudget, showPopup, market]);

  // Check what data is available
  const hasPolymarket = isCombinedMarket(market) ? !!market.polymarketMarket : market.source === 'polymarket';
  const hasOmen = isCombinedMarket(market) ? !!market.omenMarket : market.source === 'omen';

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6 flex flex-col dark:bg-gray-900/60 dark:border dark:border-gray-900/60" style={{ position: 'static', transform: 'none' }}>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #746097;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #746097;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <h2 className="text-xl font-semibold mb-6 text-base-content">Optimal Split Router</h2>

      {/* Available Platforms */}
      <div className="mb-6">
        <div className="text-sm text-base-content/70 mb-3">Available Platforms:</div>
        <div className="flex gap-6">
          <div className={`flex items-center gap-2 ${hasPolymarket ? 'text-base-content' : 'text-base-content/40'}`}>
            <div className={`w-3 h-3 rounded-full ${hasPolymarket ? '' : 'bg-base-content/30'}`} style={hasPolymarket ? { backgroundColor: '#358FC6' } : {}}></div>
            <span className="text-sm">Polymarket (Order Book)</span>
          </div>
          <div className={`flex items-center gap-2 ${hasOmen ? 'text-base-content' : 'text-base-content/40'}`}>
            <div className={`w-3 h-3 rounded-full ${hasOmen ? '' : 'bg-base-content/30'}`} style={hasOmen ? { backgroundColor: '#746097' } : {}}></div>
            <span className="text-sm">Omen (LMSR)</span>
          </div>
        </div>
      </div>

      {/* Budget Input Field */}
      <div className="mb-4">
        <label className="text-sm text-base-content/70 mb-2 block">Budget Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/70">$</span>
          <input
            type="number"
            min="50"
            max="5000"
            step="50"
            value={budget}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 50 && value <= 5000) {
                setBudget(value);
              } else if (value < 50) {
                setBudget(50);
              } else if (value > 5000) {
                setBudget(5000);
              }
            }}
            className="w-full pl-8 pr-4 py-2 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#746097] focus:border-transparent text-base-content"
            placeholder="1000"
          />
        </div>
      </div>

      {/* Budget Slider */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #746097 0%, #746097 ${((budget - 50) / (5000 - 50)) * 100}%, #9ca3af ${((budget - 50) / (5000 - 50)) * 100}%, #9ca3af 100%)`,
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <div className="flex justify-between text-xs text-base-content/50 mt-2">
            <span>$50</span>
            <span>$5,000</span>
          </div>
        </div>
      </div>

      {/* Spacer to fill remaining space */}
      <div className="flex-grow"></div>

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={isCalculating || (!hasPolymarket && !hasOmen)}
        className="w-full bg-[#746097] text-white py-3 px-4 rounded-lg hover:bg-[#746097]/90 disabled:bg-base-content/40 disabled:cursor-not-allowed transition-colors font-medium mb-4"
      >
        {isCalculating ? 'Calculating...' : 'Optimize Split'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
          <div className="text-error text-sm">{error}</div>
        </div>
      )}

      {/* Optimization Results Popup */}
      {showPopup && result && (
        <div className={`fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out ${isPopupAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-base-100 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out ${isPopupAnimating ? 'scale-95 translate-y-4 opacity-0' : 'scale-100 translate-y-0 opacity-100'}`}>
            {/* Popup Header */}
            <div className="flex items-center justify-between p-6 pb-3">
              <h2 className="text-xl font-semibold text-base-content mb-0">Optimization Results</h2>
              <button
                onClick={() => {
                  setIsPopupAnimating(true);
                  setTimeout(() => setShowPopup(false), 300);
                }}
                className="text-base-content/70 hover:text-base-content transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-6 pt-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Budget Controls */}
                <div className="lg:col-span-1">
                  <div className="px-4 h-full">
                    <h3 className="text-lg font-semibold mb-4 text-base-content">Adjust Budget</h3>

                    {/* Budget Input Field */}
                    <div className="mb-4">
                      <label className="text-sm text-base-content/70 mb-2 block">Budget Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/70">$</span>
                        <input
                          type="number"
                          min="50"
                          max="5000"
                          step="50"
                          value={popupBudget}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 50 && value <= 5000) {
                              setPopupBudget(value);
                            } else if (value < 50) {
                              setPopupBudget(50);
                            } else if (value > 5000) {
                              setPopupBudget(5000);
                            }
                          }}
                          className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-gray-800"
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    {/* Budget Slider */}
                    <div className="mb-6">
                      <div className="relative">
                        <input
                          type="range"
                          min="50"
                          max="5000"
                          step="50"
                          value={popupBudget}
                          onChange={(e) => setPopupBudget(Number(e.target.value))}
                          className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #746097 0%, #746097 ${((popupBudget - 50) / (5000 - 50)) * 100}%, #9ca3af ${((popupBudget - 50) / (5000 - 50)) * 100}%, #9ca3af 100%)`,
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                        <div className="flex justify-between text-xs text-base-content/50 mt-2">
                          <span>$50</span>
                          <span>$5,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Results Display */}
                <div className="lg:col-span-2">
                  {/* Vertical Divider */}
                  <div className="border-l border-gray-300 dark:border-gray-600 pl-10 pr-6 h-full">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-base-content mb-4">Results:</h3>

                {/* Pie Chart Visualization */}
                <div className="flex items-center gap-8">
                  {/* Left Side - Omen Details */}
                  {result.lmsrAllocation > 0 && (
                    <div className="flex-1 space-y-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#746097' }}></div>
                          <span className="text-lg font-medium text-base-content">Omen</span>
                        </div>
                        <div className="text-3xl font-bold text-base-content mb-2 text-right">
                          {((result.lmsrAllocation / popupBudget) * 100).toFixed(0)}%
                        </div>
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between">
                            <span className="text-sm text-base-content/70">Amount:</span>
                            <span className="text-base-content font-medium">${result.lmsrAllocation.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-base-content/70">Shares:</span>
                            <span className="text-base-content font-medium">{Math.round(result.lmsrShares)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Center - Pie Chart */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="8"
                        />
                        {/* Polymarket segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#358FC6"
                          strokeWidth="8"
                          strokeDasharray={`${((result.orderBookAllocation / popupBudget) * 251.2).toFixed(1)} 251.2`}
                          strokeDashoffset="0"
                          className="transition-all duration-1000 ease-out"
                        />
                        {/* Omen segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#746097"
                          strokeWidth="8"
                          strokeDasharray={`${((result.lmsrAllocation / popupBudget) * 251.2).toFixed(1)} 251.2`}
                          strokeDashoffset={`-${((result.orderBookAllocation / popupBudget) * 251.2).toFixed(1)}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Center text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">${popupBudget}</div>
                          <div className="text-xs text-base-content/70">Total Budget</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Polymarket Details */}
                  {result.orderBookAllocation > 0 && (
                    <div className="flex-1 space-y-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#358FC6' }}></div>
                          <span className="text-lg font-medium text-base-content">Polymarket</span>
                        </div>
                        <div className="text-3xl font-bold text-base-content mb-2 text-right">
                          {((result.orderBookAllocation / popupBudget) * 100).toFixed(0)}%
                        </div>
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between">
                            <span className="text-sm text-base-content/70">Amount:</span>
                            <span className="text-base-content font-medium">${result.orderBookAllocation.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-base-content/70">Shares:</span>
                            <span className="text-base-content font-medium">{Math.round(result.orderBookShares)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                {/* Total Expected Return */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="mb-2">
                    <div className="text-lg font-semibold text-gray-700">Total Expected Return</div>
                    <div className="text-2xl font-bold text-gray-800">{Math.round(result.totalShares)} shares</div>
                    <div className="text-sm text-gray-600">Optimized for maximum efficiency across platforms</div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Final Cost per Share:</span>
                      <span className="text-lg font-semibold text-gray-800">
                        ${(result.totalCost / result.totalShares).toFixed(2)}
                      </span>
                    </div>

                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    }
    </div>
  );
}