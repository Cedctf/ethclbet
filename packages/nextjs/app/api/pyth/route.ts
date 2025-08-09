import { NextResponse } from 'next/server';

// ETH/USD price feed ID
const ETH_USD_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

export async function POST(request: Request) {
  try {
    const { usdAmount } = await request.json();
    if (!usdAmount || isNaN(Number(usdAmount)) || Number(usdAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid USD amount' }, { status: 400 });
    }

    const response = await fetch(`https://hermes.pyth.network/api/latest_price_feeds?ids[]=${ETH_USD_FEED_ID}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
    }
    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No price data found' }, { status: 500 });
    }
    const priceInfo = data[0].price;
    const ethUsdPrice = Number(priceInfo.price) * 10 ** Number(priceInfo.expo);
    if (!ethUsdPrice || ethUsdPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price data' }, { status: 500 });
    }
    const ethEquivalent = Number(usdAmount) / ethUsdPrice;
    return NextResponse.json({
      usdAmount: Number(usdAmount),
      ethUsdPrice,
      ethEquivalent
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}