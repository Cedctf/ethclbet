"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface MarketCardProps {
  market: any;
  formatVolumeAction: (volume: number) => string;
}

const getSourceBadgeColor = (source: string): string => {
  switch (source) {
    case 'polymarket': return 'bg-[#0000FF]/10 text-[#0000FF]';
    case 'omen': return 'bg-[#f2a5db]/10 text-[#f2a5db]';
    default: return 'bg-base-300 text-base-content';
  }
};

// Generate realistic betting odds for outcomes
const generatePriceData = (outcomes: string[], marketId: string) => {
  // Use market ID as seed for consistent prices
  const seed = marketId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (seed % 100) / 100;
  
  const outcomesWithPrices = outcomes.map((outcome, index) => {
    let price = 0.5; // Default 50/50 odds
    
    if (outcomes.length === 2) {
      // For binary markets (Yes/No), create complementary odds
      if (index === 0) {
        // First outcome: between 25% and 75%
        price = 0.25 + (random * 0.5);
      } else {
        // Second outcome: complement of first
        const firstPrice = 0.25 + (random * 0.5);
        price = 1 - firstPrice;
      }
    } else {
      // For multi-outcome markets, distribute probabilities
      const baseProb = 1 / outcomes.length;
      const variation = (random + index * 0.3) % 0.4 - 0.2; // ±20% variation
      price = Math.max(0.05, Math.min(0.95, baseProb + variation));
    }
    
    return {
      name: outcome,
      price: price
    };
  });
  
  return outcomesWithPrices;
};

export const MarketCard: React.FC<MarketCardProps> = ({ market, formatVolumeAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link href={`/market/${market.id}`} className="block h-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-6 h-full flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {'combinedVolume' in market ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  COMBINED
                </span>
                <span className="text-sm font-bold text-primary">
                  {Math.round(market.matchConfidence * 100)}% match
                </span>
              </div>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                {market.source.toUpperCase()}
              </span>
            )}
            <div className="text-xs text-base-content/70">
              {market.outcomes?.length || 2} outcomes
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-base-content mb-4 line-clamp-3 leading-tight hover:text-primary transition-colors flex-grow">
            {(() => {
              const title = market.title;

              // For sports games (Team vs Team format)
              if (title.includes(' vs. ') || title.includes(' vs ')) {
                const vsMatch = title.match(/^([^:]+(?:\s+vs\.?\s+[^:]+))/i);
                if (vsMatch) {
                  return vsMatch[1].trim();
                }
              }

              // For regular questions, split at "?"
              if (title.includes('?')) {
                return title.split('?')[0] + '?';
              }

              // For other formats, take first sentence or up to 80 characters
              const firstSentence = title.split('.')[0];
              if (firstSentence.length <= 80) {
                return firstSentence + (title.includes('.') ? '.' : '');
              }

              // Fallback: truncate at 80 characters
              return title.length > 80 ? title.substring(0, 80) + '...' : title;
            })()}
          </h3>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-xs font-medium text-base-content/60 block mb-1">Volume:</span>
              <div className="text-sm font-semibold text-base-content">
                {'combinedVolume' in market
                  ? formatVolumeAction(market.combinedVolume)
                  : formatVolumeAction(market.volume || 0)
                }
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-base-content/60 block mb-1">
                {'combinedVolume' in market ? 'Platforms:' : 'Category:'}
              </span>
              <div className="text-sm text-base-content">
                {'combinedVolume' in market ? (
                  [market.polymarketMarket && 'Polymarket', market.omenMarket && 'Omen']
                    .filter(Boolean).join(' + ')
                ) : (
                  (market.category || 'General').charAt(0).toUpperCase() + (market.category || 'General').slice(1)
                )}
              </div>
            </div>
          </div>

          {/* Betting Odds */}
          {market.outcomes && market.outcomes.length > 0 && (
            <div className="mt-auto">
              {(() => {
                // Generate price data for this market
                const outcomesWithPrices = generatePriceData(market.outcomes, market.id);
                
                return (
                  <div className="space-y-3">
                    {/* Enhanced Betting Odds Display */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-base-content/60 mb-3">Betting Odds & Win Probability</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {outcomesWithPrices.slice(0, 2).map((outcome, index) => {
                          const outcomeText = outcome.name;
                          const outcomePrice = outcome.price;

                          // Determine if this is Yes/No for color coding
                          const isYes = outcomeText.toLowerCase().includes('yes');
                          const isNo = outcomeText.toLowerCase().includes('no');

                          // Calculate display values
                          const winRate = (outcomePrice * 100).toFixed(1);
                          const decimalOdds = (1 / outcomePrice).toFixed(2);
                          const impliedOdds = outcomePrice < 0.5 ? `+${((1/outcomePrice - 1) * 100).toFixed(0)}` : `-${((outcomePrice/(1-outcomePrice)) * 100).toFixed(0)}`;
                          const payout = `$${(100 * (1/outcomePrice)).toFixed(0)}`;

                          return (
                            <div key={index} className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                              isYes 
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                                : isNo 
                                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                            }`}>
                              {/* Outcome Label */}
                              <div className={`text-sm font-bold mb-2 ${isYes ? 'text-green-700 dark:text-green-300' : isNo ? 'text-red-700 dark:text-red-300' : 'text-primary'}`}>
                                {isYes ? 'YES' : isNo ? 'NO' : outcomeText}
                              </div>
                              
                              {/* Win Rate */}
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-base-content/60">Win Rate:</span>
                                <span className={`text-lg font-bold ${isYes ? 'text-green-600 dark:text-green-400' : isNo ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                                  {winRate}%
                                </span>
                              </div>
                              
                              {/* Visual Win Rate Bar */}
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    isYes ? 'bg-green-500' : isNo ? 'bg-red-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${winRate}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Platform Breakdown for Combined Markets */}
          {'combinedVolume' in market && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <span className="text-xs font-medium text-base-content/60 block mb-2">Platform Breakdown:</span>
              <div className="space-y-2">
                {market.polymarketMarket && (
                  <div className="flex justify-between items-center p-2 bg-[#0000FF]/5 dark:bg-[#0000FF]/20 rounded-md">
                    <span className="text-xs font-medium text-[#0000FF]">Polymarket</span>
                    <span className="text-xs font-semibold text-[#0000FF]/90">{formatVolumeAction(market.polymarketMarket.volume || 0)}</span>
                  </div>
                )}
                {market.omenMarket && (
                  <div className="flex justify-between items-center p-2 bg-[#f2a5db]/10 dark:bg-[#f2a5db]/20 rounded-md">
                    <span className="text-xs font-medium text-[#f2a5db] dark:text-[#f2a5db]">Omen</span>
                    <span className="text-xs font-semibold text-[#f2a5db]/90">{formatVolumeAction(market.omenMarket.volume || 0)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};