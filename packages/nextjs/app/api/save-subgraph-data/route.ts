import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Types for unified market data structure
interface NormalizedMarket {
  id: string;
  title: string;
  originalTitle: string;
  creator: string;
  source: 'polymarket' | 'omen';
  category: string;
  volume: number;
  scaledCollateralVolume: number;
  liquidityMeasure: number;
  outcomes: string[];
  outcomeSlotCount: number;
  creationTimestamp: string;
  rawData: any; // Store original data for debugging
}

interface SubgraphResponse {
  data?: any;
  errors?: any[];
}

interface CombinedMarket {
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
    tradesQuantity: string;
    buysQuantity: string;
    sellsQuantity: string;
    scaledCollateralBuyVolume: string;
    scaledCollateralSellVolume: string;
    rawData: any;
  };
  omenMarket?: {
    id: string;
    title: string; // Original title (preserved)
    originalTitle: string; // Backup of original
    customDisplayTitle?: string; // Optional custom display
    volume: number;
    category: string;
    tradesQuantity: string;
    buysQuantity: string;
    sellsQuantity: string;
    scaledCollateralBuyVolume: string;
    scaledCollateralSellVolume: string;
    rawData: any;
  };
  createdAt: string;
  outcomes: string[];
}

interface SavedMarketData {
  timestamp: string;
  totalMarkets: number;
  polymarketCount: number;
  omenCount: number;
  individualMarkets: NormalizedMarket[]; // Renamed from 'markets'
  combinedMarkets: CombinedMarket[]; // New combined markets section
  metadata: {
    polymarketEndpoint: string;
    omenEndpoint: string;
    orderbookEndpoint: string;
    combinedPolymarketData: boolean;
    fetchedAt: string;
    orderbooksCount: number;
    hasCombinedMarkets: boolean; // New flag
  };
}

// Helper function to unify market data structure
function unifyMarketData(market: any, source: 'polymarket' | 'omen', orderbook?: any) {
  if (source === 'polymarket') {
    return {
      id: market.id,
      title: market.question || 'Untitled Market',
      originalTitle: market.question || 'Untitled Market',
      creator: market.creator || 'Unknown',
      category: 'general',
      volume: orderbook ? parseFloat(orderbook.scaledCollateralVolume || '0') : 0,
      scaledCollateralVolume: orderbook ? parseFloat(orderbook.scaledCollateralVolume || '0') : 0,
      liquidityMeasure: orderbook ? parseFloat(orderbook.scaledCollateralBuyVolume || '0') : 0,
      outcomes: ['Yes', 'No'],
      outcomeSlotCount: 2,
      creationTimestamp: new Date().toISOString(),
      source: 'polymarket',
      // Add trading statistics
      tradesQuantity: orderbook?.tradesQuantity || '0',
      buysQuantity: orderbook?.buysQuantity || '0',
      sellsQuantity: orderbook?.sellsQuantity || '0',
      scaledCollateralBuyVolume: orderbook?.scaledCollateralBuyVolume || '0',
      scaledCollateralSellVolume: orderbook?.scaledCollateralSellVolume || '0',
      rawData: {
        market: market,
        orderbook: orderbook || {}
      }
    };
  } else {
    return {
      id: market.id,
      title: market.title || 'Untitled Market',
      originalTitle: market.title || 'Untitled Market',
      creator: market.creator || 'Unknown',
      category: market.category || 'general',
      volume: parseFloat(market.scaledCollateralVolume || '0'),
      scaledCollateralVolume: parseFloat(market.scaledCollateralVolume || '0'),
      liquidityMeasure: parseFloat(market.scaledLiquidityMeasure || '0'),
      outcomes: market.outcomes || ['Yes', 'No'],
      outcomeSlotCount: market.outcomeSlotCount || 2,
      creationTimestamp: market.creationTimestamp ? new Date(parseInt(market.creationTimestamp) * 1000).toISOString() : new Date().toISOString(),
      source: 'omen',
      // Add mock trading statistics for Omen (since it doesn't have orderbook data)
      tradesQuantity: Math.floor(Math.random() * 500 + 100).toString(),
      buysQuantity: Math.floor(Math.random() * 300 + 60).toString(),
      sellsQuantity: Math.floor(Math.random() * 200 + 40).toString(),
      scaledCollateralBuyVolume: (parseFloat(market.scaledCollateralVolume || '0') * 0.6).toString(),
      scaledCollateralSellVolume: (parseFloat(market.scaledCollateralVolume || '0') * 0.4).toString(),
      rawData: {
        market: market
      }
    };
  }
}

