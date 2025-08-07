"use client";

import React, { useState, CSSProperties, useEffect, useRef } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useCombinedMarkets, CombinedMarket, NormalizedMarket } from '../../hooks/useCombinedMarkets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroSection } from './HeroSection';
import {
  Expandable,
  ExpandableCard,
  ExpandableContent,
  ExpandableTrigger,
  ExpandableCardHeader,
  ExpandableCardContent
} from '../ui/expandable-card';
import '../../styles/scroll-transitions.css';

// TypeScript interfaces for transition effects
interface TransitionConfig {
  marginTop: string;
  clipPath: string;
  paddingTop: string;
  zIndex: number;
  backgroundColor?: string;
  boxShadow?: string;
}

interface MarketSectionAnimationConfig {
  slideInDuration: string;
  slideInEasing: string;
  slideInDelay: string;
  slideInDistance: string;
}

interface MarketSectionProps {
  transitionConfig?: TransitionConfig;
  animationConfig?: MarketSectionAnimationConfig;
  className?: string;
  onSlideInStart?: () => void;
  onSlideInComplete?: () => void;
}

interface DashboardState {
  viewMode: 'combined' | 'individual';
  autoRefresh: boolean;
  loading: boolean;
  error: string | null;
}

// Default transition configuration
const defaultTransitionConfig: TransitionConfig = {
  marginTop: '-8rem',
  clipPath: 'polygon(0 8rem, 100% 0, 100% 100%, 0 100%)',
  paddingTop: '10rem',
  zIndex: 20,
  backgroundColor: 'rgb(229 231 235)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

// Default animation configuration
const defaultMarketAnimationConfig: MarketSectionAnimationConfig = {
  slideInDuration: '1.2s',
  slideInEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  slideInDelay: '0.3s',
  slideInDistance: '100px'
};

// Market Section with white background for light theme
const MarketSection: React.FC<MarketSectionProps & { children: React.ReactNode }> = ({
  className = "relative min-h-screen",
  children
}) => {
  const sectionStyle: CSSProperties = {
    padding: '0px 40px',
    zIndex: 2,
    marginTop: '-200px',
    position: 'relative',
  };

  return (
    <div
      className={`${className} market-slide-over`}
      style={sectionStyle}
    >
      <div className="container mx-auto px-4 pt-0 pb-8 market-content relative z-10">
        {children}
      </div>
    </div>
  );
};

/**
 * Enhanced dashboard component that displays both individual and combined markets
 * Uses the new JSON structure with combined markets support and TypeScript transitions
 */
export const EnhancedMarketDashboard: React.FC = () => {
  const { data, loading, error, lastUpdated, refetch, triggerUpdate, stats } = useCombinedMarkets();

  // Typed dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    viewMode: 'combined',
    autoRefresh: false,
    loading: false,
    error: null
  });

  const router = useRouter();

  // Update view mode with type safety
  const updateViewMode = (mode: 'combined' | 'individual'): void => {
    setDashboardState(prev => ({ ...prev, viewMode: mode }));
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleUpdateData = async () => {
    const success = await triggerUpdate();
    if (success) {
      console.log('✅ Data updated successfully');
    }
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const getSourceBadgeColor = (source: string): string => {
    switch (source) {
      case 'polymarket': return 'bg-primary/20 text-primary';
      case 'omen': return 'bg-success/20 text-success';
      default: return 'bg-base-300 text-base-content';
    }
  };

  const handleMarketClick = (market: CombinedMarket | NormalizedMarket) => {
    console.log(`Navigating to market details:`, {
      id: market.id,
      title: market.title,
      type: 'combinedVolume' in market ? 'combined' : 'individual'
    });

    // Navigate to market details page
    router.push(`/market/${market.id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayMarkets = dashboardState.viewMode === 'combined' ? data.combinedMarkets : data.individualMarkets;

  return (
    <div className="relative">
      {/* Hero Section - Normal document flow */}
      <HeroSection />

      {/* Market Section - Normal document flow, will naturally cover hero when scrolled */}
      <MarketSection className="relative !bg-white dark:!bg-black min-h-screen">
          <div className="mb-6 pt-0">
            
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/80 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>

              <button
                onClick={handleUpdateData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
              >
                <ChartBarIcon className="w-4 h-4" />
                Update from APIs
              </button>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm h-10">
                <button
                  onClick={() => updateViewMode('combined')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 h-8 ${
                    dashboardState.viewMode === 'combined'
                      ? 'bg-white dark:bg-black text-primary shadow-md border border-primary/20 dark:border-primary/40'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  Combined ({stats.totalCombined})
                </button>
                <button
                  onClick={() => updateViewMode('individual')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 h-8 ${
                    dashboardState.viewMode === 'individual'
                      ? 'bg-white dark:bg-black text-primary shadow-md border border-primary/20 dark:border-primary/40'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <RectangleStackIcon className="w-4 h-4" />
                  Individual ({stats.totalIndividual})
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Unknown'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
              {/* Market Distribution Pie Chart */}
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg p-3 md:col-span-2">
                <div className="flex items-center justify-between h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Market Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm text-base-content/70">Combined Markets</span>
                        <span className="text-sm font-semibold text-primary">{stats.totalCombined}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
                        <span className="text-sm text-base-content/70">Individual Markets</span>
                        <span className="text-sm font-semibold text-black dark:text-white">{stats.totalIndividual}</span>
                      </div>
                      <div className="pt-2 border-t border-base-300">
                        <span className="text-xs text-base-content/60">
                          Total: {stats.totalCombined + stats.totalIndividual} markets
                          {stats.totalCombined + stats.totalIndividual > 0 && (
                            <span className="ml-2">
                              ({Math.round((stats.totalCombined / (stats.totalCombined + stats.totalIndividual)) * 100)}% combined)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Pie Chart with Tooltip */}
                  <div className="flex-shrink-0 ml-4 relative group">
                    {(() => {
                      const totalMarkets = stats.totalCombined + stats.totalIndividual;
                      const combinedPercentage = totalMarkets > 0 ? stats.totalCombined / totalMarkets : 0;
                      const individualPercentage = totalMarkets > 0 ? stats.totalIndividual / totalMarkets : 0;
                      const circumference = 2 * Math.PI * 30; // 2πr where r=30
                      const combinedArc = combinedPercentage * circumference;
                      const individualArc = individualPercentage * circumference;

                      return (
                        <>
                          <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90 cursor-pointer">
                            {/* Background circle */}
                            <circle
                              cx="40"
                              cy="40"
                              r="30"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="12"
                              className="text-gray-200 dark:text-gray-700"
                            />

                            {/* Combined markets (primary color) - starts at top */}
                            {stats.totalCombined > 0 && (
                              <circle
                                cx="40"
                                cy="40"
                                r="30"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={`${combinedArc} ${circumference}`}
                                className="text-primary transition-all duration-500 hover:opacity-80"
                                strokeLinecap="round"
                              />
                            )}

                            {/* Individual markets (black/white) - continues after combined */}
                            {stats.totalIndividual > 0 && (
                              <circle
                                cx="40"
                                cy="40"
                                r="30"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={`${individualArc} ${circumference}`}
                                strokeDashoffset={`-${combinedArc}`}
                                className="text-black dark:text-white transition-all duration-500 hover:opacity-80"
                                strokeLinecap="round"
                              />
                            )}
                          </svg>

                          {/* Tooltip */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                            <div className="text-center">
                              <div>Combined: {Math.round(combinedPercentage * 100)}%</div>
                              <div>Individual: {Math.round(individualPercentage * 100)}%</div>
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black dark:border-t-white"></div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Volume Card */}
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg p-3">
                <div className="text-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-black dark:text-white mb-1">
                    {dashboardState.viewMode === 'combined' ? 'Combined' : 'Individual'}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatVolume(dashboardState.viewMode === 'combined' ? stats.totalVolumeCombined : stats.totalVolumeIndividual)}
                  </p>
                </div>
              </div>

              {/* Performance Card */}
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg p-3">
                <div className="text-center">
                  <ChartBarIcon className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-black dark:text-white mb-1">
                    {dashboardState.viewMode === 'combined' ? 'Match Rate' : 'Sources'}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {dashboardState.viewMode === 'combined'
                      ? `${Math.round(stats.averageMatchConfidence * 100)}%`
                      : `${stats.polymarket + stats.omen}`
                    }
                  </p>
                </div>
              </div>

              {/* Categories Card */}
              <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg p-3">
                <div className="text-center">
                  <Squares2X2Icon className="w-6 h-6 text-info mx-auto mb-1" />
                  <p className="text-xs font-bold text-black dark:text-white mb-1">
                    Categories
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {(() => {
                      const allMarkets = [...data.combinedMarkets, ...data.individualMarkets];
                      const categories = new Set(allMarkets.map(m => m.category || 'General'));
                      return categories.size;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayMarkets.map((market) => (
              <Expandable key={market.id} transitionDuration={0.5}>
                <ExpandableCard className="h-fit">
                  <ExpandableTrigger className="w-full h-full flex flex-col">
                    <ExpandableCardHeader>
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
                        <h3
                          className="text-sm font-medium text-base-content text-left line-clamp-2 leading-tight hover:text-primary transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarketClick(market);
                          }}
                        >
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
                                {market.outcomes.map((outcome, index) => {
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
                                  <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Polymarket</span>
                                    <span className="text-xs font-semibold">{formatVolume(market.polymarketMarket.volume || 0)}</span>
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
            ))}
          </div>

          {displayMarkets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No {dashboardState.viewMode} markets found
              </div>
            </div>
          )}
      </MarketSection>
    </div>
  );
};
