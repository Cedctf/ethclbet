import { NextResponse } from 'next/server';

// ETH/USD price feed ID
const ETH_USD_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

// Fallback ETH price in USD
const FALLBACK_ETH_USD_PRICE = 4227.66;

export async function POST(request: Request) {
  try {
    const { usdAmount } = await request.json();
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid USD amount' }, { status: 400 });
    }

    let ethUsdPrice = FALLBACK_ETH_USD_PRICE;
    let usingFallback = false;

    try {
      // Try to fetch from Pyth network
      const response = await fetch(`https://hermes.pyth.network/api/latest_price_feeds?ids[]=${ETH_USD_FEED_ID}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          const priceInfo = data[0].price;
          const pythPrice = Number(priceInfo.price) * 10 ** Number(priceInfo.expo);
          
          // Only use Pyth price if it's valid
          if (pythPrice && pythPrice > 0) {
            ethUsdPrice = pythPrice;
          } else {
            console.warn('Invalid Pyth price data, using fallback');
            usingFallback = true;
          }
        } else {
          console.warn('No Pyth price data found, using fallback');
          usingFallback = true;
        }
      } else {
        console.warn(`Pyth API request failed with status ${response.status}, using fallback`);
        usingFallback = true;
      }
    } catch (fetchError) {
      console.warn('Pyth network request failed, using fallback:', fetchError);
      usingFallback = true;
    }

    // Calculate ETH equivalent
    const ethEquivalent = Number(usdAmount) / ethUsdPrice;

    // Return successful response with price data
    return NextResponse.json({
      usdAmount: Number(usdAmount),
      ethUsdPrice,
      ethEquivalent,
      usingFallback
    });

  } catch (error) {
    console.error('API route error:', error);
    
    // Even in case of unexpected errors, try to provide fallback response
    try {
      const { usdAmount } = await request.json();
      if (usdAmount && !isNaN(Number(usdAmount)) && Number(usdAmount) > 0) {
        const ethEquivalent = Number(usdAmount) / FALLBACK_ETH_USD_PRICE;
        return NextResponse.json({
          usdAmount: Number(usdAmount),
          ethUsdPrice: FALLBACK_ETH_USD_PRICE,
          ethEquivalent,
          usingFallback: true
        });
      }
    } catch {
      // If we can't even parse the request, return error
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}