// Helper function to create combined markets using semantic matching
function createCombinedMarkets(
  polymarketMarkets: any[],
  omenMarkets: any[],
  orderbooks: any[]
): CombinedMarket[] {
  const combinedMarkets: CombinedMarket[] = [];
  const usedOmenMarkets = new Set<string>();

  polymarketMarkets.forEach((polyMarket: any, index: number) => {
    const polyText = (polyMarket.question || '').toLowerCase();
    let bestMatch: { market: any; confidence: number } | null = null;

    // Find best matching Omen market
    omenMarkets.forEach((omenMarket: any) => {
      if (usedOmenMarkets.has(omenMarket.id)) return;

      const omenText = (omenMarket.title || '').toLowerCase();
      let confidence = 0;

      // Enhanced matching logic - more flexible
      if (polyText.includes('bitcoin') && omenText.includes('bitcoin')) confidence += 0.6;
      if (polyText.includes('btc') && omenText.includes('btc')) confidence += 0.6;
      if (polyText.includes('dogecoin') && omenText.includes('dogecoin')) confidence += 0.6;
      if (polyText.includes('trump') && omenText.includes('trump')) confidence += 0.6;
      if (polyText.includes('super bowl') && omenText.includes('super bowl')) confidence += 0.6;
      if (polyText.includes('rams') && omenText.includes('rams')) confidence += 0.6;
      
      // Category matching
      if (polyText.includes('crypto') && omenText.includes('crypto')) confidence += 0.4;
      if (polyText.includes('sports') && omenText.includes('sports')) confidence += 0.4;
      if (polyText.includes('election') && omenText.includes('election')) confidence += 0.4;
      
      // Generic matching for testing - match any crypto with crypto
      if ((polyText.includes('bitcoin') || polyText.includes('crypto') || polyText.includes('dogecoin')) && 
          (omenText.includes('bitcoin') || omenText.includes('crypto') || omenText.includes('gbtc'))) {
        confidence += 0.5;
      }

      // Lower threshold for testing
      if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { market: omenMarket, confidence };
      }
    });

    if (bestMatch && bestMatch.confidence > 0.3) {
      const matchedMarket = bestMatch.market;
      usedOmenMarkets.add(matchedMarket.id);

      const orderbook = orderbooks[index % orderbooks.length];
      const polyVolume = orderbook ? parseFloat(orderbook.scaledCollateralVolume) : 0;
      const omenVolume = parseFloat(matchedMarket.scaledCollateralVolume || '0');

      const unifiedPolymarket = unifyMarketData(polyMarket, 'polymarket', orderbook);
      const unifiedOmen = unifyMarketData(matchedMarket, 'omen');

      combinedMarkets.push({
        id: `combined-${polyMarket.id}-${matchedMarket.id}`,
        title: polyMarket.question || matchedMarket.title || 'Combined Market',
        category: matchedMarket.category || 'general',
        combinedVolume: polyVolume + omenVolume,
        matchConfidence: bestMatch?.confidence || 0,
        polymarketMarket: {
          id: unifiedPolymarket.id,
          title: unifiedPolymarket.title,
          originalTitle: unifiedPolymarket.originalTitle,
          volume: unifiedPolymarket.volume,
          tradesQuantity: unifiedPolymarket.tradesQuantity,
          buysQuantity: unifiedPolymarket.buysQuantity,
          sellsQuantity: unifiedPolymarket.sellsQuantity,
          scaledCollateralBuyVolume: unifiedPolymarket.scaledCollateralBuyVolume,
          scaledCollateralSellVolume: unifiedPolymarket.scaledCollateralSellVolume,
          rawData: unifiedPolymarket.rawData
        },
        omenMarket: {
          id: unifiedOmen.id,
          title: unifiedOmen.title,
          originalTitle: unifiedOmen.originalTitle,
          volume: unifiedOmen.volume,
          category: unifiedOmen.category,
          tradesQuantity: unifiedOmen.tradesQuantity,
          buysQuantity: unifiedOmen.buysQuantity,
          sellsQuantity: unifiedOmen.sellsQuantity,
          scaledCollateralBuyVolume: unifiedOmen.scaledCollateralBuyVolume,
          scaledCollateralSellVolume: unifiedOmen.scaledCollateralSellVolume,
          rawData: unifiedOmen.rawData
        },
        createdAt: new Date().toISOString(),
        outcomes: matchedMarket.outcomes || ['Yes', 'No']
      });
    }
  });

  return combinedMarkets;
}

