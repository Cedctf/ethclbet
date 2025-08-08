"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

import { CombinedMarket, NormalizedMarket } from '~~/hooks/useCombinedMarkets';
const OptimalSplitRouter = dynamic(() => import('./OptimalSplitRouter'), { ssr: false });

interface SimpleMarketDetailsViewProps {
  market: CombinedMarket | NormalizedMarket;
}

/**
 * Simplified MarketDetailsView that works with unified data structure
 */
export default function SimpleMarketDetailsView({ market }: SimpleMarketDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>('overview');

  // Helper functions
  const isCombinedMarket = (market: CombinedMarket | NormalizedMarket): market is CombinedMarket => {
    return 'combinedVolume' in market;
  };

  // Function to split title into main title and subtitle at first "-"
  const getTitleParts = () => {
    const fullTitle = getDisplayTitle();
    const dashIndex = fullTitle.indexOf(' - ');

    if (dashIndex !== -1) {
      return {
        mainTitle: fullTitle.substring(0, dashIndex).trim(),
        subtitle: fullTitle.substring(dashIndex + 3).trim()
      };
    }

    return {
      mainTitle: fullTitle,
      subtitle: null
    };
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

  const getMatchConfidence = (): number | null => {
    if (isCombinedMarket(market)) {
      return market.matchConfidence;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white mx-30 mb-10">
      {/* Header */}
      <div className="container mx-auto px-4 mt-4">
        <div className="p-6 bg-white">
          {/* Title and Volume */}
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-8">
              <h1 className="text-2xl font-bold text-base-content leading-tight mb-4">
                {getTitleParts().mainTitle}
              </h1>

              {/* Tags */}
              <div className="flex items-center gap-3 mb-4">
                {getDisplayCategory().toLowerCase() === 'cryptocurrency' ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                    {getDisplayCategory().toLowerCase()}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                    {getDisplayCategory().toLowerCase()}
                  </span>
                )}

                {isCombinedMarket(market) ? (
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-200 cursor-help relative group"
                    title="Data from multiple platforms"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    combined market
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 border border-gray-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                        Data from multiple platforms
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                    {market.source?.toUpperCase() || 'INDIVIDUAL'}
                  </span>
                )}
              </div>

              {/* Market Description */}
              {(() => {
                const { subtitle } = getTitleParts();
                return subtitle ? (
                  <div className="text-sm text-base-content/70 leading-relaxed">
                    {subtitle}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Volume Display */}
            <div className="text-right">
              <div className="text-2xl font-bold text-base-content">
                {formatVolume(getDisplayVolume())}
              </div>
              <div className="text-sm text-base-content/60 mt-1">
                {isCombinedMarket(market) ? 'Combined Volume' : 'Total Volume'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Main Container */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Content Container */}
          <div className="flex-1 lg:w-2/3">
            {/* Market Information Card */}
            <div className="mb-8 bg-white rounded-lg p-6">
              {/* Tabs */}
              <div className="flex flex-col">
                <div className="border-b border-base-300">
                  <nav className="flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'overview'
                          ? 'border-[#746097] text-[#746097]'
                          : 'border-transparent text-base-content/70 hover:text-base-content'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'data'
                          ? 'border-[#746097] text-[#746097]'
                          : 'border-transparent text-base-content/70 hover:text-base-content'
                      }`}
                    >
                      Raw Data
                    </button>
                  </nav>
                </div>

                <div className="flex-1">
                  {activeTab === 'overview' && (
                    <div className="p-6 h-full flex flex-col">
                      {/* Market Info */}
                      <div className="flex-1 dark:bg-gray-900/60 dark:border dark:border-gray-900/60 dark:rounded-lg dark:p-6">
                        <h3 className="text-lg font-semibold mb-4 text-base-content">Market Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400 mb-2">
                                <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                Market ID
                              </div>
                              <div className="font-mono text-base font-semibold break-all text-gray-900 dark:text-white">{market.id}</div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400 mb-2">
                                <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Outcomes
                              </div>
                              <div className="text-base font-semibold text-gray-900 dark:text-white">{getDisplayOutcomes().join(', ')}</div>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="flex flex-col h-full">
                            <div className="p-2.5 flex-1 flex flex-col justify-center">
                              <div className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400 mb-1">
                                <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Category
                              </div>
                              <div className="capitalize text-base font-semibold text-gray-900 dark:text-white">{getDisplayCategory()}</div>
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-center mt-1">
                              <div className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400 mb-1">
                                <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Volume
                              </div>
                              <div className="text-base font-semibold text-gray-900 dark:text-white">{formatVolume(getDisplayVolume())}</div>
                            </div>
                            {getMatchConfidence() !== null && (
                              <div className="p-2.5 flex-1 flex flex-col justify-center mt-1">
                                <div className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400 mb-1">
                                  <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Match Confidence
                                </div>
                                <div className="text-base font-semibold text-gray-900 dark:text-white">{Math.round((getMatchConfidence() || 0) * 100)}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-base-content">Raw Market Data</h3>
                      <div className="bg-base-300 rounded-lg p-4">
                        <pre className="text-sm overflow-auto text-base-content max-h-96">
                          {JSON.stringify(market, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Horizontal Divider */}
            {isCombinedMarket(market) && (
              <div className="border-t border-gray-200 my-8"></div>
            )}

            {/* Platform Breakdown for Combined Markets */}
            {isCombinedMarket(market) && (
              <div className="rounded-lg p-6">
                <div className="p-4">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-[#F0F6FC] mb-8">Platform Breakdown</h3>

                  <div className="space-y-8">
                    {/* Chart Section */}
                    <div className="mb-8">
                      {(() => {
                        const polymarketVolume = market.polymarketMarket?.volume || 0;
                        const omenVolume = market.omenMarket?.volume || 0;
                        const totalVolume = polymarketVolume + omenVolume;

                        const polymarketPercentage = totalVolume > 0 ? (polymarketVolume / totalVolume) * 100 : 0;
                        const omenPercentage = totalVolume > 0 ? (omenVolume / totalVolume) * 100 : 0;

                        return (
                          <div className="flex items-center justify-center gap-8">
                            {/* Left Side - Polymarket Stats */}
                            {polymarketVolume > 0 && (
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                  <span className="text-base font-medium text-base-content">Polymarket</span>
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#358FC6' }}></div>
                                </div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#358FC6' }}>{polymarketPercentage.toFixed(1)}%</div>
                                <div className="text-sm text-base-content/70">{formatVolume(polymarketVolume)}</div>
                              </div>
                            )}

                            {/* Center - Clean Arc Chart */}
                            <div className="relative">
                              <div className="w-72 h-36">
                                <svg className="w-full h-full" viewBox="0 0 200 120">
                                  {/* Background semicircle */}
                                  <path
                                    d="M 30 100 A 70 70 0 0 1 170 100"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                  />

                                  {/* Polymarket arc */}
                                  {polymarketVolume > 0 && (
                                    <path
                                      d="M 30 100 A 70 70 0 0 1 170 100"
                                      fill="none"
                                      stroke="#358FC6"
                                      strokeWidth="16"
                                      strokeDasharray={`${(polymarketPercentage / 100) * 219.9} 219.9`}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  )}

                                  {/* Omen arc */}
                                  {omenVolume > 0 && (
                                    <path
                                      d="M 30 100 A 70 70 0 0 1 170 100"
                                      fill="none"
                                      stroke="#746097"
                                      strokeWidth="16"
                                      strokeDasharray={`${(omenPercentage / 100) * 219.9} 219.9`}
                                      strokeDashoffset={`-${(polymarketPercentage / 100) * 219.9}`}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  )}
                                </svg>

                                {/* Center text */}
                                <div className="absolute inset-0 flex items-end justify-center pb-3">
                                  <div className="text-center">
                                    <div className="text-base font-bold text-base-content">{formatVolume(totalVolume)}</div>
                                    <div className="text-xs text-base-content/70">Total Volume</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Side - Omen Stats */}
                            {omenVolume > 0 && (
                              <div className="text-left">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#746097' }}></div>
                                  <span className="text-base font-medium text-base-content">Omen</span>
                                </div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#746097' }}>{omenPercentage.toFixed(1)}%</div>
                                <div className="text-sm text-base-content/70">{formatVolume(omenVolume)}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Platform Details */}
                    <div>
                      <div className="space-y-4">
                        {/* Polymarket */}
                        {market.polymarketMarket && (
                          <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">Polymarket</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatVolume(market.polymarketMarket.volume || 0)}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Title:</span>
                                <div className="font-medium text-gray-900 dark:text-white mt-1">{market.polymarketMarket.title}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Omen */}
                        {market.omenMarket && (
                          <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">Omen</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatVolume(market.omenMarket.volume || 0)}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Title:</span>
                                <div className="font-medium text-gray-900 dark:text-white mt-1">{market.omenMarket.title}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Blue Container for Optimal Split Router (3) - Sticky */}
          <div className="lg:w-1/3 pt-6">
            <div className="sticky top-24">
              <OptimalSplitRouter market={market} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
