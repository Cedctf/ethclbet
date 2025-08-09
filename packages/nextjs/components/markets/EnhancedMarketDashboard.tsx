"use client";

import React, { useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { useCombinedMarkets, CombinedMarket, NormalizedMarket } from '../../hooks/useCombinedMarkets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroSection } from './HeroSection';


/**
 * Enhanced dashboard component that displays both individual and combined markets
 * Uses the new JSON structure with combined markets support
 */
export const EnhancedMarketDashboard: React.FC = () => {
  const { data, loading, error, lastUpdated, refetch, triggerUpdate, stats } = useCombinedMarkets();
  const [viewMode, setViewMode] = useState<'combined' | 'individual'>('combined');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const router = useRouter();

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

  const displayMarkets = viewMode === 'combined' ? data.combinedMarkets : data.individualMarkets;

  return (
    <div className="relative">
      <HeroSection />

      <div
        id="market-section"
        className="relative z-20 bg-base-200 min-h-screen"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 pt-8">
            <h2 className="text-3xl font-bold text-base-content mb-4">
              Market Dashboard
            </h2>
            <p className="text-base-content/70 mb-6">
              Real-time prediction market data and analytics
            </p>

            {/* Controls */}
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Update from APIs
          </button>
          
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
              <Squares2X2Icon className="w-4 h-4" />
              Combined ({stats.totalCombined})
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-base-100 text-primary shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
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

          {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Squares2X2Icon className="w-8 h-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-base-content/70">Combined Markets</p>
                <p className="text-2xl font-semibold text-primary">{stats.totalCombined}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <RectangleStackIcon className="w-8 h-8 text-base-content/70" />
              <div className="ml-3">
                <p className="text-sm font-medium text-base-content/70">Individual Markets</p>
                <p className="text-2xl font-semibold text-base-content">{stats.totalIndividual}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-base-content/70">
                  {viewMode === 'combined' ? 'Combined Volume' : 'Individual Volume'}
                </p>
                <p className="text-2xl font-semibold text-success">
                  {formatVolume(viewMode === 'combined' ? stats.totalVolumeCombined : stats.totalVolumeIndividual)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-base-content/70">
                  {viewMode === 'combined' ? 'Avg Match Confidence' : 'Platform Sources'}
                </p>
                <p className="text-2xl font-semibold text-primary">
                  {viewMode === 'combined'
                    ? `${Math.round(stats.averageMatchConfidence * 100)}%`
                    : `${stats.polymarket + stats.omen}`
                  }
                </p>
              </div>
            </div>
          </div>
          </div>

          {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayMarkets.map((market) => (
          <div
            key={market.id}
            onClick={() => handleMarketClick(market)}
            className="bg-base-100 rounded-lg shadow-sm border border-base-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between mb-2">
                {'combinedVolume' in market ? (
                  // Combined market badges
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gd-combined-tag">
                      COMBINED
                    </span>
                    <span className="text-xs text-base-content/70">
                      {Math.round(market.matchConfidence * 100)}% match
                    </span>
                  </div>
                ) : (
                  // Individual market badge
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                    {market.source}
                  </span>
                )}
                <div className="text-xs text-base-content/70">
                  {market.outcomes?.length || 2} outcomes
                </div>
              </div>
              <h3 className="text-sm font-medium text-base-content line-clamp-2 leading-tight">
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

            {/* Content */}
            <div className="p-4">
              <div className="space-y-2 text-xs text-base-content/70">
                <div>
                  <span className="font-medium">Volume:</span> {
                    'combinedVolume' in market
                      ? formatVolume(market.combinedVolume)
                      : formatVolume(market.volume || 0)
                  }
                </div>
                <div>
                  <span className="font-medium">Category:</span> {market.category || 'General'}
                </div>
                {'combinedVolume' in market ? (
                  <div>
                    <span className="font-medium">Platforms:</span> {
                      [market.polymarketMarket && 'Polymarket', market.omenMarket && 'Omen']
                        .filter(Boolean).join(' + ')
                    }
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">Source:</span> {market.source}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {'combinedVolume' in market 
                  ? 'Click to view combined market analysis'
                  : 'Click to view market details'
                }
              </div>
            </div>
          </div>
        ))}
      </div>

          {displayMarkets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                No {viewMode} markets found
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};


