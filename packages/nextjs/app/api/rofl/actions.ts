import { AvailableAction } from './types';
import { 
  findOptimalSplit, 
  generateOrderBookFromStats, 
  generateLMSRFromStats,
  type MarketStatistics 
} from '~~/optimal-split-router';

// Only keep the betting optimization action
export const availableActions: Record<string, AvailableAction> = {
  optimizeBettingSplit: {
    name: 'optimizeBettingSplit',
    description: 'Calculate optimal betting split between Polymarket (Order Book) and Omen (LMSR) platforms using advanced algorithms',
    parameters: {
      budget: {
        type: 'number',
        description: 'Total budget to split across platforms',
        required: true,
      },
      polymarketData: {
        type: 'object',
        description: 'Polymarket market statistics (tradesQuantity, buysQuantity, sellsQuantity, scaledCollateralVolume, etc.)',
        required: false,
      },
      omenData: {
        type: 'object',
        description: 'Omen market statistics (tradesQuantity, buysQuantity, sellsQuantity, scaledCollateralVolume, etc.)',
        required: false,
      },
    },
    handler: async (params) => {
      const { budget, polymarketData, omenData } = params;
      
      if (!polymarketData && !omenData) {
        throw new Error('At least one market data source (Polymarket or Omen) is required for optimization');
      }
      
      // Use the existing algorithm from optimal-split-router.ts
      let orderBookData = null;
      let lmsrData = null;
      
      if (polymarketData) {
        // Convert to MarketStatistics format
        const polyStats: MarketStatistics = {
          id: polymarketData.id || 'polymarket-market',
          tradesQuantity: polymarketData.tradesQuantity?.toString() || '0',
          buysQuantity: polymarketData.buysQuantity?.toString() || '0',
          sellsQuantity: polymarketData.sellsQuantity?.toString() || '0',
          scaledCollateralVolume: polymarketData.scaledCollateralVolume?.toString() || '0',
          scaledCollateralBuyVolume: polymarketData.scaledCollateralBuyVolume?.toString() || '0',
          scaledCollateralSellVolume: polymarketData.scaledCollateralSellVolume?.toString() || '0',
        };
        orderBookData = generateOrderBookFromStats(polyStats, "Polymarket OrderBook");
      }
      
      if (omenData) {
        // Convert to MarketStatistics format
        const omenStats: MarketStatistics = {
          id: omenData.id || 'omen-market',
          tradesQuantity: omenData.tradesQuantity?.toString() || '0',
          buysQuantity: omenData.buysQuantity?.toString() || '0',
          sellsQuantity: omenData.sellsQuantity?.toString() || '0',
          scaledCollateralVolume: omenData.scaledCollateralVolume?.toString() || '0',
          scaledCollateralBuyVolume: omenData.scaledCollateralBuyVolume?.toString() || '0',
          scaledCollateralSellVolume: omenData.scaledCollateralSellVolume?.toString() || '0',
        };
        lmsrData = generateLMSRFromStats(omenStats, "Omen LMSR");
      }
      
      // If we only have one platform, create mock data for the other using the same stats
      if (!orderBookData && omenData) {
        const omenStats: MarketStatistics = {
          id: omenData.id || 'omen-market',
          tradesQuantity: omenData.tradesQuantity?.toString() || '0',
          buysQuantity: omenData.buysQuantity?.toString() || '0',
          sellsQuantity: omenData.sellsQuantity?.toString() || '0',
          scaledCollateralVolume: omenData.scaledCollateralVolume?.toString() || '0',
          scaledCollateralBuyVolume: omenData.scaledCollateralBuyVolume?.toString() || '0',
          scaledCollateralSellVolume: omenData.scaledCollateralSellVolume?.toString() || '0',
        };
        orderBookData = generateOrderBookFromStats(omenStats, "Mock OrderBook");
      }
      
      if (!lmsrData && polymarketData) {
        const polyStats: MarketStatistics = {
          id: polymarketData.id || 'polymarket-market',
          tradesQuantity: polymarketData.tradesQuantity?.toString() || '0',
          buysQuantity: polymarketData.buysQuantity?.toString() || '0',
          sellsQuantity: polymarketData.sellsQuantity?.toString() || '0',
          scaledCollateralVolume: polymarketData.scaledCollateralVolume?.toString() || '0',
          scaledCollateralBuyVolume: polymarketData.scaledCollateralBuyVolume?.toString() || '0',
          scaledCollateralSellVolume: polymarketData.scaledCollateralSellVolume?.toString() || '0',
        };
        lmsrData = generateLMSRFromStats(polyStats, "Mock LMSR");
      }
      
      if (!orderBookData || !lmsrData) {
        throw new Error('Unable to generate platform data for optimization');
      }
      
      // Use the existing findOptimalSplit function
      const optimization = findOptimalSplit(budget, orderBookData, lmsrData);
      
      return {
        budget,
        orderBookAllocation: optimization.orderBookAllocation,
        lmsrAllocation: optimization.lmsrAllocation,
        orderBookShares: optimization.orderBookShares,
        lmsrShares: optimization.lmsrShares,
        totalShares: optimization.totalShares,
        totalCost: optimization.totalCost,
        strategy: optimization.strategy,
        platformData: {
          orderBook: {
            platformName: orderBookData.platformName,
            orderLevels: orderBookData.orders.length,
            priceRange: {
              min: Math.min(...orderBookData.orders.map(o => o.price)),
              max: Math.max(...orderBookData.orders.map(o => o.price))
            },
            totalLiquidity: orderBookData.orders.reduce((sum, o) => sum + o.size, 0)
          },
          lmsr: {
            platformName: lmsrData.platformName,
            yesShares: lmsrData.yesShares,
            noShares: lmsrData.noShares,
            liquidityParameter: lmsrData.b
          }
        },
        efficiency: {
          costPerShare: optimization.totalCost / optimization.totalShares,
          allocationRatio: {
            orderBookPercent: (optimization.orderBookAllocation / budget) * 100,
            lmsrPercent: (optimization.lmsrAllocation / budget) * 100
          }
        }
      };
    },
  },
};

