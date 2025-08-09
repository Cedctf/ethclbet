import { notFound } from 'next/navigation';
import SimpleMarketDetailsView from '~~/components/markets/SimpleMarketDetailsView';
import { readFile } from 'fs/promises';
import path from 'path';

interface MarketPageProps {
  params: {
    id: string;
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  try {
    // Get the market ID from params (await for Next.js 15 compatibility)
    const { id } = await params;

    // Read the JSON file directly (faster than API calls)
    const filePath = path.join(process.cwd(), 'public', 'market-data.json');
    const fileContents = await readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);

    console.log('🔍 Looking for market ID:', id);

    // First, try to find in combined markets
    let market = jsonData.combinedMarkets?.find((m: any) => m.id === id);
    let marketType = 'combined';

    // If not found in combined markets, try individual markets
    if (!market) {
      market = jsonData.individualMarkets?.find((m: any) => m.id === id);
      marketType = 'individual';
    }

    // If still not found, try the old 'markets' array for backward compatibility
    if (!market) {
      market = jsonData.markets?.find((m: any) => m.id === id);
      marketType = 'individual';
    }

    if (!market) {
      console.log('❌ Market not found with ID:', id);
      console.log('📊 Available combined market IDs:', jsonData.combinedMarkets?.map((m: any) => m.id) || []);
      console.log('📊 Available individual market IDs:', jsonData.individualMarkets?.slice(0, 5).map((m: any) => m.id) || []);
      notFound();
    }

    console.log('✅ Found market:', {
      id: market.id,
      title: market.title,
      type: marketType
    });

    return (
      <SimpleMarketDetailsView
        market={market}
      />
    );
  } catch (error) {
    console.error('Error in MarketPage:', error);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MarketPageProps) {
  try {
    const { id } = await params;

    // Read the JSON file for metadata
    const filePath = path.join(process.cwd(), 'public', 'market-data.json');
    const fileContents = await readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);

    // Find market in combined or individual markets
    let market = jsonData.combinedMarkets?.find((m: any) => m.id === id);
    if (!market) {
      market = jsonData.individualMarkets?.find((m: any) => m.id === id);
    }
    if (!market) {
      market = jsonData.markets?.find((m: any) => m.id === id);
    }
    
    if (!market) {
      return {
        title: 'Market Not Found',
        description: 'The requested prediction market could not be found.'
      };
    }
    
    return {
      title: `${market.title} - Prediction Market`,
      description: `View detailed information, odds, and volume data for: ${market.title}. Compare prices across Polymarket and Omen platforms.`,
      keywords: `prediction market, betting, ${market.category}, odds, ${market.polymarketMarket ? 'polymarket' : ''} ${market.omenMarket ? 'omen' : ''}`.trim(),
    };
  } catch (error) {
    return {
      title: 'Market Details',
      description: 'Prediction market details and analysis'
    };
  }
}
