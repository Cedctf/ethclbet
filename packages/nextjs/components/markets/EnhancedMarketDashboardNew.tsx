"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowPathIcon, ChartBarIcon, CurrencyDollarIcon, ClockIcon, Squares2X2Icon, RectangleStackIcon, MagnifyingGlassIcon, XMarkIcon, FunnelIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
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
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Typed dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    viewMode: 'all',
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

  // Update view mode with type safety
  const updateViewMode = (mode: 'combined' | 'individual' | 'all'): void => {
    setDashboardState(prev => ({ ...prev, viewMode: mode }));
  };

  const handleRefresh = async () => {
    await refetch();
    // Maintain position in market section after refresh with offset
    setTimeout(() => {
      const marketSection = document.getElementById('market-section');
      if (marketSection) {
        // Calculate position with offset (my-15 = 60px below top)
        const elementTop = marketSection.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - 60; // 60px offset (my-15 equivalent)

        // Smooth scroll to position with offset
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
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
        market.description?.toLowerCase().includes(dashboardState.searchQuery.toLowerCase()) ||
        (market.source && market.source.toLowerCase().includes(dashboardState.searchQuery.toLowerCase()))
      )
    : allMarkets;

  // Apply additional filters
  if (dashboardState.filters.source.length > 0) {
    filteredMarkets = filteredMarkets.filter(market =>
      market.source && dashboardState.filters.source.includes(market.source.toLowerCase())
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
      const volume = market.volume || 0;
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
      <Hero />

      {/* Market Section - Normal document flow, positioned below hero section */}
      <MarketSection className="relative !bg-white dark:!bg-black min-h-screen bg-base-200 mx-4 sm:mx-8 lg:mx-12" id="market-section">
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
<<<<<<< HEAD

              <button
                onClick={handleUpdateData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
              >
                <ChartBarIcon className="w-4 h-4" />
                Update from APIs
              </button>
              
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm h-10">
=======
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

>>>>>>> 71b2edd (add searh components)
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
                      ? 'text-primary bg-primary/10scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102'
                  }`}
                >
                  <RectangleStackIcon className="w-4 h-4" />
                  Individual {dashboardState.viewMode === 'individual' && `(${stats.totalIndividual})`}
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
