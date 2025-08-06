"use client";

import { useState, useEffect } from 'react';

// Types for combined markets
export interface CombinedMarket {
  id: string;
  title: string; // Custom combined title
  category: string;
  combinedVolume: number;
  matchConfidence: number;
  polymarketMarket?: {
    id: string;
    title: string; // Original title (preserved)
    originalTitle: string; // Backup of original
    customDisplayTitle?: string; // Optional custom display
    volume: number;
    rawData: any;
  };
  omenMarket?: {
    id: string;
    title: string; // Original title (preserved)
    originalTitle: string; // Backup of original
    customDisplayTitle?: string; // Optional custom display
    volume: number;
    category: string;
    rawData: any;
  };
  createdAt: string;
  outcomes: string[];
}

export interface NormalizedMarket {
  id: string;
  title: string;
  source: 'polymarket' | 'omen';
  category: string;
  volume: number;
  createdAt: string;
  outcomes: string[];
  rawData: any;
}

export interface EnhancedMarketData {
  timestamp: string;
  totalMarkets: number;
  polymarketCount: number;
  omenCount: number;
  individualMarkets: NormalizedMarket[];
  combinedMarkets: CombinedMarket[];
  metadata: {
    polymarketEndpoint: string;
    omenEndpoint: string;
    orderbookEndpoint: string;
    combinedPolymarketData: boolean;
    fetchedAt: string;
    orderbooksCount: number;
    hasCombinedMarkets: boolean;
  };
}

export interface CombinedMarketStats {
  totalIndividual: number;
  totalCombined: number;
  polymarket: number;
  omen: number;
  totalVolumeIndividual: number;
  totalVolumeCombined: number;
  averageMatchConfidence: number;
}

/**
 * Enhanced hook for managing both individual and combined market data
 */
export const useCombinedMarkets = () => {
  const [data, setData] = useState<EnhancedMarketData>({
    timestamp: '',
    totalMarkets: 0,
    polymarketCount: 0,
    omenCount: 0,
    individualMarkets: [],
    combinedMarkets: [],
    metadata: {
      polymarketEndpoint: '',
      omenEndpoint: '',
      orderbookEndpoint: '',
      combinedPolymarketData: false,
      fetchedAt: '',
      orderbooksCount: 0,
      hasCombinedMarkets: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch data from JSON file
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/market-data.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      // Handle both old and new JSON formats
      const enhancedData: EnhancedMarketData = {
        timestamp: jsonData.timestamp || new Date().toISOString(),
        totalMarkets: jsonData.totalMarkets || 0,
        polymarketCount: jsonData.polymarketCount || 0,
        omenCount: jsonData.omenCount || 0,
        individualMarkets: jsonData.individualMarkets || jsonData.markets || [],
        combinedMarkets: jsonData.combinedMarkets || [],
        metadata: {
          polymarketEndpoint: jsonData.metadata?.polymarketEndpoint || '',
          omenEndpoint: jsonData.metadata?.omenEndpoint || '',
          orderbookEndpoint: jsonData.metadata?.orderbookEndpoint || '',
          combinedPolymarketData: jsonData.metadata?.combinedPolymarketData || false,
          fetchedAt: jsonData.metadata?.fetchedAt || '',
          orderbooksCount: jsonData.metadata?.orderbooksCount || 0,
          hasCombinedMarkets: jsonData.metadata?.hasCombinedMarkets || false
        }
      };
      
      setData(enhancedData);
      setLastUpdated(new Date(enhancedData.timestamp));
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Trigger data update via API
  const triggerUpdate = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/save-subgraph-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Data update result:', result);
      
      // Refetch the updated data
      await fetchData();
      
      return true;
    } catch (err) {
      console.error('Error updating data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update data');
      return false;
    }
  };

  // Calculate statistics
  const getStats = (): CombinedMarketStats => {
    const totalVolumeIndividual = data.individualMarkets.reduce((sum, market) => sum + (market.volume || 0), 0);
    const totalVolumeCombined = data.combinedMarkets.reduce((sum, market) => sum + (market.combinedVolume || 0), 0);
    const averageMatchConfidence = data.combinedMarkets.length > 0 
      ? data.combinedMarkets.reduce((sum, market) => sum + market.matchConfidence, 0) / data.combinedMarkets.length 
      : 0;

    return {
      totalIndividual: data.individualMarkets.length,
      totalCombined: data.combinedMarkets.length,
      polymarket: data.polymarketCount,
      omen: data.omenCount,
      totalVolumeIndividual,
      totalVolumeCombined,
      averageMatchConfidence
    };
  };

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
    triggerUpdate,
    stats: getStats()
  };
};

/**
 * Hook specifically for combined markets stats
 */
export const useCombinedMarketStats = () => {
  const { data } = useCombinedMarkets();
  
  return {
    totalIndividual: data.individualMarkets.length,
    totalCombined: data.combinedMarkets.length,
    polymarket: data.polymarketCount,
    omen: data.omenCount,
    totalVolumeIndividual: data.individualMarkets.reduce((sum, market) => sum + (market.volume || 0), 0),
    totalVolumeCombined: data.combinedMarkets.reduce((sum, market) => sum + (market.combinedVolume || 0), 0),
    averageMatchConfidence: data.combinedMarkets.length > 0 
      ? data.combinedMarkets.reduce((sum, market) => sum + market.matchConfidence, 0) / data.combinedMarkets.length 
      : 0
  };
};
