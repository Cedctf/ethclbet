"use client";

import { motion } from "framer-motion";
import {
  Expandable,
  ExpandableCard,
  ExpandableContent,
  ExpandableTrigger,
  ExpandableCardHeader,
  ExpandableCardContent
} from '../ui/expandable-card';

interface MarketCardProps {
  market: any;
  formatVolume: (volume: number) => string;
}

const getSourceBadgeColor = (source: string): string => {
  switch (source) {
    case 'polymarket': return 'bg-[#0000FF]/10 text-[#0000FF]';
    case 'omen': return 'bg-success/20 text-success';
    default: return 'bg-base-300 text-base-content';
  }
};

export const MarketCard: React.FC<MarketCardProps> = ({ market, formatVolume }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Expandable transitionDuration={0.3}>
        <ExpandableCard className="h-fit">
          <ExpandableTrigger className="w-full h-full flex flex-col">
            <ExpandableCardHeader navigateToAnalysis={true} analysisPath={`/market/${market.id}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
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
                      {market.source}
                    </span>
                  )}
                  <div className="text-xs text-base-content/70">
                    {market.outcomes?.length || 2} outcomes
                  </div>
                </div>
                <h3 className="text-sm font-medium text-base-content text-left line-clamp-2 leading-tight hover:text-primary transition-colors">
                  {/* Show main title - smart extraction based on question type */}
                  {(() => {
                    const title = market.title;

                    // For sports games (Team vs Team format)
                    if (title.includes(' vs. ') || title.includes(' vs ')) {
                      // Extract just the matchup part
                      const vsMatch = title.match(/^([^:]+(?:\s+vs\.?\s+[^:]+))/i);
                      if (vsMatch) {
                        return vsMatch[1].trim();
                      }
                    }

                    // For regular questions, split at "?"
                    if (title.includes('?')) {
                      return title.split('?')[0] + '?';
                    }

                    // For other formats, take first sentence or up to 60 characters
                    const firstSentence = title.split('.')[0];
                    if (firstSentence.length <= 60) {
                      return firstSentence + (title.includes('.') ? '.' : '');
                    }

                    // Fallback: truncate at 60 characters
                    return title.length > 60 ? title.substring(0, 60) + '...' : title;
                  })()}
                </h3>
              </div>
            </ExpandableCardHeader>

            <ExpandableCardContent>
              {/* Basic Info - Always Visible */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-base-content/60">Volume:</span>
                    <div className="font-semibold text-base-content">
                      {'combinedVolume' in market
                        ? formatVolume(market.combinedVolume)
                        : formatVolume(market.volume || 0)
                      }
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-base-content/60">Category:</span>
                    <div className="text-base-content">
                      {(market.category || 'General').charAt(0).toUpperCase() + (market.category || 'General').slice(1)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {'combinedVolume' in market ? (
                    <div>
                      <span className="font-medium text-base-content/60">Platforms:</span>
                      <div className="text-base-content">
                        {[market.polymarketMarket && 'Polymarket', market.omenMarket && 'Omen']
                          .filter(Boolean).join(' + ')
                        }
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium text-base-content/60">Source:</span>
                      <div className="text-base-content">
                        {market.source.charAt(0).toUpperCase() + market.source.slice(1)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ExpandableCardContent>
          </ExpandableTrigger>

          <ExpandableCardContent>
            <div className="space-y-3">
              {/* Expandable Details */}
              <ExpandableContent preset="slide-up">
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  {/* Complete Title - Only shown when expanded */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-base-content">Complete Question</h4>
                    <p className="text-sm text-base-content/80 leading-relaxed">
                      {market.title}
                    </p>
                  </div>

                  <h4 className="text-sm font-semibold text-base-content">Market Details</h4>

                  {/* Outcomes */}
                  {market.outcomes && market.outcomes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-base-content/70">Outcomes:</span>
                      <div className="space-y-2">
                        {market.outcomes.map((outcome: any, index: number) => {
                          const outcomeText = typeof outcome === 'string'
                            ? outcome
                            : (outcome as any)?.name || `Outcome ${index + 1}`;
                          const outcomePrice = typeof outcome === 'object' && (outcome as any)?.price
                            ? `${((outcome as any).price * 100).toFixed(1)}%`
                            : 'N/A';

                          return (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                              <span className="text-xs text-base-content/80">{outcomeText}</span>
                              <span className="text-sm font-bold text-primary">{outcomePrice}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Details for Combined Markets */}
                  {'combinedVolume' in market && (
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-base-content/70">Platform Breakdown:</span>
                      <div className="grid grid-cols-1 gap-2">
                        {market.polymarketMarket && (
                          <div className="flex justify-between items-center p-2 bg-[#0000FF]/5 dark:bg-[#0000FF]/20 rounded-md">
                            <span className="text-xs font-medium text-[#0000FF] dark:text-[#0000FF]">Polymarket</span>
                            <span className="text-xs font-semibold text-[#0000FF]/90">{formatVolume(market.polymarketMarket.volume || 0)}</span>
                          </div>
                        )}
                        {market.omenMarket && (
                          <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">Omen</span>
                            <span className="text-xs font-semibold">{formatVolume(market.omenMarket.volume || 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ExpandableContent>
            </div>
          </ExpandableCardContent>
        </ExpandableCard>
      </Expandable>
    </motion.div>
  );
};