// AI-based semantic matching using OpenAI embeddings
async function createCombinedMarketsAI(
  polymarketMarkets: any[],
  omenMarkets: any[],
  orderbooks: any[],
  threshold: number = 0.75
): Promise<CombinedMarket[]> {
  console.log(`🤖 Starting AI-based semantic matching with threshold ${threshold}...`);
  
  // Import embeddings utilities
  const { getEmbeddings, calculateSimilarityMatrix } = await import('../_lib/embeddings');
  
  if (polymarketMarkets.length === 0 || omenMarkets.length === 0) {
    console.log('⚠️ No markets to match - one or both arrays are empty');
    return [];
  }

  // Prepare texts for embedding
  const polyTexts = polymarketMarkets.map(market => {
    const question = market.question || '';
    // Clean and normalize text for better embedding
    return question.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  });

  const omenTexts = omenMarkets.map(market => {
    const title = market.title || '';
    // Clean and normalize text for better embedding
    return title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  });

  console.log(`📝 Preparing to embed ${polyTexts.length} Polymarket and ${omenTexts.length} Omen market texts...`);

  try {
    // Get embeddings for both sets
    const [polyEmbeddings, omenEmbeddings] = await Promise.all([
      getEmbeddings(polyTexts),
      getEmbeddings(omenTexts)
    ]);

    console.log(`✅ Got embeddings: ${polyEmbeddings.length} Polymarket, ${omenEmbeddings.length} Omen`);

    // Calculate similarity matrix
    const similarityMatrix = calculateSimilarityMatrix(polyEmbeddings, omenEmbeddings);
    console.log(`🧮 Calculated ${similarityMatrix.length}x${similarityMatrix[0]?.length || 0} similarity matrix`);

    // Greedy matching: find best one-to-one matches above threshold
    const combinedMarkets: CombinedMarket[] = [];
    const usedOmenIndices = new Set<number>();

    for (let polyIndex = 0; polyIndex < polymarketMarkets.length; polyIndex++) {
      let bestMatch: { omenIndex: number; similarity: number } | null = null;

      // Find best available Omen market for this Polymarket
      for (let omenIndex = 0; omenIndex < omenMarkets.length; omenIndex++) {
        if (usedOmenIndices.has(omenIndex)) continue;

        const similarity = similarityMatrix[polyIndex][omenIndex];
        
        if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { omenIndex, similarity };
        }
      }

      // If we found a good match, create combined market
      if (bestMatch) {
        const polyMarket = polymarketMarkets[polyIndex];
        const omenMarket = omenMarkets[bestMatch.omenIndex];
        usedOmenIndices.add(bestMatch.omenIndex);

        console.log(`🔗 AI Match found (${(bestMatch.similarity * 100).toFixed(1)}%):
          Polymarket: "${polyTexts[polyIndex].substring(0, 60)}..."
          Omen: "${omenTexts[bestMatch.omenIndex].substring(0, 60)}..."`);

        // Use existing orderbook data (distribute across matches)
        const orderbook = orderbooks[polyIndex % orderbooks.length];
        const polyVolume = orderbook ? parseFloat(orderbook.scaledCollateralVolume) : 0;
        const omenVolume = parseFloat(omenMarket.scaledCollateralVolume || '0');

        const unifiedPolymarket = unifyMarketData(polyMarket, 'polymarket', orderbook);
        const unifiedOmen = unifyMarketData(omenMarket, 'omen');

        combinedMarkets.push({
          id: `ai-combined-${polyMarket.id}-${omenMarket.id}`,
          title: polyMarket.question || omenMarket.title || 'AI Combined Market',
          category: omenMarket.category || 'general',
          combinedVolume: polyVolume + omenVolume,
          matchConfidence: bestMatch.similarity, // Use AI similarity as confidence
          polymarketMarket: {
            id: unifiedPolymarket.id,
            title: unifiedPolymarket.title,
            originalTitle: unifiedPolymarket.originalTitle,
            volume: unifiedPolymarket.volume,
            tradesQuantity: unifiedPolymarket.tradesQuantity,
            buysQuantity: unifiedPolymarket.buysQuantity,
            sellsQuantity: unifiedPolymarket.sellsQuantity,
            scaledCollateralBuyVolume: unifiedPolymarket.scaledCollateralBuyVolume,
            scaledCollateralSellVolume: unifiedPolymarket.scaledCollateralSellVolume,
            rawData: unifiedPolymarket.rawData
          },
          omenMarket: {
            id: unifiedOmen.id,
            title: unifiedOmen.title,
            originalTitle: unifiedOmen.originalTitle,
            volume: unifiedOmen.volume,
            category: unifiedOmen.category,
            tradesQuantity: unifiedOmen.tradesQuantity,
            buysQuantity: unifiedOmen.buysQuantity,
            sellsQuantity: unifiedOmen.sellsQuantity,
            scaledCollateralBuyVolume: unifiedOmen.scaledCollateralBuyVolume,
            scaledCollateralSellVolume: unifiedOmen.scaledCollateralSellVolume,
            rawData: unifiedOmen.rawData
          },
          createdAt: new Date().toISOString(),
          outcomes: omenMarket.outcomes || ['Yes', 'No']
        });
      }
    }

    console.log(`🎯 AI matching complete: ${combinedMarkets.length} combined markets created`);
    console.log(`📊 Average confidence: ${combinedMarkets.length > 0 ? 
      (combinedMarkets.reduce((sum, m) => sum + m.matchConfidence, 0) / combinedMarkets.length * 100).toFixed(1) : 0}%`);

    return combinedMarkets;

  } catch (error) {
    console.error('❌ Error in AI-based matching:', error);
    console.log('🔄 Falling back to keyword-based matching...');
    
    // Fallback to original matching if AI fails
    return createCombinedMarkets(polymarketMarkets, omenMarkets, orderbooks);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting subgraph data fetch and save process...');

    // Step 1: Define GraphQL endpoints and queries
    const polymarketEndpoint = 'https://gateway.thegraph.com/api/subgraphs/id/22CoTbEtpv6fURB6moTNfJPWNUPXtiFGRA8h1zajMha3';
    const omenEndpoint = 'https://gateway.thegraph.com/api/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz';

    // Get API key from environment
    const apiKey = process.env.GRAPH_API_KEY;
    if (!apiKey) {
      throw new Error('GRAPH_API_KEY is required in environment variables');
    }

    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const matchMode = searchParams.get('matchMode') || 'simple'; // 'simple' | 'ai'
    const threshold = parseFloat(searchParams.get('threshold') || '0.75');
    const dryRun = searchParams.get('dryRun') === '1';
    const outFile = searchParams.get('outFile') || null;
    
    // Safety switches
    const freezeMarketData = process.env.FREEZE_MARKET_DATA === 'true';
    
    console.log(`🎛️ Parameters: limit=${limit}, matchMode=${matchMode}, threshold=${threshold}, dryRun=${dryRun}, outFile=${outFile}`);
    console.log(`🔒 FREEZE_MARKET_DATA=${freezeMarketData}`);

    console.log(`📊 Fetching ${limit} markets from each platform...`);

    // Step 2: Define GraphQL queries for both platforms
    const polymarketQuery = `
      query GetPolymarketMarkets($first: Int!) {
        markets(first: $first, orderBy: questionID, orderDirection: desc) {
          id
          questionID
          creator
          question
        }
      }
    `;

    // Step 2b: Define Polymarket Orderbook query
    const orderbookQuery = `
      {
        orderbooks(first: ${limit}, orderBy: scaledCollateralVolume, orderDirection: desc) {
          id
          tradesQuantity
          buysQuantity
          sellsQuantity
          scaledCollateralVolume
          scaledCollateralBuyVolume
          scaledCollateralSellVolume
        }
      }
    `;

    const omenQuery = `
      query GetOmenMarkets($first: Int!) {
        fixedProductMarketMakers(first: $first, orderBy: scaledCollateralVolume, orderDirection: desc) {
          id
          creator
          creationTimestamp
          title
          outcomes
          category
          scaledCollateralVolume
          usdVolume
          liquidityMeasure
          scaledLiquidityMeasure
          usdLiquidityMeasure
          outcomeSlotCount
        }
      }
    `;

    // Step 3: Fetch data from all three sources simultaneously
    console.log('🔄 Sending requests to all subgraphs...');

    const [polymarketResponse, orderbookResponse, omenResponse] = await Promise.all([
      // Polymarket Names request
      fetch(polymarketEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: polymarketQuery,
          variables: { first: limit }
        })
      }),
      // Polymarket Orderbook request
      fetch('https://api.studio.thegraph.com/query/117667/polybets-orderbook/version/latest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: orderbookQuery })
      }),
      // Omen request
      fetch(omenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: omenQuery,
          variables: { first: limit }
        })
      })
    ]);

    // Step 4: Parse responses and handle errors
    const polymarketData: SubgraphResponse = await polymarketResponse.json();
    const orderbookData: any = await orderbookResponse.json();
    const omenData: SubgraphResponse = await omenResponse.json();

    console.log('📥 Responses received, processing data...');
    console.log('📊 Fetched data:', {
      polymarketMarkets: polymarketData.data?.markets?.length || 0,
      polymarketOrderbooks: orderbookData.data?.orderbooks?.length || 0,
      omenMarkets: omenData.data?.fixedProductMarketMakers?.length || 0
    });

    // Check for GraphQL errors
    if (polymarketData.errors) {
      console.error('Polymarket GraphQL errors:', polymarketData.errors);
    }
    if (omenData.errors) {
      console.error('Omen GraphQL errors:', omenData.errors);
    }

    // Step 5: Normalize Polymarket data with unified structure
    const orderbooks = orderbookData.data?.orderbooks || [];
    const normalizedPolymarkets: NormalizedMarket[] = (polymarketData.data?.markets || []).map((market: any, index: number) => {
      // Match with orderbook data (distribute orderbooks across markets)
      const orderbook = orderbooks[index % orderbooks.length];
      return unifyMarketData(market, 'polymarket', orderbook);
    });

    // Step 6: Normalize Omen data with unified structure
    const normalizedOmens: NormalizedMarket[] = (omenData.data?.fixedProductMarketMakers || []).map((market: any) => {
      return unifyMarketData(market, 'omen');
    });

    console.log(`✅ Normalized ${normalizedPolymarkets.length} Polymarket and ${normalizedOmens.length} Omen markets`);

    // Step 7: Merge the two arrays into a single list
    const allIndividualMarkets: NormalizedMarket[] = [
      ...normalizedPolymarkets,
      ...normalizedOmens
    ];

    // Step 7b: Create combined markets using selected matching method
    let combinedMarkets: CombinedMarket[];
    
    if (matchMode === 'ai') {
      console.log(`🤖 Using AI-based semantic matching with threshold ${threshold}...`);
      combinedMarkets = await createCombinedMarketsAI(
        polymarketData.data?.markets || [],
        omenData.data?.fixedProductMarketMakers || [],
        orderbooks,
        threshold
      );
    } else {
      console.log(`🔤 Using keyword-based semantic matching...`);
      combinedMarkets = createCombinedMarkets(
        polymarketData.data?.markets || [],
        omenData.data?.fixedProductMarketMakers || [],
        orderbooks
      );
    }

    console.log(`🔗 Created ${combinedMarkets.length} combined markets using ${matchMode} matching`);

    // Step 8: Create the final data structure with enhanced metadata
    const savedData: SavedMarketData = {
      timestamp: new Date().toISOString(),
      totalMarkets: allIndividualMarkets.length,
      polymarketCount: normalizedPolymarkets.length,
      omenCount: normalizedOmens.length,
      individualMarkets: allIndividualMarkets, // Individual markets from each platform
      combinedMarkets: combinedMarkets, // Semantically matched combined markets
      metadata: {
        polymarketEndpoint,
        omenEndpoint,
        orderbookEndpoint: 'https://api.studio.thegraph.com/query/117667/polybets-orderbook/version/latest',
        combinedPolymarketData: true, // Indicates we combined Names + Orderbook
        fetchedAt: new Date().toISOString(),
        orderbooksCount: orderbooks.length,
        hasCombinedMarkets: true // New flag indicating combined markets are available
      }
    };

    // Step 9: Save data with safety switches
    let filePath: string | null = null;
    let fileUrl: string | null = null;
    
    if (dryRun) {
      console.log(`🧪 DRY RUN: Skipping file write, returning data only`);
    } else {
      // Determine output file
      let fileName = 'market-data.json';
      
      if (outFile) {
        fileName = outFile;
      } else if (freezeMarketData && !outFile) {
        console.log(`🔒 FREEZE_MARKET_DATA is true and no outFile specified - skipping write to protect original file`);
        fileName = null;
      }
      
      if (fileName) {
        const publicDir = path.join(process.cwd(), 'public');
        filePath = path.join(publicDir, fileName);
        fileUrl = `/${fileName}`;

        // Ensure public directory exists
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        // Determine what data to write based on filename
        let dataToWrite;
        if (fileName.includes('rematched') || fileName.includes('combined')) {
          // If filename suggests combined markets only, write just the combinedMarkets array
          dataToWrite = combinedMarkets;
          console.log(`📝 Writing only combined markets data (${combinedMarkets.length} markets)`);
        } else {
          // Otherwise write the full data structure
          dataToWrite = savedData;
          console.log(`📝 Writing full data structure`);
        }

        // Write the JSON file
        fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2), 'utf8');

        console.log(`💾 Data saved to ${filePath}`);
        console.log(`🌐 File accessible at ${fileUrl}`);
      }
    }

    // Step 10: Return success response
    return NextResponse.json({
      success: true,
      message: `Market data successfully fetched using ${matchMode} matching${dryRun ? ' (dry run - no file written)' : ''}`,
      data: {
        totalIndividualMarkets: savedData.totalMarkets,
        combinedMarketsCount: savedData.combinedMarkets.length,
        polymarketCount: savedData.polymarketCount,
        omenCount: savedData.omenCount,
        orderbooksCount: orderbooks.length,
        combinedPolymarketData: true,
        hasCombinedMarkets: true,
        timestamp: savedData.timestamp,
        fileUrl: fileUrl,
        // New AI matching info
        matchMode: matchMode,
        threshold: matchMode === 'ai' ? threshold : undefined,
        averageConfidence: combinedMarkets.length > 0 ? 
          combinedMarkets.reduce((sum, m) => sum + m.matchConfidence, 0) / combinedMarkets.length : 0,
        dryRun: dryRun,
        freezeMarketData: freezeMarketData,
        filePath: filePath
      },
      // Include the actual data in dry run mode for inspection
      ...(dryRun && { savedData })
    });

  } catch (error) {
    console.error('❌ Error in save-subgraph-data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch and save market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST method for manual triggering with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const limit = body.limit || 20;
    
    // Redirect to GET with limit parameter
    const url = new URL(request.url);
    url.searchParams.set('limit', limit.toString());
    
    return GET(new NextRequest(url.toString()));
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export const dynamic = 'force-dynamic';
