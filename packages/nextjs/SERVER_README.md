# Betting Server - Complete Implementation

This server implements a complete betting workflow with the following three main functions:

## 🎯 Core Functions

### 1. **Optimal Split Router** (`/api/optimal-split`)
- Analyzes market data from Polymarket and Omen
- Calculates optimal fund allocation between Order Book and LMSR platforms
- Uses statistical data to generate realistic market conditions
- Returns detailed optimization results with efficiency metrics

### 2. **Place Aggregated Bet** (`/api/place-bet`)
- Places bets across multiple platforms based on optimal split recommendations
- Supports multiple subbets with different platforms, amounts, and market IDs
- Requires SIWE authentication for security
- Tracks all bet details and transaction information

### 3. **Withdraw Balance** (`/api/withdraw`)
- Allows users to withdraw their winnings
- SIWE authenticated for security
- Simulates encrypted transactions on Sapphire network
- Updates user balances and provides transaction receipts

## 🚀 Quick Start

### Prerequisites
```bash
cd packages/nextjs
npm install
```

### Start the Server
```bash
# Method 1: Direct execution
npm run dev:server

# Method 2: Using ts-node
npx ts-node server.ts

# Method 3: Compile and run
npx tsc server.ts && node server.js
```

### Test the Complete Workflow
```bash
# Run the test suite
node test-server.js
```

## 📊 Complete Workflow Example

The server provides a complete end-to-end workflow:

### Step 1: Optimal Split Analysis
```json
POST /api/optimal-split
{
  "budget": 1000,
  "polymarketStats": {
    "id": "market_123",
    "tradesQuantity": "274",
    "buysQuantity": "213", 
    "sellsQuantity": "61",
    "scaledCollateralVolume": "71299.132719",
    "scaledCollateralBuyVolume": "58693.611521",
    "scaledCollateralSellVolume": "12605.521198"
  },
  "omenStats": {
    "id": "market_456",
    "tradesQuantity": "156",
    "buysQuantity": "89",
    "sellsQuantity": "67", 
    "scaledCollateralVolume": "34567.891234",
    "scaledCollateralBuyVolume": "18234.567890",
    "scaledCollateralSellVolume": "16333.323344"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "orderBookAllocation": 650.00,
    "lmsrAllocation": 350.00,
    "orderBookShares": 1234.5678,
    "lmsrShares": 567.8901,
    "totalShares": 1802.4579,
    "totalCost": 995.50,
    "strategy": "Split: 65% OB, 35% LMSR",
    "efficiency": {
      "costPerShare": 0.5522,
      "allocationRatio": {
        "orderBookPercent": 65.0,
        "lmsrPercent": 35.0
      }
    },
    "platformData": {
      "orderBook": {
        "orderLevels": 8,
        "totalLiquidity": 5400,
        "priceRange": { "min": 0.42, "max": 0.58 }
      },
      "lmsr": {
        "yesShares": 1847,
        "noShares": 1653,
        "liquidityParameter": 587
      }
    }
  }
}
```

### Step 2: Place Aggregated Bet
```json
POST /api/place-bet
{
  "description": "Optimal split bet based on analysis",
  "outcome": 0,
  "subBets": [
    {
      "platform": "Polymarket",
      "amount": "0.650000",
      "marketId": "polymarket_market_123"
    },
    {
      "platform": "Omen", 
      "amount": "0.350000",
      "marketId": "omen_market_456"
    }
  ],
  "siweToken": "mock_token_12345...",
  "userAddress": "0x742d35Cc6634C0532925a3b8C17067df4a0bb11B"
}
```

**Response:**
```json
{
  "success": true,
  "betId": "1703123456789abcdef123",
  "transactionHash": "0x1234567890abcdef...",
  "totalAmount": "1.0",
  "subBetCount": 2
}
```

### Step 3: Withdraw Balance
```json
POST /api/withdraw
{
  "siweToken": "mock_token_12345...",
  "userAddress": "0x742d35Cc6634C0532925a3b8C17067df4a0bb11B"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0xabcdef1234567890...",
  "withdrawnAmount": "1.8"
}
```

## 🎮 Demo Workflow Endpoint

For testing the complete flow in one call:

```bash
curl -X POST http://localhost:3001/api/demo-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x742d35Cc6634C0532925a3b8C17067df4a0bb11B",
    "budget": 1000
  }'
```

This will:
1. ✅ Authenticate user with mock SIWE
2. 📊 Calculate optimal split for $1000 budget
3. 🎯 Place aggregated bet based on optimization
4. 💰 Simulate winnings and allow withdrawal

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/optimal-split` | POST | Calculate optimal fund allocation |
| `/api/place-bet` | POST | Place aggregated bet across platforms |
| `/api/withdraw` | POST | Withdraw user balance |
| `/api/user-bets` | POST | Get user's betting history |
| `/api/user-balance` | POST | Get user's current balance |
| `/api/mock-login` | POST | Mock SIWE authentication (testing) |
| `/api/demo-workflow` | POST | Complete workflow demonstration |

## 🔧 Configuration

Create a `.env` file in the `packages/nextjs` directory:

```bash
# Server Configuration
PORT=3001
RPC_URL=http://localhost:8545
SIMPLE_BET_CONTRACT_ADDRESS=0x...

# Optional: For real blockchain interactions
PRIVATE_KEY=0x...
```

## 🧪 Testing

The server includes comprehensive testing:

```bash
# Run all tests
node test-server.js

# Individual endpoint testing is included in the test suite
```

### Test Output Example:
```
🚀 Starting Complete Betting Workflow Test

📋 Running Demo Workflow...
✅ Demo Workflow Completed Successfully!

📊 Workflow Summary:
==================
Original Budget: $1000
Optimal Strategy: Split: 65% OB, 35% LMSR
Order Book Allocation: $650.00
LMSR Allocation: $350.00
Total Shares: 1802.4579
Bet ID: 1703123456789abcdef123
Total Bet Amount: 1.0 ETH
SubBets Count: 2
Withdrawn Amount: 1.8 ETH
Profit: 0.8 ETH
==================
```

## 🔐 Security Features

- **SIWE Authentication**: All sensitive operations require Sign-In with Ethereum
- **Token Validation**: Session tokens with expiration
- **Input Validation**: Comprehensive validation for all API inputs
- **Error Handling**: Robust error handling with detailed logging

## 🏗️ Integration with Frontend

The server is designed to work with the existing frontend components:

- **OptimalSplitRouter.tsx**: Calls `/api/optimal-split`
- **SimpleBet page.tsx**: Calls `/api/place-bet` and `/api/withdraw`
- **Market data**: Integrates with existing market data structures

## 📈 Optimization Features

- **Real Market Data**: Uses actual Polymarket statistical data
- **Multiple Strategies**: Compares pure Order Book, pure LMSR, and optimal split
- **Efficiency Metrics**: Provides cost per share and allocation ratios
- **Platform Analysis**: Detailed platform liquidity and pricing analysis

## 🚦 Production Considerations

For production deployment:

1. Replace mock authentication with real SIWE implementation
2. Connect to actual smart contracts
3. Use a proper database instead of in-memory storage
4. Add rate limiting and proper error handling
5. Implement real blockchain transaction handling
6. Add logging and monitoring

## 🛠️ Development

The server is built with:
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **ethers.js**: Ethereum interactions
- **SIWE**: Sign-In with Ethereum
- **Custom optimization algorithms**: From optimal-split-router.ts

---

**🎯 Ready to process betting operations!**

Start the server and run the test suite to see the complete workflow in action. 