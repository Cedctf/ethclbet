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

// AI-based semantic matching using existing data
async function createCombinedMarketsFromExistingData(
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
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting AI re-matching of existing market data...');

    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get('threshold') || '0.75');
    const dryRun = searchParams.get('dryRun') === '1';
    const outFile = searchParams.get('outFile') || 'market-data.ai-rematch.json';
    const showDetails = searchParams.get('showDetails') === '1';
    
    console.log(`🎛️ Parameters: threshold=${threshold}, dryRun=${dryRun}, outFile=${outFile}, showDetails=${showDetails}`);

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

    // Step 3: Apply AI matching to existing data
    const aiCombinedMarkets = await createCombinedMarketsFromExistingData(
      polymarketMarkets,
      omenMarkets,
      threshold
    );

    // Step 4: Create new data structure with AI-matched combined markets
    const newData = {
      ...existingData,
      combinedMarkets: aiCombinedMarkets, // Replace with AI-matched markets
      metadata: {
        ...existingData.metadata,
        aiRematchedAt: new Date().toISOString(),
        aiMatchingThreshold: threshold,
        originalCombinedMarketsCount: existingData.combinedMarkets?.length || 0,
        aiCombinedMarketsCount: aiCombinedMarkets.length,
        matchingMethod: 'openai-embeddings'
      }
    };

    // Step 5: Save or return data
    let filePath: string | null = null;
    let fileUrl: string | null = null;
    
    if (dryRun) {
      console.log(`🧪 DRY RUN: Skipping file write, returning data only`);
    } else {
      const publicDir = path.join(process.cwd(), 'public');
      filePath = path.join(publicDir, outFile);
      fileUrl = `/${outFile}`;

      // Write the JSON file
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');

      console.log(`💾 AI re-matched data saved to ${filePath}`);
      console.log(`🌐 File accessible at ${fileUrl}`);
    }

    // Step 6: Return response
    const response = {
      success: true,
      message: `AI re-matching complete${dryRun ? ' (dry run - no file written)' : ''}`,
      data: {
        originalTotalMarkets: existingData.totalMarkets,
        originalCombinedMarkets: existingData.combinedMarkets?.length || 0,
        aiCombinedMarkets: aiCombinedMarkets.length,
        polymarketCount: polymarketMarkets.length,
        omenCount: omenMarkets.length,
        threshold: threshold,
        averageConfidence: aiCombinedMarkets.length > 0 ? 
          aiCombinedMarkets.reduce((sum, m) => sum + m.matchConfidence, 0) / aiCombinedMarkets.length : 0,
        dryRun: dryRun,
        fileUrl: fileUrl,
        filePath: filePath,
        timestamp: new Date().toISOString()
      }
    };

    // Include detailed data in dry run or if requested
    if (dryRun || showDetails) {
      (response as any).aiCombinedMarkets = aiCombinedMarkets;
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