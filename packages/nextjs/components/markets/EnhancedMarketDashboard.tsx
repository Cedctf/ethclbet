"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon, MagnifyingGlassIcon, XMarkIcon, FunnelIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
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
  viewMode: 'combined' | 'individual' | 'all';
  autoRefresh: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  showFilterDropdown: boolean;
  filters: {
    source: string[];
    category: string[];
    volumeRange: string;
  };
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
    viewMode: 'combined',
    autoRefresh: false,
    loading: false,
    error: null,
    searchQuery: '',
    showFilterDropdown: false,
    filters: {
      source: [],
      category: [],
      volumeRange: 'all'
    }
  });
  
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Update view mode with type safety
  const updateViewMode = (mode: 'combined' | 'individual' | 'all'): void => {
    setDashboardState(prev => ({ ...prev, viewMode: mode }));
  };

  // Search functionality
  const handleSearchChange = (value: string) => {
    setDashboardState(prev => ({ ...prev, searchQuery: value }));
  };

  const clearSearch = () => {
    setDashboardState(prev => ({ ...prev, searchQuery: '' }));
  };

  // Filter functionality
  const toggleFilterDropdown = () => {
    setDashboardState(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }));
  };

  const toggleSourceFilter = (source: string) => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        source: prev.filters.source.includes(source)
          ? prev.filters.source.filter(s => s !== source)
          : [...prev.filters.source, source]
      }
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        category: prev.filters.category.includes(category)
          ? prev.filters.category.filter(c => c !== category)
          : [...prev.filters.category, category]
      }
    }));
  };

  const setVolumeFilter = (range: string) => {
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, volumeRange: range }
    }));
  };

  const clearAllFilters = () => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        source: [],
        category: [],
        volumeRange: 'all'
      }
    }));
  };

  // Remove individual filters
  const removeSourceFilter = (source: string) => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        source: prev.filters.source.filter(s => s !== source)
      }
    }));
  };

  const removeCategoryFilter = (category: string) => {
    setDashboardState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        category: prev.filters.category.filter(c => c !== category)
      }
    }));
  };

  const removeVolumeFilter = () => {
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, volumeRange: 'all' }
    }));
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setDashboardState(prev => ({ ...prev, showFilterDropdown: false }));
      }
    };

    if (dashboardState.showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dashboardState.showFilterDropdown]);

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

  // Filter markets based on search query, view mode, and filters
  const allMarkets = dashboardState.viewMode === 'combined'
    ? data.combinedMarkets
    : dashboardState.viewMode === 'individual'
    ? data.individualMarkets
    : [...data.combinedMarkets, ...data.individualMarkets]; // 'all' mode shows both

  // Apply search filter
  let filteredMarkets = dashboardState.searchQuery.trim()
    ? allMarkets.filter(market =>
        market.title.toLowerCase().includes(dashboardState.searchQuery.toLowerCase()) ||
        market.category?.toLowerCase().includes(dashboardState.searchQuery.toLowerCase())
      )
    : allMarkets;

  // Apply additional filters
  if (dashboardState.filters.source.length > 0) {
    filteredMarkets = filteredMarkets.filter(market =>
      'source' in market && dashboardState.filters.source.includes(market.source.toLowerCase())
    );
  }

  if (dashboardState.filters.category.length > 0) {
    filteredMarkets = filteredMarkets.filter(market =>
      market.category && dashboardState.filters.category.includes(market.category.toLowerCase())
    );
  }

  // Apply volume filter
  if (dashboardState.filters.volumeRange !== 'all') {
    filteredMarkets = filteredMarkets.filter(market => {
      const volume = 'combinedVolume' in market ? market.combinedVolume : (market.volume || 0);
      switch (dashboardState.filters.volumeRange) {
        case 'low': return volume < 1000;
        case 'medium': return volume >= 1000 && volume < 10000;
        case 'high': return volume >= 10000;
        default: return true;
      }
    });
  }

  const displayMarkets = filteredMarkets;

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
          {/* First Row - Search and Refresh */}
          <div className="flex items-center gap-4 mb-4">
            {/* Search Component - Takes all available space */}
            <div className="relative flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={dashboardState.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search markets by title, description, or source..."
                  className="w-full pl-12 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                />
                {/* Search icon - Left side */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </div>
                {/* Clear button (X icon) - Right side */}
                {dashboardState.searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

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
            market={market}
            formatVolumeAction={formatVolume}
          />
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
        </div>
      </MarketSection>
    </div>
  );
};