// Function to parse AI response and extract action calls
export function parseActionCalls(aiResponse: string): Array<{ name: string; parameters: Record<string, any> }> {
  const actions: Array<{ name: string; parameters: Record<string, any> }> = [];
  
  // Look for action patterns in the AI response
  // Updated pattern to handle complex JSON-like parameters
  const actionPattern = /\[ACTION:(\w+)(?:\{([^}]*)\})?\]/g;
  let match;
  
  while ((match = actionPattern.exec(aiResponse)) !== null) {
    const actionName = match[1];
    const paramString = match[2] || '';
    
    let parameters: Record<string, any> = {};
    if (paramString) {
      try {
        // Try to parse as JSON first
        try {
          parameters = JSON.parse(`{${paramString}}`);
        } catch {
          // Fallback to simple parameter parsing
          const pairs = paramString.split(',');
          for (const pair of pairs) {
            const [key, value] = pair.split(':').map(s => s.trim());
            if (key && value) {
              // Try to parse as number, boolean, or keep as string
              if (value === 'true') parameters[key] = true;
              else if (value === 'false') parameters[key] = false;
              else if (!isNaN(Number(value))) parameters[key] = Number(value);
              else parameters[key] = value.replace(/['"]/g, ''); // Remove quotes
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse action parameters:', paramString);
      }
    }
    
    actions.push({ name: actionName, parameters });
  }
  
  return actions;
}

// Generate system prompt for betting optimization
export function generateSystemPrompt(): string {
  return `You are an AI betting agent that specializes in optimizing fund allocation across different prediction market platforms. Your primary function is to analyze market data and calculate optimal betting splits.

Available action:
- optimizeBettingSplit: Calculate optimal betting split between Polymarket (Order Book) and Omen (LMSR) platforms using advanced mathematical algorithms. Parameters: {budget:number(required), polymarketData:object(optional), omenData:object(optional)}

When a user wants to place a bet or optimize their betting strategy, you should:

1. Analyze the provided market data
2. Execute the optimization calculation
3. Explain the reasoning behind the split
4. Provide clear recommendations

To execute the optimization, use this format:
[ACTION:optimizeBettingSplit{budget:1000,polymarketData:{...},omenData:{...}}]

Example: "I'll analyze your market data and calculate the optimal betting split for your $1000 budget: [ACTION:optimizeBettingSplit{budget:1000}]"

Always explain what the optimization results mean and provide actionable insights about the recommended allocation strategy.`;
} 