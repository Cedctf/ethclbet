import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface OptimalSplitOutput {
  timestamp: string;
  userId: string;
  budget: number;
  polymarketStats?: {
    id: string;
    tradesQuantity: string;
    buysQuantity: string;
    sellsQuantity: string;
    scaledCollateralVolume: string;
    scaledCollateralBuyVolume: string;
    scaledCollateralSellVolume: string;
  };
  omenStats?: {
    id: string;
    tradesQuantity: string;
    buysQuantity: string;
    sellsQuantity: string;
    scaledCollateralVolume: string;
    scaledCollateralBuyVolume: string;
    scaledCollateralSellVolume: string;
  };
  optimalSplit: {
    orderBookAllocation: number;
    lmsrAllocation: number;
    orderBookShares: number;
    lmsrShares: number;
    totalShares: number;
    totalCost: number;
    strategy: string;
    efficiency: {
      costPerShare: number;
      allocationRatio: {
        orderBookPercent: number;
        lmsrPercent: number;
      };
    };
    platformData: {
      orderBook: {
        orderLevels: number;
        totalLiquidity: number;
        priceRange: {
          min: number;
          max: number;
        };
      };
      lmsr: {
        yesShares: number;
        noShares: number;
        liquidityParameter: number;
      };
    };
  };
  priceData?: {
    polymarketEth: number;
    omenEth: number;
    totalEth: number;
    ethUsdPrice: number;
    usingFallback?: boolean;
  };
  betOutcome?: number; // 0 = YES, 1 = NO
  betDescription?: string;
  marketInfo?: {
    title?: string;
    question?: string;
    source?: string;
    category?: string;
  };
  aiTrainingData: {
    inputFeatures: {
      budget: number;
      polymarketVolume: number;
      polymarketTradeRatio: number;
      polymarketBuySellRatio: number;
      omenVolume: number;
      omenTradeRatio: number;
      omenBuySellRatio: number;
      marketCategory?: string;
    };
    outputTargets: {
      orderBookAllocation: number;
      lmsrAllocation: number;
      orderBookPercent: number;
      lmsrPercent: number;
      strategy: string;
      costPerShare: number;
    };
    performanceMetrics?: {
      totalShares: number;
      totalCost: number;
      efficiency: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      budget,
      polymarketStats,
      omenStats,
      optimalSplit,
      priceData,
      betOutcome,
      betDescription,
      marketInfo
    } = body;

    // Validate required fields
    if (!userId || !budget || !optimalSplit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, budget, or optimalSplit' },
        { status: 400 }
      );
    }

    // Create the output data structure
    const outputData: OptimalSplitOutput = {
      timestamp: new Date().toISOString(),
      userId,
      budget,
      polymarketStats,
      omenStats,
      optimalSplit,
      priceData,
      betOutcome,
      betDescription,
      marketInfo,
      aiTrainingData: {
        inputFeatures: {
          budget,
          polymarketVolume: polymarketStats ? parseFloat(polymarketStats.scaledCollateralVolume) : 0,
          polymarketTradeRatio: polymarketStats ? 
            parseFloat(polymarketStats.tradesQuantity) / Math.max(parseFloat(polymarketStats.scaledCollateralVolume), 1) : 0,
          polymarketBuySellRatio: polymarketStats ? 
            parseFloat(polymarketStats.buysQuantity) / Math.max(parseFloat(polymarketStats.sellsQuantity), 1) : 0,
          omenVolume: omenStats ? parseFloat(omenStats.scaledCollateralVolume) : 0,
          omenTradeRatio: omenStats ? 
            parseFloat(omenStats.tradesQuantity) / Math.max(parseFloat(omenStats.scaledCollateralVolume), 1) : 0,
          omenBuySellRatio: omenStats ? 
            parseFloat(omenStats.buysQuantity) / Math.max(parseFloat(omenStats.sellsQuantity), 1) : 0,
          marketCategory: marketInfo?.category
        },
        outputTargets: {
          orderBookAllocation: optimalSplit.orderBookAllocation,
          lmsrAllocation: optimalSplit.lmsrAllocation,
          orderBookPercent: optimalSplit.efficiency.allocationRatio.orderBookPercent,
          lmsrPercent: optimalSplit.efficiency.allocationRatio.lmsrPercent,
          strategy: optimalSplit.strategy,
          costPerShare: optimalSplit.efficiency.costPerShare
        },
        performanceMetrics: {
          totalShares: optimalSplit.totalShares,
          totalCost: optimalSplit.totalCost,
          efficiency: optimalSplit.efficiency.costPerShare
        }
      }
    };

    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Read existing history or create new
    const historyPath = path.join(dataDir, 'history.json');
    let history: OptimalSplitOutput[] = [];
    
    try {
      if (existsSync(historyPath)) {
        const existingData = await readFile(historyPath, 'utf-8');
        history = JSON.parse(existingData);
      }
    } catch (error) {
      console.warn('Could not read existing history, starting fresh:', error);
    }

    // Add new output to history
    history.push(outputData);

    // Limit history to last 1000 entries to prevent file from growing too large
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    // Write updated history back to file
    await writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Optimal split output saved successfully',
      entryId: outputData.timestamp,
      totalEntries: history.length,
      aiTrainingData: outputData.aiTrainingData
    });

  } catch (error) {
    console.error('Error saving optimal split output:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save optimal split output',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const historyPath = path.join(dataDir, 'history.json');
    
    if (!existsSync(historyPath)) {
      return NextResponse.json({
        success: true,
        message: 'No history data found',
        totalEntries: 0,
        history: []
      });
    }

    const historyData = await readFile(historyPath, 'utf-8');
    const history = JSON.parse(historyData);

    return NextResponse.json({
      success: true,
      message: 'History data retrieved successfully',
      totalEntries: history.length,
      history: history.slice(-100) // Return last 100 entries
    });

  } catch (error) {
    console.error('Error reading history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read history data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 