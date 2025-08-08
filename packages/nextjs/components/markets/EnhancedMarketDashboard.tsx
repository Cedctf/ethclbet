"use client";

import React, { useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useCombinedMarkets } from '../../hooks/useCombinedMarkets';
import { Hero } from '../ui/Hero';
import { MarketCard } from './MarketCard';

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
<<<<<<< HEAD
=======
    viewMode: 'combined',
>>>>>>> 24c291f (Market Card Display type change)
    autoRefresh: false,
    loading: false,
    error: null,
    searchQuery: ''
  });

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
      case 'polymarket': return 'badge-polymarket';
      case 'omen': return 'badge-omen';
      default: return 'bg-base-300 text-base-content';
    }
  };

  const handleMarketClick = (market: CombinedMarket | NormalizedMarket) => {
    console.log(`🎯 Navigating to market details:`, {
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

  const filterMarkets = (markets: any[]) => {
    return markets.filter(market => 
      dashboardState.searchQuery === '' || 
      market.title.toLowerCase().includes(dashboardState.searchQuery.toLowerCase()) ||
      market.category?.toLowerCase().includes(dashboardState.searchQuery.toLowerCase())
    );
  };

  const combinedMarkets = filterMarkets(data.combinedMarkets);
  const individualMarkets = filterMarkets(data.individualMarkets);

  return (
    <div className="relative">
      {/* Hero Section - Normal document flow */}
      <div className="relative w-full py-40 overflow-hidden">
        {/* Background gradient and blur effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-base-100/50 to-primary/5 backdrop-blur-xl" 
          style={{
            backgroundImage: 'url(/lightbg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Glass card container */}
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm bg-opacity-0 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl shadow-black/10 p-6 sm:p-8">
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
          </div>
        </div>
      </div>

      {/* Market Section - Normal document flow, positioned below hero section */}
      <MarketSection className="relative !bg-white dark:!bg-black min-h-screen pt-30" id="market-section">
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
            </div>

<<<<<<< HEAD
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search markets..."
                value={dashboardState.searchQuery}
                onChange={(e) => setDashboardState(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20"
              />
            </div>
          </div>

          {/* Combined Markets Section */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Squares2X2Icon className="w-5 h-5 text-primary" />
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
=======
            {/* Refresh Button - Icon only */}
          <button
            onClick={handleRefresh}
            disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-primary text-primary-content rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-colors"
              title="Refresh Data"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          </div>

          {/* Second Row - Filter, Active Filters, and Combined/Individual Toggle */}
          <div className="flex items-center gap-4 mb-4">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
            <button
                onClick={toggleFilterDropdown}
                className="flex items-center justify-center w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none"
              >
                <FunnelIcon className="w-4 h-4" />
            </button>

              {/* Filter Dropdown Menu */}
              {dashboardState.showFilterDropdown && (
                <div className="absolute top-12 left-0 z-50 w-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-0 p-6" style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
            <button
                      onClick={clearAllFilters}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Clear All
            </button>
          </div>
          
                  {/* Three Column Layout with Vertical Separators */}
                  <div className="flex">
                    {/* Source Filter */}
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Source</h4>
                      <div className="space-y-2">
                        {['polymarket', 'omen', 'metaculus'].map(source => (
                          <label key={source} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={dashboardState.filters.source.includes(source)}
                              onChange={() => toggleSourceFilter(source)}
                              className="mr-3 rounded"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{source}</span>
                          </label>
                        ))}
          </div>
        </div>

                    {/* Vertical Line */}
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-3"></div>

                    {/* Category Filter */}
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</h4>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'cryptocurrency', label: 'Crypto' },
                          { value: 'general', label: 'General' },
                          { value: 'sports', label: 'Sports' },
                          { value: 'meta', label: 'Meta' }
                        ].map((category) => (
                          <div key={category.value} className="flex items-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dashboardState.filters.category.includes(category.value)}
                                onChange={() => toggleCategoryFilter(category.value)}
                                className="mr-2 rounded"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{category.label}</span>
                            </label>
              </div>
                        ))}
            </div>
          </div>

                    {/* Vertical Line */}
                    <div className="w-px bg-gray-300 dark:bg-gray-600 mx-3"></div>

                    {/* Volume Range Filter */}
                    <div className="flex-1 pr-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Volume Range</h4>
                      <div className="space-y-2">
                        {[
                          { value: 'low', label: 'Under $1K' },
                          { value: 'medium', label: '$1K - $10K' },
                          { value: 'high', label: 'Over $10K' }
                        ].map(option => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              name="volumeRange"
                              value={option.value}
                              checked={dashboardState.filters.volumeRange === option.value}
                              onChange={() => setVolumeFilter(option.value)}
                              className="mr-3"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{option.label}</span>
                          </label>
                        ))}
              </div>
            </div>
          </div>
              </div>
              )}
          </div>

            {/* Active Filter Tags */}
            {(dashboardState.filters.source.length > 0 ||
              dashboardState.filters.category.length > 0 ||
              dashboardState.filters.volumeRange !== 'all') && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Source Filter Tags */}
                {dashboardState.filters.source.map(source => (
                  <div key={`source-${source}`} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">
                    <span className="capitalize">{source}</span>
                    <button
                      onClick={() => removeSourceFilter(source)}
                      className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Category Filter Tags */}
                {dashboardState.filters.category.map(category => {
                  const categoryLabels = {
                    'cryptocurrency': 'Crypto',
                    'general': 'General',
                    'sports': 'Sports',
                    'meta': 'Meta'
                  };
                  return (
                    <div key={`category-${category}`} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">
                      <span>{categoryLabels[category as keyof typeof categoryLabels] || category}</span>
                      <button
                        onClick={() => removeCategoryFilter(category)}
                        className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Volume Range Filter Tag */}
                {dashboardState.filters.volumeRange !== 'all' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">
                    <span>
                      {dashboardState.filters.volumeRange === 'low' && 'Under $1K'}
                      {dashboardState.filters.volumeRange === 'medium' && '$1K - $10K'}
                      {dashboardState.filters.volumeRange === 'high' && 'Over $10K'}
                    </span>
                    <button
                      onClick={removeVolumeFilter}
                      className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
              </div>
                )}
            </div>
            )}

            <div className="flex items-center flex-1 gap-4">
              <button
                onClick={() => updateViewMode('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform ${
                  dashboardState.viewMode === 'all'
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
                }`}
              >
                <ViewColumnsIcon className="w-4 h-4" />
                All {dashboardState.viewMode === 'all' && `(${stats.totalCombined + stats.totalIndividual})`}
              </button>

              {/* Vertical Line */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <button
                onClick={() => updateViewMode('combined')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform ${
                  dashboardState.viewMode === 'combined'
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                Combined {dashboardState.viewMode === 'combined' && `(${stats.totalCombined})`}
              </button>

              {/* Vertical Line */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <button
                onClick={() => updateViewMode('individual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform ${
                  dashboardState.viewMode === 'individual'
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
                }`}
              >
                <RectangleStackIcon className="w-4 h-4" />
                Individual {dashboardState.viewMode === 'individual' && `(${stats.totalIndividual})`}
              </button>
          </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayMarkets.map((market) => (
          <MarketCard 
            key={market.id}
<<<<<<< HEAD
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Expandable transitionDuration={0.15}>
                  <ExpandableCard className="h-fit">
                    <ExpandableTrigger className="w-full h-full flex flex-col">
                      <ExpandableCardHeader navigateToAnalysis={true} analysisPath={`/market/${market.id}`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                {'combinedVolume' in market ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gd-combined-tag">
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
>>>>>>> 2f7be9b (Hero Section Adjustment)
                                <div className="text-base-content">
                                  {(market.category || 'General').charAt(0).toUpperCase() + (market.category || 'General').slice(1)}
                                </div>
<<<<<<< HEAD
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
=======
                  </div>
                )}
              </div>
            </div>
>>>>>>> 2f7be9b (Hero Section Adjustment)
                      </ExpandableCardContent>
                    </ExpandableCard>
                  </Expandable>
                </motion.div>
              ))}
            </motion.div>

<<<<<<< HEAD
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

          {/* Individual Markets Section */}
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
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                                {market.source}
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
=======
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
              </motion.div>
=======
            market={market}
            formatVolumeAction={formatVolume}
          />
>>>>>>> 24c291f (Market Card Display type change)
        ))}
      </div>

          {displayMarkets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="text-center py-12"
            >
              <div className="text-gray-500">
                No {dashboardState.viewMode} markets found
              </div>
            </motion.div>
          )}
>>>>>>> 2f7be9b (Hero Section Adjustment)
        </div>
      </MarketSection>
    </div>
  );
};
