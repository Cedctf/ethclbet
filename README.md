# Ethclbet

---

## 🚧 Problems

- **Fragmented Liquidity** – Liquidity and pricing are spread across multiple prediction market platforms, making it difficult to compare and find the best opportunities.  
- **Privacy and Trust Concerns** – Public smart contracts expose betting strategies and allocations, reducing user privacy and potentially giving competitors an advantage.  
- **Complex Calculations** – Optimally allocating a budget across platforms with different market models (order books, AMMs, LMSRs) requires advanced calculations beyond most users’ capabilities.

---

## 💡 Inspiration

Our team actively participates in prediction markets, and we kept running into three recurring frustrations:

1. **Market hunters** waste time hopping between platforms to find the best liquidity and odds.  
2. **Privacy-conscious bettors** hesitate to reveal their strategies on public ledgers.  
3. **Casual users** struggle with the math needed to spread bets optimally across different market types.  

> “What if you could see every market in one place, privately calculate the best split, and place all your bets in a single, secure transaction?”

That question sparked our project: the invisible layer connecting all major prediction markets while keeping users’ strategies private.

---

## 🔑 The Solution

- **Unified Market Aggregation** – Aggregate events details such as title, prices, liquidity, and market depth from multiple prediction market platforms into a single interface through subgraphs.  
- **Private & Secure Betting** – Use Oasis Sapphire smart contracts and SIWE authentication to keep bet allocations and strategies private, viewable only by the user.  
- **Intelligent Optimization** – Leverage an LLM hosted on Oasis ROFL to match equivalent prediction markets and calculate the optimal allocation of funds across platforms to maximize returns.  
- **Automated Execution & Settlement** – Place bets, track market resolutions, and update user balances automatically through secure smart contract workflows.

---

## 🔄 User Flow

1. **Browse Events**  
   - User opens the app and sees a unified list of prediction markets aggregated from platforms like Polymarket and Omen.  
   - Each market shows liquidity, prices, order book depth, and AMM/LMSR stats in one view.

2. **Event Matching & Selection**  
   - Our LLM automatically groups equivalent events across platforms.  
   - User selects the prediction market they want to bet on (e.g., “Will Candidate X win the election?”).

3. **Bet Optimization**  
   - User seletecs a total budget in USD.  
   - LLM (hosted on Oasis ROFL) calculates the optimal split across platforms to maximize shares bought for the same or lower cost.  
   - Pyth Network price feeds convert USD to the required crypto amounts.  
   - User can adjust allocations if desired.

4. **Private Bet Placement**  
   - Bet is stored and executed through an Oasis Sapphire smart contract.  
   - Users can sign in with Ethereum (SIWE) for private access.  
   - Strategy and allocations remain fully confidential.

5. **Execution on External Platforms**  
   - Oasis ROFL securely executes bets on the external prediction markets according to the optimized plan.  

6. **Resolution & Settlement**  
   - Event listeners track market resolutions.  
   - Winning outcomes update the user’s private balance in the Sapphire contract.  

7. **Withdrawal**  
   - User can withdraw winnings at any time to their connected wallet.  

 ---

