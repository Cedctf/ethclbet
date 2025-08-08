import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log("=== Omen Markets API Route ===");

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const queryType = searchParams.get("type") || "markets";

    console.log("Query params:", { limit, queryType });

    // Check for API key
    const apiKey = process.env.GRAPH_API_KEY;
    console.log("API Key available:", !!apiKey);

    if (!apiKey) {
      throw new Error(
        "GRAPH_API_KEY is required. Please add it to your .env.local file. Get your API key from https://thegraph.com/studio/",
      );
    }

    // Query based on type
    let query;
    if (queryType === "markets") {
      query = `
        query GetMarkets($first: Int!) {
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
    } else if (queryType === "questions") {
      query = `
        query GetQuestions($first: Int!) {
          questions(first: $first, orderBy: openingTimestamp, orderDirection: desc) {
            id
            templateId
            data
            title
            outcomes
            category
            language
            arbitrator
            openingTimestamp
            timeout
            isPendingArbitration
            currentAnswer
            currentAnswerBond
            currentAnswerTimestamp
            historyHash
            answerFinalizedTimestamp
          }
        }
      `;
    } else if (queryType === "conditions") {
      query = `
        query GetConditions($first: Int!) {
          conditions(first: $first, orderBy: resolveTimestamp, orderDirection: desc) {
            id
            conditionId
            oracle
            questionId
            outcomeSlotCount
            creator
            createTimestamp
            resolveTimestamp
            resolved
            payouts
          }
        }
      `;
    } else {
      // Combined query (default)
      query = `
        query GetMarketsAndQuestions($first: Int!) {
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
          }
          questions(first: $first, orderBy: openingTimestamp, orderDirection: desc) {
            id
            title
            outcomes
            category
            language
            openingTimestamp
            timeout
            currentAnswer
          }
        }
      `;
    }

    const subgraphUrl = "https://gateway.thegraph.com/api/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz";
    console.log("Using Omen subgraph endpoint...");

    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: { first: limit },
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP Error:", errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log("Subgraph result:", JSON.stringify(result, null, 2));

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return NextResponse.json(
        {
          success: false,
          error: "GraphQL errors",
          details: result.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      queryType,
      totalResults: {
        markets: result.data.fixedProductMarketMakers?.length || 0,
        questions: result.data.questions?.length || 0,
        conditions: result.data.conditions?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in Omen Markets API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : "No additional details",
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
