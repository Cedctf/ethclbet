# AI-Enhanced Semantic Matching - Testing Guide

## 🎯 What's Been Added

✅ **OpenAI Embeddings Integration**: Uses `text-embedding-3-small` for semantic understanding
✅ **Embedding Cache**: Local `.cache/embeddings.json` to avoid re-paying for identical texts
✅ **Safety Switches**: Multiple protection layers for your original `market-data.json`
✅ **Flexible Parameters**: Tunable threshold, dry run mode, alternate output files
✅ **Fallback System**: Falls back to keyword matching if AI fails

## 🔧 Environment Setup

1. **Add OpenAI API Key** (in `packages/nextjs/.env.local`):
```
OPENAI_API_KEY=your_openai_api_key_here
```

2. **Optional Safety Lock** (in `packages/nextjs/.env.local`):
```
FREEZE_MARKET_DATA=true
```

## 🧪 Testing Commands

### 1. Safe Testing (No File Changes)
```bash
# Test AI matching without writing any files
curl "http://localhost:3000/api/save-subgraph-data?matchMode=ai&dryRun=1&limit=10&threshold=0.75"
```

### 2. Write to Alternate File
```bash
# Save AI results to a different file
curl "http://localhost:3000/api/save-subgraph-data?matchMode=ai&outFile=market-data.ai.json&limit=10&threshold=0.75"
```

### 3. Compare Results
```bash
# Original keyword matching (default)
curl "http://localhost:3000/api/save-subgraph-data?matchMode=simple&outFile=market-data.simple.json&limit=10"

# AI matching
curl "http://localhost:3000/api/save-subgraph-data?matchMode=ai&outFile=market-data.ai.json&limit=10&threshold=0.75"
```

### 4. Tune Threshold
```bash
# Stricter matching (fewer, higher quality matches)
curl "http://localhost:3000/api/save-subgraph-data?matchMode=ai&dryRun=1&threshold=0.85"

# More permissive matching (more matches, potentially lower quality)
curl "http://localhost:3000/api/save-subgraph-data?matchMode=ai&dryRun=1&threshold=0.65"
```

## 📊 Expected Output

### AI Matching Response:
```json
{
  "success": true,
  "message": "Market data successfully fetched using ai matching (dry run - no file written)",
  "data": {
    "totalIndividualMarkets": 20,
    "combinedMarketsCount": 8,
    "matchMode": "ai",
    "threshold": 0.75,
    "averageConfidence": 0.823,
    "dryRun": true,
    "freezeMarketData": false
  },
  "savedData": { /* Full data structure for inspection */ }
}
```

### Console Logs:
```
🤖 Starting AI-based semantic matching with threshold 0.75...
📝 Preparing to embed 10 Polymarket and 10 Omen market texts...
🤖 Fetching 20 embeddings from OpenAI...
✅ Embedded: "Will Bitcoin reach $100,000 by end of 2024?..." (1536 dimensions)
✅ Got embeddings: 10 Polymarket, 10 Omen
🧮 Calculated 10x10 similarity matrix
🔗 AI Match found (87.3%):
  Polymarket: "Will Bitcoin reach $100,000 by end of 2024?..."
  Omen: "Bitcoin price prediction for 2024..."
🎯 AI matching complete: 8 combined markets created
📊 Average confidence: 82.3%
```

## 🔍 Key Differences from Keyword Matching

### Keyword Matching:
- Looks for exact word matches (`bitcoin`, `trump`, `sports`)
- Fixed confidence scores (0.3-0.6)
- Limited to predefined terms
- Fast but inflexible

### AI Matching:
- Understands semantic meaning and context
- Dynamic confidence scores (0.0-1.0) based on actual similarity
- Works with any topic or domain
- Slower but much more accurate

## 🛡️ Safety Features

1. **Original File Protection**: Your `public/market-data.json` is never touched unless explicitly requested
2. **Dry Run Mode**: Test without writing any files
3. **Environment Lock**: `FREEZE_MARKET_DATA=true` prevents accidental overwrites
4. **Fallback System**: Falls back to keyword matching if AI fails
5. **Alternate Output**: Write results to different files for comparison

## 🎛️ Parameter Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `matchMode` | `simple` | `simple` for keyword, `ai` for embeddings |
| `threshold` | `0.75` | Minimum similarity for AI matching (0.0-1.0) |
| `dryRun` | `false` | Set to `1` to skip file writing |
| `outFile` | `market-data.json` | Alternate output filename |
| `limit` | `10` | Number of markets to fetch from each platform |

## 💰 Cost Estimation

- **text-embedding-3-small**: ~$0.00002 per 1K tokens
- **Typical market title**: ~10-50 tokens
- **50 markets**: ~$0.001-0.005 per run
- **With caching**: Subsequent runs with same data cost $0

## 🚀 Next Steps

1. Test with `dryRun=1` to see AI matching results
2. Compare AI vs keyword matching quality
3. Tune threshold for your use case
4. Deploy with appropriate environment variables
5. Consider integrating AI matching into your frontend UI