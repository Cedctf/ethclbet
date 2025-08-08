import { AvailableAction } from '../../types';
import { 
  findOptimalSplit, 
  generateOrderBookFromStats, 
  generateLMSRFromStats,
  type MarketStatistics 
} from '~~/optimal-split-router';

export const optimizeBettingSplit: AvailableAction = {
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
}; 