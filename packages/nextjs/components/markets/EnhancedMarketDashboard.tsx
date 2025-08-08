"use client";

import React, { useState } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { useCombinedMarkets, CombinedMarket, NormalizedMarket } from '../../hooks/useCombinedMarkets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      case 'polymarket': return 'bg-purple-100 text-purple-800';
      case 'omen': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 Enhanced Prediction Markets Hub
        </h1>
        <p className="text-gray-600 mb-4">
          Unified market data with intelligent combination and real volume tracking
        </p>
        
        {/* Controls */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Squares2X2Icon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Combined Markets</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.totalCombined}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <RectangleStackIcon className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Individual Markets</p>
                <p className="text-2xl font-semibold text-gray-600">{stats.totalIndividual}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {viewMode === 'combined' ? 'Combined Volume' : 'Individual Volume'}
                </p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatVolume(viewMode === 'combined' ? stats.totalVolumeCombined : stats.totalVolumeIndividual)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {viewMode === 'combined' ? 'Avg Match Confidence' : 'Platform Sources'}
                </p>
                <p className="text-2xl font-semibold text-purple-600">
                  {viewMode === 'combined' 
                    ? `${Math.round(stats.averageMatchConfidence * 100)}%`
                    : `${stats.polymarket + stats.omen}`
                  }
                </p>
              </div>
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
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                {'combinedVolume' in market ? (
                  // Combined market badges
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      COMBINED
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(market.matchConfidence * 100)}% match
                    </span>
                  </div>
                ) : (
                  // Individual market badge
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(market.source)}`}>
                    {market.source}
                  </span>
                )}
                <div className="text-xs text-gray-500">
                  {market.outcomes?.length || 2} outcomes
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                {market.title}
              </h3>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-2 text-xs text-gray-600">
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
  );
};
