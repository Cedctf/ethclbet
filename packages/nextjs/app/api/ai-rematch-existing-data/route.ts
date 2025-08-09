import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Types (reusing from the original route)
interface CombinedMarket {
  id: string;
  title: string;
  category: string;
  combinedVolume: number;
  matchConfidence: number;
  polymarketMarket?: {
    id: string;
    title: string;
    originalTitle: string;
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
    title: string;
    originalTitle: string;
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

// Simple keyword-based matching using existing data
function createCombinedMarketsSimple(
  polymarketMarkets: any[],
  omenMarkets: any[]
): CombinedMarket[] {
  console.log(`🔤 Starting simple keyword-based matching on existing data...`);
  
  const combinedMarkets: CombinedMarket[] = [];
  const usedOmenMarkets = new Set<string>();

  polymarketMarkets.forEach((polyMarket: any) => {
    const polyText = (polyMarket.title || '').toLowerCase();
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

      combinedMarkets.push({
        id: `combined-${polyMarket.id}-${matchedMarket.id}`,
        title: polyMarket.title || matchedMarket.title || 'Combined Market',
        category: matchedMarket.category || 'general',
        combinedVolume: (polyMarket.volume || 0) + (matchedMarket.volume || 0),
        matchConfidence: bestMatch.confidence,
        polymarketMarket: {
          id: polyMarket.id,
          title: polyMarket.title,
          originalTitle: polyMarket.originalTitle,
          volume: polyMarket.volume || 0,
          tradesQuantity: polyMarket.tradesQuantity || '0',
          buysQuantity: polyMarket.buysQuantity || '0',
          sellsQuantity: polyMarket.sellsQuantity || '0',
          scaledCollateralBuyVolume: polyMarket.scaledCollateralBuyVolume || '0',
          scaledCollateralSellVolume: polyMarket.scaledCollateralSellVolume || '0',
          rawData: polyMarket.rawData || polyMarket
        },
        omenMarket: {
          id: matchedMarket.id,
          title: matchedMarket.title,
          originalTitle: matchedMarket.originalTitle,
          volume: matchedMarket.volume || 0,
          category: matchedMarket.category || 'general',
          tradesQuantity: matchedMarket.tradesQuantity || '0',
          buysQuantity: matchedMarket.buysQuantity || '0',
          sellsQuantity: matchedMarket.sellsQuantity || '0',
          scaledCollateralBuyVolume: matchedMarket.scaledCollateralBuyVolume || '0',
          scaledCollateralSellVolume: matchedMarket.scaledCollateralSellVolume || '0',
          rawData: matchedMarket.rawData || matchedMarket
        },
        createdAt: new Date().toISOString(),
        outcomes: matchedMarket.outcomes || ['Yes', 'No']
      });
    }
  });

  console.log(`🎯 Simple matching complete: ${combinedMarkets.length} combined markets created from existing data`);
  return combinedMarkets;
}

// AI-based semantic matching using existing data
async function createCombinedMarketsAI(
  polymarketMarkets: any[],
  omenMarkets: any[],
  threshold: number = 0.75
): Promise<CombinedMarket[]> {
  console.log(`🤖 Starting AI-based semantic matching on existing data with threshold ${threshold}...`);
  
  // Import embeddings utilities
  const { getEmbeddings, calculateSimilarityMatrix } = await import('../_lib/embeddings');
  
  if (polymarketMarkets.length === 0 || omenMarkets.length === 0) {
    console.log('⚠️ No markets to match - one or both arrays are empty');
    return [];
  }

  // Prepare texts for embedding from existing data
  const polyTexts = polymarketMarkets.map(market => {
    const title = market.title || market.originalTitle || '';
    // Clean and normalize text for better embedding
    return title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  });

  const omenTexts = omenMarkets.map(market => {
    const title = market.title || market.originalTitle || '';
    // Clean and normalize text for better embedding
    return title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  });

  console.log(`📝 Preparing to embed ${polyTexts.length} Polymarket and ${omenTexts.length} Omen market texts from existing data...`);

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

        combinedMarkets.push({
          id: `ai-rematch-${polyMarket.id}-${omenMarket.id}`,
          title: polyMarket.title || omenMarket.title || 'AI Combined Market',
          category: omenMarket.category || 'general',
          combinedVolume: (polyMarket.volume || 0) + (omenMarket.volume || 0),
          matchConfidence: bestMatch.similarity, // Use AI similarity as confidence
          polymarketMarket: {
            id: polyMarket.id,
            title: polyMarket.title,
            originalTitle: polyMarket.originalTitle,
            volume: polyMarket.volume || 0,
            tradesQuantity: polyMarket.tradesQuantity || '0',
            buysQuantity: polyMarket.buysQuantity || '0',
            sellsQuantity: polyMarket.sellsQuantity || '0',
            scaledCollateralBuyVolume: polyMarket.scaledCollateralBuyVolume || '0',
            scaledCollateralSellVolume: polyMarket.scaledCollateralSellVolume || '0',
            rawData: polyMarket.rawData || polyMarket
          },
          omenMarket: {
            id: omenMarket.id,
            title: omenMarket.title,
            originalTitle: omenMarket.originalTitle,
            volume: omenMarket.volume || 0,
            category: omenMarket.category || 'general',
            tradesQuantity: omenMarket.tradesQuantity || '0',
            buysQuantity: omenMarket.buysQuantity || '0',
            sellsQuantity: omenMarket.sellsQuantity || '0',
            scaledCollateralBuyVolume: omenMarket.scaledCollateralBuyVolume || '0',
            scaledCollateralSellVolume: omenMarket.scaledCollateralSellVolume || '0',
            rawData: omenMarket.rawData || omenMarket
          },
          createdAt: new Date().toISOString(),
          outcomes: omenMarket.outcomes || ['Yes', 'No']
        });
      }
    }

    console.log(`🎯 AI matching complete: ${combinedMarkets.length} combined markets created from existing data`);
    console.log(`📊 Average confidence: ${combinedMarkets.length > 0 ? 
      (combinedMarkets.reduce((sum, m) => sum + m.matchConfidence, 0) / combinedMarkets.length * 100).toFixed(1) : 0}%`);

    return combinedMarkets;

  } catch (error) {
    console.error('❌ Error in AI-based matching:', error);
    console.log('🔄 Falling back to simple matching...');
    return createCombinedMarketsSimple(polymarketMarkets, omenMarkets);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting AI re-matching of existing market data...');

    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const matchMode = searchParams.get('matchMode') || 'simple'; // 'simple' | 'ai'
    const threshold = parseFloat(searchParams.get('threshold') || '0.75');
    const dryRun = searchParams.get('dryRun') === '1';
    const outFile = searchParams.get('outFile') || 'market-rematched.json';
    const showDetails = searchParams.get('showDetails') === '1';
    
    console.log(`🎛️ Parameters: matchMode=${matchMode}, threshold=${threshold}, dryRun=${dryRun}, outFile=${outFile}, showDetails=${showDetails}`);

    // Step 1: Read existing market-data.json
    const marketDataPath = path.join(process.cwd(), 'public', 'market-data.json');
    
    if (!fs.existsSync(marketDataPath)) {
      throw new Error('market-data.json not found. Please run the original API first to fetch data.');
    }

    const existingData = JSON.parse(fs.readFileSync(marketDataPath, 'utf8'));
    console.log(`📖 Loaded existing data: ${existingData.totalMarkets} total markets`);

    // Step 2: Separate Polymarket and Omen markets from individual markets
    const polymarketMarkets = existingData.individualMarkets.filter((market: any) => market.source === 'polymarket');
    const omenMarkets = existingData.individualMarkets.filter((market: any) => market.source === 'omen');

    console.log(`📊 Found ${polymarketMarkets.length} Polymarket and ${omenMarkets.length} Omen markets in existing data`);

    // Step 3: Apply matching to existing data based on mode
    let combinedMarkets: CombinedMarket[];
    
    if (matchMode === 'ai') {
      console.log(`🤖 Using AI-based semantic matching with threshold ${threshold}...`);
      combinedMarkets = await createCombinedMarketsAI(
        polymarketMarkets,
        omenMarkets,
        threshold
      );
    } else {
      console.log(`🔤 Using keyword-based semantic matching...`);
      combinedMarkets = createCombinedMarketsSimple(
        polymarketMarkets,
        omenMarkets
      );
    }

    // Step 4: Create new data structure with re-matched combined markets
    const newData = {
      ...existingData,
      combinedMarkets: combinedMarkets, // Replace with re-matched markets
      metadata: {
        ...existingData.metadata,
        rematchedAt: new Date().toISOString(),
        matchingThreshold: matchMode === 'ai' ? threshold : undefined,
        originalCombinedMarketsCount: existingData.combinedMarkets?.length || 0,
        newCombinedMarketsCount: combinedMarkets.length,
        matchingMethod: matchMode === 'ai' ? 'openai-embeddings' : 'keyword-based'
      }
    };

    console.log(`🔗 Created ${combinedMarkets.length} combined markets using ${matchMode} matching`);

    // Step 5: Save or return data
    let filePath: string | null = null;
    let fileUrl: string | null = null;
    
    if (dryRun) {
      console.log(`🧪 DRY RUN: Skipping file write, returning data only`);
    } else {
      const publicDir = path.join(process.cwd(), 'public');
      filePath = path.join(publicDir, outFile);
      fileUrl = `/${outFile}`;

      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Determine what data to write based on filename
      let dataToWrite;
      if (outFile.includes('rematched') || outFile.includes('combined')) {
        // If filename suggests combined markets only, write just the combinedMarkets array
        dataToWrite = combinedMarkets;
        console.log(`📝 Writing only combined markets data (${combinedMarkets.length} markets)`);
      } else {
        // Otherwise write the full updated data structure
        dataToWrite = newData;
        console.log(`📝 Writing full updated data structure`);
      }

      // Write the JSON file
      fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2), 'utf8');

      console.log(`💾 Re-matched data saved to ${filePath}`);
      console.log(`🌐 File accessible at ${fileUrl}`);
    }

    // Step 6: Return response
    const response = {
      success: true,
      message: `Market data successfully rematched using ${matchMode} matching${dryRun ? ' (dry run - no file written)' : ''}`,
      data: {
        originalTotalMarkets: existingData.totalMarkets,
        originalCombinedMarkets: existingData.combinedMarkets?.length || 0,
        newCombinedMarkets: combinedMarkets.length,
        polymarketCount: polymarketMarkets.length,
        omenCount: omenMarkets.length,
        matchMode: matchMode,
        threshold: matchMode === 'ai' ? threshold : undefined,
        averageConfidence: combinedMarkets.length > 0 ? 
          combinedMarkets.reduce((sum, m) => sum + m.matchConfidence, 0) / combinedMarkets.length : 0,
        dryRun: dryRun,
        fileUrl: fileUrl,
        filePath: filePath,
        timestamp: new Date().toISOString()
      }
    };

    // Include detailed data in dry run or if requested
    if (dryRun || showDetails) {
      (response as any).combinedMarkets = combinedMarkets;
      (response as any).fullData = newData;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in AI re-matching:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to re-match existing market data with AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';