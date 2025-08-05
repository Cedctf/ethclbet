"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { usePublicClient } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// SIWE message generation
const generateSiweMessage = (address: string, domain: string, nonce: string) => {
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  return `${domain} wants you to sign in with your Ethereum account:
${address}

I accept the Terms of Service: https://service.invalid/

URI: https://${domain}/
Version: 1
Chain ID: 23295
Nonce: ${nonce}
Issued At: ${now.toISOString()}
Expiration Time: ${expirationTime.toISOString()}`;
};

// Generate random nonce
const generateNonce = () => Math.random().toString(36).substring(2, 15);

export default function SimpleBetPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const { data: deployedContractData } = useDeployedContractInfo("SimpleBet");

  // SIWE Authentication state
  const [siweToken, setSiweToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form states
  const [betAmount, setBetAmount] = useState("");
  const [betOutcome, setBetOutcome] = useState(0); // 0 = YES, 1 = NO
  const [betDescription, setBetDescription] = useState("");
  const [secretData, setSecretData] = useState("");

  // User bets state
  const [userBets, setUserBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  // Contract interactions
  const { writeContractAsync: placeBet, isMining: isPlacingBet } = useScaffoldWriteContract({
    contractName: "SimpleBet",
  });

  const { writeContractAsync: withdrawBalance, isMining: isWithdrawing } = useScaffoldWriteContract({
    contractName: "SimpleBet",
  });

  const { data: userBalance } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "userBalances",
    args: [address],
  });

  const { data: contractBalance } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "getContractBalance",
  });

  const { data: totalBets } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "getTotalBets",
  });

  // Load SIWE token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("siwe-token");
    const storedExpiry = localStorage.getItem("siwe-token-expiry");

    if (storedToken && storedExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(storedExpiry)) {
        setSiweToken(storedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired
        localStorage.removeItem("siwe-token");
        localStorage.removeItem("siwe-token-expiry");
      }
    }
  }, []);

  // SIWE Login
  const handleSiweLogin = async () => {
    if (!address) {
      notification.error("Please connect your wallet first");
      return;
    }

    try {
      const domain = "testnet.sapphire.oasis.io";
      const nonce = generateNonce();
      const message = generateSiweMessage(address, domain, nonce);

      const signature = await signMessageAsync({ message });

      // Create SIWE token (in a real app, you'd verify this on the backend)
      const siweData = {
        message,
        signature,
        address,
        timestamp: new Date().getTime(),
      };

      const token = btoa(JSON.stringify(siweData));
      const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours

      // Store in localStorage
      localStorage.setItem("siwe-token", token);
      localStorage.setItem("siwe-token-expiry", expiryTime.toString());

      setSiweToken(token);
      setIsAuthenticated(true);

      notification.success("Successfully authenticated with SIWE!");
    } catch (error) {
      console.error("SIWE login failed:", error);
      notification.error("SIWE login failed");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("siwe-token");
    localStorage.removeItem("siwe-token-expiry");
    setSiweToken("");
    setIsAuthenticated(false);
    setUserBets([]);
    notification.success("Logged out successfully");
  };

  // Place Bet
  const handlePlaceBet = async () => {
    if (!betAmount || !betDescription) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      // Convert secret data to hex string format
      const secretDataBytes = secretData
        ? (`0x${Array.from(new TextEncoder().encode(secretData))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")}` as `0x${string}`)
        : ("0x" as `0x${string}`);

      await placeBet({
        functionName: "placeBet",
        args: [betOutcome, betDescription, secretDataBytes],
        value: parseEther(betAmount),
      });

      notification.success("Bet placed successfully!");
      setBetAmount("");
      setBetDescription("");
      setSecretData("");
    } catch (error) {
      console.error("Error placing bet:", error);
      notification.error("Failed to place bet");
    }
  };

  // Get User Bets (requires SIWE authentication)
  const handleGetUserBets = async () => {
    if (!isAuthenticated || !siweToken) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    if (!publicClient || !deployedContractData) {
      notification.error("Contract not found or client not ready");
      return;
    }

    setLoadingBets(true);
    try {
      // Parse the SIWE token to get the signature and message
      const siweData = JSON.parse(atob(siweToken));
      const { message, signature } = siweData;

      // Convert the SIWE message and signature to a token format that the contract expects
      // The contract expects a bytes token that contains the SIWE message and signature
      const tokenData = JSON.stringify({ message, signature });
      const tokenBytes = `0x${Array.from(new TextEncoder().encode(tokenData))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")}` as `0x${string}`;

      // Call the contract's getUserBets function with SIWE authentication
      // Parameters: token, offset, count
      const result = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "getUserBets",
        args: [tokenBytes, 0n, 50n], // Get first 50 bets
      });

      // The result should be an array of user bets
      if (result && Array.isArray(result)) {
        const formattedBets = result.map((bet: any, index: number) => ({
          id: index,
          amount: bet.amount,
          outcome: bet.outcome,
          status: bet.status,
          description: bet.description,
          createdAt: bet.timestamp ? Number(bet.timestamp) : 0,
          secretData: bet.secretData,
        }));

        setUserBets(formattedBets);
        notification.success(`Loaded ${formattedBets.length} bets`);
      } else {
        setUserBets([]);
        notification.info("No bets found for this user");
      }
    } catch (error) {
      console.error("Error getting user bets:", error);
      notification.error("Failed to get user bets. Make sure you're authenticated and have placed bets.");
    } finally {
      setLoadingBets(false);
    }
  };

  // Withdraw Balance
  const handleWithdraw = async () => {
    if (!userBalance || userBalance === 0n) {
      notification.error("No balance to withdraw");
      return;
    }

    try {
      await withdrawBalance({
        functionName: "withdrawBalance",
      });

      notification.success("Withdrawal successful!");
    } catch (error) {
      console.error("Error withdrawing:", error);
      notification.error("Failed to withdraw");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">SimpleBet Test Page</h1>
          <p>Please connect your wallet to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">SimpleBet Test Interface</h1>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Your Balance</h3>
          <p className="text-lg">{userBalance ? formatEther(userBalance) : "0"} ETH</p>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Contract Balance</h3>
          <p className="text-lg">{contractBalance ? formatEther(contractBalance) : "0"} ETH</p>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Total Bets</h3>
          <p className="text-lg">{totalBets?.toString() || "0"}</p>
        </div>
      </div>

      {/* SIWE Authentication */}
      <div className="bg-base-100 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">SIWE Authentication</h2>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-green-600">✓ Authenticated</span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="text-red-600">✗ Not authenticated</span>
              <button onClick={handleSiweLogin} className="btn btn-primary btn-sm">
                Sign-In with Ethereum
              </button>
            </>
          )}
        </div>
        {isAuthenticated && (
          <div className="mt-2 text-xs text-gray-500">Token stored in localStorage (expires in 24h)</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Place Bet */}
        <div className="bg-base-100 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Place Bet</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Bet Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                className="input input-bordered w-full"
                placeholder="0.1"
              />
            </div>

            <div>
              <label className="label">Outcome</label>
              <select
                value={betOutcome}
                onChange={e => setBetOutcome(parseInt(e.target.value))}
                className="select select-bordered w-full"
              >
                <option value={0}>YES</option>
                <option value={1}>NO</option>
              </select>
            </div>

            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={betDescription}
                onChange={e => setBetDescription(e.target.value)}
                className="input input-bordered w-full"
                placeholder="What are you betting on?"
              />
            </div>

            <div>
              <label className="label">Secret Data (optional)</label>
              <textarea
                value={secretData}
                onChange={e => setSecretData(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="Private information about your bet"
              />
            </div>

            <button onClick={handlePlaceBet} disabled={isPlacingBet} className="btn btn-primary w-full">
              {isPlacingBet ? "Placing Bet..." : "Place Bet"}
            </button>
          </div>
        </div>

        {/* User Actions */}
        <div className="space-y-6">
          {/* Get User Bets */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Bets</h2>
            <button
              onClick={handleGetUserBets}
              disabled={loadingBets || !isAuthenticated}
              className="btn btn-secondary w-full mb-4"
            >
              {loadingBets ? "Loading..." : "Get My Bets"}
            </button>

            {!isAuthenticated && (
              <p className="text-sm text-gray-500 mb-4">Please authenticate with SIWE to view your bets</p>
            )}

            {userBets.length > 0 && (
              <div className="space-y-2">
                {userBets.map((bet, index) => (
                  <div key={index} className="border p-3 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{bet.description}</span>
                      <span>{formatEther(bet.amount)} ETH</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Outcome: {bet.outcome === 0 ? "YES" : "NO"} | Status:{" "}
                      {["Active", "Won", "Lost", "Cancelled"][bet.status]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdraw Balance */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Withdraw Balance</h2>
            <p className="mb-4">Available: {userBalance ? formatEther(userBalance) : "0"} ETH</p>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !userBalance || userBalance === 0n}
              className="btn btn-accent w-full"
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw Balance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
