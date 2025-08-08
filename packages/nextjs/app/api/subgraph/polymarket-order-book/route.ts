import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get limit from query parameters
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "10";

  const query = `
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

  try {
    const response = await fetch("https://api.studio.thegraph.com/query/117667/polybets-orderbook/version/latest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.dir(data, { depth: null });
    return NextResponse.json({
      success: true,
      data: { orderbooks: data.data.orderbooks },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
