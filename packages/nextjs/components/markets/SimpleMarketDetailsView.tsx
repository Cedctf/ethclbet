"use client";

import React, { useState } from 'react';
import { ArrowLeftIcon, CurrencyDollarIcon, TagIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { CombinedMarket, NormalizedMarket } from '~~/hooks/useCombinedMarkets';
import OptimalSplitRouter from './OptimalSplitRouter';

interface SimpleMarketDetailsViewProps {
  market: CombinedMarket | NormalizedMarket;
}

/**
 * Simplified MarketDetailsView that works with unified data structure
 */
export default function SimpleMarketDetailsView({ market }: SimpleMarketDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>('overview');

  // Helper functions
  const isCombinedMarket = (market: CombinedMarket | NormalizedMarket): market is CombinedMarket => {
    return 'combinedVolume' in market;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDisplayVolume = (): number => {
    if (isCombinedMarket(market)) {
      return market.combinedVolume;
    }
    return market.volume || 0;
  };

  const getDisplayTitle = (): string => {
    return market.title || 'Untitled Market';
  };

  const getDisplayCategory = (): string => {
    if (isCombinedMarket(market)) {
      return market.category || 'general';
    }
    return market.category || 'general';
  };

  const getDisplayOutcomes = (): string[] => {
    if (isCombinedMarket(market)) {
      return market.outcomes || ['Yes', 'No'];
    }
    return market.outcomes || ['Yes', 'No'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 line-clamp-2">
                {getDisplayTitle()}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <TagIcon className="w-4 h-4" />
                  <span className="capitalize">{getDisplayCategory()}</span>
                </div>
                {isCombinedMarket(market) ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    COMBINED MARKET
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {market.source?.toUpperCase() || 'INDIVIDUAL'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatVolume(getDisplayVolume())}
              </div>
              <div className="text-sm text-gray-500">
                {isCombinedMarket(market) ? 'Combined Volume' : 'Total Volume'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'data'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Raw Data
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Market Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Market Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Market ID</div>
                          <div className="font-mono text-sm break-all">{market.id}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Category</div>
                          <div className="capitalize">{getDisplayCategory()}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Outcomes</div>
                          <div>{getDisplayOutcomes().join(', ')}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Volume</div>
                          <div className="text-green-600 font-semibold">{formatVolume(getDisplayVolume())}</div>
                        </div>
                      </div>
                    </div>

                    {/* Platform Breakdown for Combined Markets */}
                    {isCombinedMarket(market) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Polymarket */}
                          {market.polymarketMarket && (
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                <span className="font-semibold text-purple-800">Polymarket</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Title:</span>
                                  <div className="font-medium line-clamp-2">{market.polymarketMarket.title}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Volume:</span>
                                  <span className="font-semibold text-green-600 ml-2">
                                    {formatVolume(market.polymarketMarket.volume || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Omen */}
                          {market.omenMarket && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                <span className="font-semibold text-green-800">Omen</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Title:</span>
                                  <div className="font-medium line-clamp-2">{market.omenMarket.title}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Volume:</span>
                                  <span className="font-semibold text-green-600 ml-2">
                                    {formatVolume(market.omenMarket.volume || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'data' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Raw Market Data</h3>
                    <pre className="bg-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-96">
                      {JSON.stringify(market, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    <span className="text-gray-600">Volume</span>
                  </div>
                  <span className="font-semibold text-green-600">{formatVolume(getDisplayVolume())}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-600">Outcomes</span>
                  </div>
                  <span className="font-semibold">{getDisplayOutcomes().length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-600">Category</span>
                  </div>
                  <span className="font-semibold capitalize">{getDisplayCategory()}</span>
                </div>
                {isCombinedMarket(market) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Match Confidence</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round((market.matchConfidence || 0) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Market Type Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Market Type</h3>
              {isCombinedMarket(market) ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="font-semibold text-blue-600">Combined Market</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Data from multiple platforms
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TagIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="font-semibold text-green-600 capitalize">
                    {market.source || 'Individual'} Market
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Single platform data
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optimal Split Router Section */}
        <OptimalSplitRouter market={market} />
      </div>
    </div>
  );
}
