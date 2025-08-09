"use client";

import { useCallback, useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { usePublicClient } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface UserBet {
  id: bigint;
  amount: bigint;
  status: number;
  description: string;
  createdAt: number;
  bettor: string;
  totalPayout: bigint;
  outcome: number;
  subBetCount: number;
}

type BetStatus = 'all' | 'active' | 'closed';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: deployedContractData } = useDeployedContractInfo("SimpleBet");

  // State
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [filteredBets, setFilteredBets] = useState<UserBet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BetStatus>('all');
  const [siweToken, setSiweToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Contract reads for summary stats
  const { data: userBalance } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "userBalances",
    args: [address],
  });

  const { data: totalBets } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "getTotalBets",
  });

  // Check if token is valid
  const isTokenValid = useCallback(() => {
    if (!siweToken) return false;
    const storedExpiry = localStorage.getItem("siwe-token-expiry");
    if (!storedExpiry) return false;
    const now = new Date().getTime();
    return now < parseInt(storedExpiry);
  }, [siweToken]);

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
        setIsAuthenticated(false);
      }
    }
  }, []);

  // Update authentication state when token changes
  useEffect(() => {
    setIsAuthenticated(isTokenValid());
  }, [siweToken, isTokenValid]);

  // Load user bets when all conditions are met
  useEffect(() => {
    const shouldLoadBets = 
      isAuthenticated && 
      address && 
      publicClient && 
      deployedContractData && 
      !hasInitialLoad;

    if (shouldLoadBets) {
      console.log('Auto-loading user bets...');
      loadUserBets();
    }
  }, [isAuthenticated, address, publicClient, deployedContractData, hasInitialLoad]);

  // Filter bets when status filter changes
  useEffect(() => {
    filterBets();
  }, [userBets, statusFilter]);

  // Load user bets function
  const loadUserBets = async () => {
    if (!isTokenValid() || !publicClient || !deployedContractData) {
      console.log('Cannot load bets - missing requirements:', {
        tokenValid: isTokenValid(),
        publicClient: !!publicClient,
        deployedContractData: !!deployedContractData
      });
      return;
    }

    setLoadingBets(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;

      console.log('Loading user bets with token:', tokenBytes.substring(0, 20) + '...');

      // Call the contract's getUserBets function with SIWE authentication
      const result = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "getUserBets",
        args: [tokenBytes, 0n, 100n], // Get first 100 user bets
      });

      console.log('Contract result:', result);

      // Format the bets
      if (result && Array.isArray(result)) {
        const formattedBets: UserBet[] = result.map((bet: any) => ({
          id: bet.id,
          amount: bet.totalAmount || bet.amount,
          status: bet.status,
          description: bet.description,
          createdAt: bet.createdAt ? Number(bet.createdAt) : 0,
          bettor: bet.user,
          totalPayout: bet.totalPayout || 0n,
          outcome: bet.outcome || 0,
          subBetCount: bet.subBets ? bet.subBets.length : 0,
        }));

        console.log('Formatted bets:', formattedBets);
        setUserBets(formattedBets);
        setHasInitialLoad(true);
        
        if (formattedBets.length > 0) {
          notification.success(`Loaded ${formattedBets.length} bets`);
        }
      } else {
        console.log('No bets found or invalid result');
        setUserBets([]);
        setHasInitialLoad(true);
      }
    } catch (error) {
      console.error("Error getting user bets:", error);
      notification.error("Failed to load bets. Please ensure you're authenticated.");
      setHasInitialLoad(true);
    } finally {
      setLoadingBets(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    setHasInitialLoad(false);
    loadUserBets();
  };

  // Filter bets based on status
  const filterBets = () => {
    let filtered = [...userBets];

    switch (statusFilter) {
      case 'active':
        filtered = userBets.filter(bet => bet.status === 0); // Status 0 = Active
        break;
      case 'closed':
        filtered = userBets.filter(bet => bet.status === 1 || bet.status === 2); // Status 1 = Won, Status 2 = Lost
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredBets(filtered);
  };

  // Get status display text
  const getStatusText = (status: number) => {
    const statusMap = ["Active", "Won", "Lost", "Cancelled"];
    return statusMap[status] || "Unknown";
  };

  // Get status color class
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "badge-info"; // Active
      case 1: return "badge-success"; // Won
      case 2: return "badge-error"; // Lost
      case 3: return "badge-warning"; // Cancelled
      default: return "badge-ghost";
    }
  };

  // Calculate summary stats
  const stats = {
    totalBets: userBets.length,
    activeBets: userBets.filter(bet => bet.status === 0).length,
    wonBets: userBets.filter(bet => bet.status === 1).length,
    lostBets: userBets.filter(bet => bet.status === 2).length,
    totalWagered: userBets.reduce((sum, bet) => sum + Number(formatEther(bet.amount)), 0),
    totalWinnings: userBets.filter(bet => bet.status === 1).reduce((sum, bet) => sum + Number(formatEther(bet.totalPayout)), 0),
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Profile</h1>
          <p>Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please authenticate with SIWE to view your betting history</p>
          <a href="/simplebet" className="btn btn-primary">
            Go to Authentication
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Betting Profile</h1>
        <p className="text-gray-600">Address: {address}</p>
      </div>

      {/* Loading indicator for initial load */}
      {!hasInitialLoad && loadingBets && (
        <div className="mb-8">
          <div className="alert alert-info">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Loading your betting history...</span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalBets}</div>
          <div className="text-sm text-gray-600">Total Bets</div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-info">{stats.activeBets}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-success">{stats.wonBets}</div>
          <div className="text-sm text-gray-600">Won</div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-error">{stats.lostBets}</div>
          <div className="text-sm text-gray-600">Lost</div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold">{stats.totalWagered.toFixed(4)}</div>
          <div className="text-sm text-gray-600">Total Wagered (ETH)</div>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-accent">{userBalance ? formatEther(userBalance) : "0"}</div>
          <div className="text-sm text-gray-600">Available Balance (ETH)</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-base-100 p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold">Betting History</h2>
          
          <div className="flex items-center gap-2">
            <label className="label">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BetStatus)}
              className="select select-bordered select-sm"
            >
              <option value="all">All Bets ({stats.totalBets})</option>
              <option value="active">Active ({stats.activeBets})</option>
              <option value="closed">Closed ({stats.wonBets + stats.lostBets})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bets List */}
      <div className="bg-base-100 rounded-lg shadow">
        {loadingBets ? (
          <div className="flex items-center justify-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">Loading your bets...</span>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500">
              {userBets.length === 0 
                ? "No bets found. Start by placing your first bet!"
                : `No ${statusFilter === 'all' ? '' : statusFilter} bets found.`
              }
            </div>
            {!hasInitialLoad && (
              <button 
                onClick={handleRefresh}
                className="btn btn-primary btn-sm mt-4"
              >
                Load Bets
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Outcome</th>
                  <th>Status</th>
                  <th>SubBets</th>
                  <th>Payout</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredBets.map((bet, index) => (
                  <tr key={index} className="hover">
                    <td className="font-mono text-sm">{bet.id.toString()}</td>
                    <td>
                      <div className="max-w-xs truncate" title={bet.description}>
                        {bet.description}
                      </div>
                    </td>
                    <td className="font-semibold">
                      {formatEther(bet.amount)} ETH
                    </td>
                    <td>
                      <span className={`badge ${bet.outcome === 0 ? 'badge-accent' : 'badge-secondary'}`}>
                        {bet.outcome === 0 ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(bet.status)}`}>
                        {getStatusText(bet.status)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ghost">{bet.subBetCount}</span>
                    </td>
                    <td className="font-semibold">
                      {bet.totalPayout > 0n ? (
                        <span className="text-success">
                          +{formatEther(bet.totalPayout)} ETH
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">
                      {bet.createdAt > 0 
                        ? new Date(bet.createdAt * 1000).toLocaleDateString()
                        : 'Unknown'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <a href="/simplebet" className="btn btn-primary">
          Place New Bet
        </a>
        <button 
          onClick={handleRefresh} 
          disabled={loadingBets}
          className="btn btn-outline"
        >
          {loadingBets ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>
    </div>
  );
}