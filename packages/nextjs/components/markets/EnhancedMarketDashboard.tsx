"use client";

import React, { useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useCombinedMarkets } from '../../hooks/useCombinedMarkets';
import { Hero } from '../ui/Hero';
import {
  Expandable,
  ExpandableCard,
  ExpandableContent,
  ExpandableTrigger,
  ExpandableCardHeader,
  ExpandableCardContent
} from '../ui/expandable-card';

// Simplified MarketSection props
interface MarketSectionProps {
  className?: string;
  id?: string;
}

interface DashboardState {
  autoRefresh: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

// Market Section with clean layout
const MarketSection: React.FC<MarketSectionProps & { children: React.ReactNode }> = ({
  className = "relative min-h-screen",
  id,
  children
}) => {
  return (
    <div className={`${className} py-12 px-4 sm:px-8 lg:px-12`} id={id}>
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
};

/**
 * Enhanced dashboard component that displays both individual and combined markets
 * Uses the new JSON structure with combined markets support and clean section layout
 */
export const EnhancedMarketDashboard: React.FC = () => {
  const { data, loading, error, lastUpdated, refetch, triggerUpdate, stats } = useCombinedMarkets();

  // Typed dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    autoRefresh: false,
    loading: false,
    error: null,
    searchQuery: ''
  });

  // View mode state
  const [viewMode, setViewMode] = useState<'combined' | 'individual'>('combined');

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
      case 'polymarket': return 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      case 'omen': return 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50';
      default: return 'bg-base-300 text-base-content';
    }
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filterMarkets = (markets: any[]) => {
    if (!dashboardState.searchQuery) return markets;
    const query = dashboardState.searchQuery.toLowerCase();
    return markets.filter(market => 
      market.title.toLowerCase().includes(query) ||
      market.category?.toLowerCase().includes(query) ||
      market.source?.toLowerCase().includes(query)
    );
  };

  const combinedMarkets = filterMarkets(data.combinedMarkets);
  const individualMarkets = filterMarkets(data.individualMarkets);

  return (
    <div className="relative">
      {/* Hero Section - Normal document flow */}
      <Hero
        description="Discover and analyze prediction markets across multiple platforms. Compare odds, track performance, and make data-driven decisions."
        primaryCTA={{
          text: "View Markets",
          href: "#market-section"
        }}
        secondaryCTA={{
          text: "How it Works",
          href: "/about"
        }}
      />

      {/* Market Section - Normal document flow, positioned below hero section */}
      <MarketSection className="relative !bg-white dark:!bg-black min-h-screen" id="market-section">
        <div className="mb-6 pt-0">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-4">
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
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Update from APIs
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('combined')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'combined' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'individual' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Individual
              </button>
            </div>
          </div>

          {/* Combined Markets Section */}
          {viewMode === 'combined' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <ChartBarIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Combined Markets ({stats.totalCombined})</h2>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {combinedMarkets.map((market) => (
                  <motion.div
                    key={market.id}
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
                                      {Math.round((market.matchConfidence || 0) * 100)}% match
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                                    <div className={`w-2 h-2 rounded-full ${market.source === 'polymarket' ? 'bg-blue-500' : market.source === 'omen' ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                                    {market.source.toUpperCase()}
                                  </span>
                                )}
                                <div className="text-xs text-base-content/70">
                                  {market.outcomes?.length || 2} outcomes
                                </div>
                              </div>
                              <h3 className="text-sm font-medium text-base-content text-left line-clamp-2 leading-tight hover:text-primary transition-colors">
                                {market.title}
                              </h3>
                            </div>
                          </ExpandableCardHeader>

                          <ExpandableCardContent>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-base-content/60">Volume:</span>
                                  <div className="font-semibold text-base-content">
                                    {formatVolume(market.combinedVolume || market.volume || 0)}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-base-content/60">Category:</span>
                                  <div className="text-base-content">
                                    {(market.category || 'General').charAt(0).toUpperCase() + (market.category || 'General').slice(1)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-base-content/60">Type:</span>
                                <div className="text-base-content">
                                  Combined Market
                                </div>
                              </div>
                            </div>
                          </ExpandableCardContent>
                        </ExpandableTrigger>
                      </ExpandableCard>
                    </Expandable>
                  </motion.div>
                ))}
              </motion.div>

              {combinedMarkets.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-12"
                >
                  <div className="text-gray-500">
                    No combined markets found
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Individual Markets Section */}
          {viewMode === 'individual' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <RectangleStackIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Individual Markets ({stats.totalIndividual})</h2>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {individualMarkets.map((market) => (
                  <motion.div
                    key={market.id}
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
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                                  <div className={`w-2 h-2 rounded-full ${market.source === 'polymarket' ? 'bg-blue-500' : market.source === 'omen' ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                                  {market.source.toUpperCase()}
                                </span>
                                <div className="text-xs text-base-content/70">
                                  {market.outcomes?.length || 2} outcomes
                                </div>
                              </div>
                              <h3 className="text-sm font-medium text-base-content text-left line-clamp-2 leading-tight hover:text-primary transition-colors">
                                {market.title}
                              </h3>
                            </div>
                          </ExpandableCardHeader>

                          <ExpandableCardContent>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-base-content/60">Volume:</span>
                                  <div className="font-semibold text-base-content">
                                    {formatVolume(market.volume || 0)}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium text-base-content/60">Category:</span>
                                  <div className="text-base-content">
                                    {(market.category || 'General').charAt(0).toUpperCase() + (market.category || 'General').slice(1)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-base-content/60">Source:</span>
                                <div className="text-base-content">
                                  {market.source.charAt(0).toUpperCase() + market.source.slice(1)}
                                </div>
                              </div>
                            </div>
                          </ExpandableCardContent>
                        </ExpandableTrigger>
                      </ExpandableCard>
                    </Expandable>
                  </motion.div>
                ))}
              </motion.div>

              {individualMarkets.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-12"
                >
                  <div className="text-gray-500">
                    No individual markets found
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </MarketSection>
    </div>
  );
};