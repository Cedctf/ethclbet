"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import { formatEther, parseEther } from "viem";
import { useAccount, useSignMessage, useChainId } from "wagmi";
import { usePublicClient } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getSapphireProvider, getSapphireEthersSigner, isSapphireNetwork } from "~~/utils/scaffold-eth/sapphireProviders";

// Generate random nonce
const generateNonce = () => Math.random().toString(36).substring(2, 15);

export default function SimpleBetPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { data: deployedContractData } = useDeployedContractInfo("SimpleBet");

  // SIWE Authentication state
  const [siweToken, setSiweToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if we're on a Sapphire network for encrypted transactions
  const isOnSapphire = chainId ? isSapphireNetwork(chainId) : false;

  // Auto-prompt for SIWE authentication when user connects
  useEffect(() => {
    const promptSiweAuth = async () => {
      if (isConnected && address && !isAuthenticated && !siweToken) {
        // Small delay to ensure wallet connection is fully established
        setTimeout(() => {
          notification.info("Please sign the message to authenticate with SIWE for contract interactions", {
            duration: 5000,
          });
          handleSiweAuth();
        }, 1000);
      }
    };

    promptSiweAuth();
  }, [isConnected, address, isAuthenticated, siweToken]);

  // SIWE Authentication function
  const handleSiweAuth = async () => {
    if (!address) {
      notification.error("Please connect your wallet first");
      return;
    }

    try {
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = "Sign in to SimpleBet with Ethereum";

      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${Math.random().toString(36).substring(7)}\nIssued At: ${new Date().toISOString()}`;

      if (window.ethereum) {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });

        const token = ethers.hexlify(ethers.toUtf8Bytes(signature));
        setSiweToken(token);
        setIsAuthenticated(true);
        notification.success("Successfully authenticated with SIWE!");
      }
    } catch (error) {
      console.error("SIWE authentication failed:", error);
      notification.error("Authentication failed. Please try again.");
    }
  };

  // Sapphire-specific contract interaction functions
  const placeBetWithSapphire = async (description: string, outcome: number, platforms: string[], amounts: bigint[], marketIds: string[], totalValue: bigint) => {
    if (!deployedContractData) throw new Error("Contract not deployed");
    
    // Use getSapphireProvider for encrypted transactions
    const sapphireProvider = getSapphireProvider();
    if (!sapphireProvider) throw new Error("Failed to get Sapphire provider");
    
    const signer = await getSapphireEthersSigner();
    if (!signer) throw new Error("Failed to get Sapphire signer");
    
    const contract = new ethers.Contract(deployedContractData.address, deployedContractData.abi, signer);
    const tx = await contract.placeBet(description, outcome, platforms, amounts, marketIds, { value: totalValue });
    return await tx.wait();
  };

  const withdrawWithSapphire = async () => {
    if (!deployedContractData) throw new Error("Contract not deployed");
    
    // Use getSapphireProvider for encrypted transactions
    const sapphireProvider = getSapphireProvider();
    if (!sapphireProvider) throw new Error("Failed to get Sapphire provider");
    
    const signer = await getSapphireEthersSigner();
    if (!signer) throw new Error("Failed to get Sapphire signer");
    
    const contract = new ethers.Contract(deployedContractData.address, deployedContractData.abi, signer);
    const tx = await contract.withdrawBalance();
    return await tx.wait();
  };

  const resolveBetWithSapphire = async (betId: bigint, won: boolean, token: string) => {
    if (!deployedContractData) throw new Error("Contract not deployed");
    
    // Use getSapphireProvider for encrypted transactions
    const sapphireProvider = getSapphireProvider();
    if (!sapphireProvider) throw new Error("Failed to get Sapphire provider");
    
    const signer = await getSapphireEthersSigner();
    if (!signer) throw new Error("Failed to get Sapphire signer");
    
    const contract = new ethers.Contract(deployedContractData.address, deployedContractData.abi, signer);
    const tx = await contract.resolveBet(betId, won, token);
    return await tx.wait();
  };

  const transferContractBalanceWithSapphire = async (to: string, amount: bigint, token: string) => {
    if (!deployedContractData) throw new Error("Contract not deployed");
    
    // Use getSapphireProvider for encrypted transactions
    const sapphireProvider = getSapphireProvider();
    if (!sapphireProvider) throw new Error("Failed to get Sapphire provider");
    
    const signer = await getSapphireEthersSigner();
    if (!signer) throw new Error("Failed to get Sapphire signer");
    
    const contract = new ethers.Contract(deployedContractData.address, deployedContractData.abi, signer);
    const tx = await contract.transferContractBalance(to, amount, token);
    return await tx.wait();
  };

  // Form states
  const [betDescription, setBetDescription] = useState("");
  const [betOutcome, setBetOutcome] = useState(0); // Single outcome for all subbets
  const [subBets, setSubBets] = useState([{ platform: "", amount: "", marketId: "" }]);

  // User bets state
  const [userBets, setUserBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  // Single bet lookup
  const [betIndex, setBetIndex] = useState("");
  const [singleBet, setSingleBet] = useState<any>(null);
  const [loadingSingleBet, setLoadingSingleBet] = useState(false);

  // Bet resolution (owner only)
  const [resolveBetId, setResolveBetId] = useState("");
  const [betWon, setBetWon] = useState(true);
  const [loadingResolve, setLoadingResolve] = useState(false);

  // Cancel bet (owner only)
  const [cancelBetId, setCancelBetId] = useState("");
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Transfer contract balance (owner only)
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  // SubBet details
  const [subBetDetailsId, setSubBetDetailsId] = useState("");
  const [subBetDetails, setSubBetDetails] = useState<any[]>([]);
  const [loadingSubBetDetails, setLoadingSubBetDetails] = useState(false);

  // Contract interactions
  const { writeContractAsync: placeBet, isMining: isPlacingBet } = useScaffoldWriteContract({
    contractName: "SimpleBet",
  });

  const { writeContractAsync: withdrawBalance, isMining: isWithdrawing } = useScaffoldWriteContract({
    contractName: "SimpleBet",
  });

  const { writeContractAsync } = useScaffoldWriteContract({
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

  // Get domain from contract
  const { data: contractDomain } = useScaffoldReadContract({
    contractName: "SimpleBet",
    functionName: "domain",
  });

  // Check if token is valid (similar to docs pattern)
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

  // SIWE Login
  const handleSiweLogin = async () => {
    if (!address || !deployedContractData || !publicClient || !contractDomain) {
      notification.error("Please connect your wallet and ensure contract is deployed");
      return;
    }

    try {
      // Get chain ID from the public client
      const chainId = await publicClient.getChainId();

      // Create SIWE message using the siwe library - matching Sapphire docs exactly
      const siweMessage = new SiweMessage({
        domain: contractDomain,
        address: address,
        uri: `http://${contractDomain}`, // Use http:// as shown in docs
        version: "1",
        chainId: chainId,
        nonce: generateNonce(),
        // Remove issuedAt and expirationTime as they're not in the docs example
        statement: "I accept the Terms of Service: https://service.invalid/", // Add statement as shown in docs
      });

      const message = siweMessage.toMessage();
      const signature = await signMessageAsync({ message });

      // Parse signature using ethers.Signature.from as shown in Sapphire docs
      const sig = ethers.Signature.from(signature);

      // Convert to SignatureRSV format expected by the contract
      const signatureRSV = {
        r: sig.r,
        s: sig.s,
        v: BigInt(sig.v),
      };

      // Call the contract's login method to get the proper SIWE token
      const loginResult = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "login",
        args: [message, signatureRSV], // Pass signatureRSV as expected by contract
      });

      // The login method returns a bytes token that we can use for authenticated calls
      const token = loginResult as string;
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

  // SubBet management functions
  const addSubBet = () => {
    setSubBets([...subBets, { platform: "", amount: "", marketId: "" }]);
  };

  const removeSubBet = (index: number) => {
    if (subBets.length > 1) {
      setSubBets(subBets.filter((_, i) => i !== index));
    }
  };

  const updateSubBet = (index: number, field: string, value: string | number) => {
    const updated = [...subBets];
    updated[index] = { ...updated[index], [field]: value };
    setSubBets(updated);
  };

  const getTotalAmount = () => {
    return subBets.reduce((total, subBet) => {
      const amount = parseFloat(subBet.amount) || 0;
      return total + amount;
    }, 0);
  };

  // Place Bet with SubBets
  const handlePlaceBet = async () => {
    if (!betDescription) {
      notification.error("Please enter a bet description");
      return;
    }

    // Validate subbets
    const validSubBets = subBets.filter(sb => sb.platform && sb.amount && sb.marketId);
    if (validSubBets.length === 0) {
      notification.error("Please add at least one valid subbet");
      return;
    }

    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      notification.error("Total bet amount must be greater than 0");
      return;
    }

    try {
      const platforms = validSubBets.map(sb => sb.platform);
      const amounts = validSubBets.map(sb => parseEther(sb.amount.toString()));
      const marketIds = validSubBets.map(sb => sb.marketId);
      const totalValue = parseEther(totalAmount.toString());

      let txHash: string;

      if (isOnSapphire) {
        // Use Sapphire encrypted transactions
        notification.info("🔒 Processing encrypted transaction on Sapphire...", { duration: 0 });
        const receipt = await placeBetWithSapphire(betDescription, betOutcome, platforms, amounts, marketIds, totalValue);
        txHash = receipt.hash || receipt.transactionHash;
        
        notification.success(
          <div>
            <div>🔒 Encrypted bet placed successfully!</div>
            <div className="mt-2">
              <a 
                href={`https://explorer.sapphire.oasis.io/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      setBetDescription("");
      setBetOutcome(0);
      setSubBets([{ platform: "", amount: "", marketId: "" }]);
    } catch (error) {
      console.error("Error placing bet:", error);
      notification.error("Failed to place bet");
    }
  };

  // Get User Bets (requires SIWE authentication)
  const handleGetUserBets = async () => {
    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    if (!publicClient || !deployedContractData) {
      notification.error("Contract not found or client not ready");
      return;
    }

    setLoadingBets(true);
    try {
      // Use the token directly from the login method
      // The token is already in the correct format for Sapphire's SiweAuth
      const tokenBytes = siweToken as `0x${string}`;

      // Call the contract's getUserBets function with SIWE authentication
      // Parameters: token, offset, count
      const result = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "getUserBets",
        args: [tokenBytes, 0n, 50n], // Get first 50 user bets
      });

      // The result should be an array of user's bets
      if (result && Array.isArray(result)) {
        const formattedBets = result.map((bet: any) => ({
          id: bet.id,
          amount: bet.totalAmount || bet.amount, // Use totalAmount from new contract structure
          status: bet.status,
          description: bet.description,
          createdAt: bet.createdAt ? Number(bet.createdAt) : 0,
          bettor: bet.user,
          totalPayout: bet.totalPayout || 0,
        }));

        setUserBets(formattedBets);
        notification.success(`Loaded ${formattedBets.length} of your bets`);
      } else {
        setUserBets([]);
        notification.info("No bets found for your account");
      }
    } catch (error) {
      console.error("Error getting all bets:", error);
      notification.error("Failed to get bets. Make sure you're authenticated.");
    } finally {
      setLoadingBets(false);
    }
  };

  // Get Single Bet (requires SIWE authentication)
  const handleGetSingleBet = async () => {
    if (!betIndex || isNaN(parseInt(betIndex))) {
      notification.error("Please enter a valid bet index");
      return;
    }

    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    if (!publicClient || !deployedContractData) {
      notification.error("Contract not found or client not ready");
      return;
    }

    setLoadingSingleBet(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;
      const index = BigInt(parseInt(betIndex));

      // Call the contract's getBet function with SIWE authentication
      const result = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "getBet",
        args: [tokenBytes, index],
      });

      if (result) {
        const bet = result as any;
        const formattedBet = {
          id: bet.id,
          amount: bet.totalAmount,
          outcome: bet.outcome,
          status: bet.status,
          description: bet.description,
          createdAt: bet.createdAt ? Number(bet.createdAt) : 0,
          bettor: bet.user,
          totalPayout: bet.totalPayout,
          subBetCount: bet.subBets ? bet.subBets.length : 0,
        };

        setSingleBet(formattedBet);
        notification.success("Bet loaded successfully!");
      } else {
        setSingleBet(null);
        notification.error("Bet not found");
      }
    } catch (error) {
      console.error("Error getting single bet:", error);
      notification.error("Failed to get bet. Make sure the index is valid and you're authenticated.");
      setSingleBet(null);
    } finally {
      setLoadingSingleBet(false);
    }
  };

  // Resolve Bet (owner only)
  const handleResolveBet = async () => {
    if (!resolveBetId || isNaN(parseInt(resolveBetId))) {
      notification.error("Please enter a valid bet ID");
      return;
    }

    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    setLoadingResolve(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;
      const betId = BigInt(parseInt(resolveBetId));
      let txHash: string;

      if (isOnSapphire) {
        // Use Sapphire encrypted transactions
        notification.info("🔒 Processing encrypted bet resolution on Sapphire...", { duration: 0 });
        const receipt = await resolveBetWithSapphire(betId, betWon, tokenBytes as string);
        txHash = receipt.hash || receipt.transactionHash;
        
        notification.success(
          <div>
            <div>🔒 Bet {resolveBetId} resolved as {betWon ? "Won" : "Lost"} with encryption!</div>
            <div className="mt-2">
              <a 
                href={`https://explorer.sapphire.oasis.io/1tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      setResolveBetId("");
    } catch (error) {
      console.error("Error resolving bet:", error);
      notification.error("Failed to resolve bet. Make sure you're the owner and the bet exists.");
    } finally {
      setLoadingResolve(false);
    }
  };

  // Get SubBet Details
  const handleGetSubBetDetails = async () => {
    if (!subBetDetailsId || isNaN(parseInt(subBetDetailsId))) {
      notification.error("Please enter a valid bet ID");
      return;
    }

    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    if (!publicClient || !deployedContractData) {
      notification.error("Contract not found or client not ready");
      return;
    }

    setLoadingSubBetDetails(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;
      const betId = BigInt(parseInt(subBetDetailsId));

      // Call the contract's getSubBets function
      const result = await publicClient.readContract({
        address: deployedContractData.address,
        abi: deployedContractData.abi,
        functionName: "getSubBets",
        args: [tokenBytes, betId],
      });

      if (result && Array.isArray(result)) {
        const formattedSubBets = result.map((subBet: any, index: number) => ({
          index,
          platform: subBet.platform,
          amount: subBet.amount,
          marketId: subBet.marketId,
          outcome: subBet.outcome,
          status: subBet.status,
          payout: subBet.payout,
        }));

        setSubBetDetails(formattedSubBets);
        notification.success(`Loaded ${formattedSubBets.length} subbets for bet ${subBetDetailsId}`);
      } else {
        setSubBetDetails([]);
        notification.info("No subbets found for this bet");
      }
    } catch (error) {
      console.error("Error getting subbet details:", error);
      notification.error("Failed to get subbet details. Make sure the bet ID is valid and you're authenticated.");
      setSubBetDetails([]);
    } finally {
      setLoadingSubBetDetails(false);
    }
  };

  // Cancel Bet (owner only)
  const handleCancelBet = async () => {
    if (!cancelBetId || isNaN(parseInt(cancelBetId))) {
      notification.error("Please enter a valid bet ID");
      return;
    }

    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    setLoadingCancel(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;
      const betId = BigInt(parseInt(cancelBetId));

      // Call the contract's cancelBet function
      notification.info("Processing bet cancellation...", { duration: 0 });
      const result = await writeContractAsync({
        functionName: "cancelBet",
        args: [betId, tokenBytes],
      });

      notification.success(
        <div>
          <div>Bet {cancelBetId} cancelled successfully!</div>
          <div className="mt-2">
            <a 
              href={`https://explorer.sapphire.oasis.io/tx/${result}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              View Transaction →
            </a>
          </div>
        </div>,
        { duration: 8000 }
      );
      setCancelBetId("");
    } catch (error) {
      console.error("Error cancelling bet:", error);
      notification.error("Failed to cancel bet. Make sure you're the owner and the bet exists.");
    } finally {
      setLoadingCancel(false);
    }
  };

  // Transfer Contract Balance (owner only)
  const handleTransferContractBalance = async () => {
    if (!transferAddress || !ethers.isAddress(transferAddress)) {
      notification.error("Please enter a valid Ethereum address");
      return;
    }

    if (!transferAmount || isNaN(parseFloat(transferAmount)) || parseFloat(transferAmount) <= 0) {
      notification.error("Please enter a valid transfer amount");
      return;
    }

    if (!isTokenValid()) {
      notification.error("Please authenticate with SIWE first");
      return;
    }

    // Check if transfer amount exceeds contract balance
    const transferAmountWei = parseEther(transferAmount);
    if (contractBalance && transferAmountWei > contractBalance) {
      notification.error("Transfer amount exceeds contract balance");
      return;
    }

    setLoadingTransfer(true);
    try {
      const tokenBytes = siweToken as `0x${string}`;
      let txHash: string;

      if (isOnSapphire) {
        // Use Sapphire encrypted transactions
        notification.info("🔒 Processing encrypted transfer on Sapphire...", { duration: 0 });
        const receipt = await transferContractBalanceWithSapphire(transferAddress, transferAmountWei, tokenBytes as string);
        txHash = receipt.hash || receipt.transactionHash;
        
        notification.success(
          <div>
            <div>🔒 Transfer of {transferAmount} TEST to {transferAddress} successful!</div>
            <div className="mt-2">
              <a 
                href={`https://explorer.sapphire.oasis.io/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      } else {
        // Fallback for non-Sapphire networks
        const result = await writeContractAsync({
          functionName: "transferContractBalance",
          args: [transferAddress as `0x${string}`, transferAmountWei, tokenBytes],
        });

        notification.success(
          <div>
            <div>Transfer of {transferAmount} TEST to {transferAddress} successful!</div>
            <div className="mt-2">
              <a 
                href={`https://etherscan.io/tx/${result}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      }

      setTransferAddress("");
      setTransferAmount("");
    } catch (error) {
      console.error("Error transferring contract balance:", error);
      notification.error("Failed to transfer contract balance. Make sure you're the owner and have sufficient balance.");
    } finally {
      setLoadingTransfer(false);
    }
  };

  // Withdraw Balance
  const handleWithdraw = async () => {
    if (!userBalance || userBalance === 0n) {
      notification.error("No balance to withdraw");
      return;
    }

    try {
      let txHash: string;

      if (isOnSapphire) {
        // Use Sapphire encrypted transactions
        notification.info("🔒 Processing encrypted withdrawal on Sapphire...", { duration: 0 });
        const receipt = await withdrawWithSapphire();
        txHash = receipt.hash || receipt.transactionHash;
        
        notification.success(
          <div>
            <div>🔒 Encrypted withdrawal successful!</div>
            <div className="mt-2">
              <a 
                href={`https://explorer.sapphire.oasis.io/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                View Transaction →
              </a>
            </div>
          </div>,
          { duration: 8000 }
        );
      }
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
    <div className="container mx-auto px-4 py-8 mt-20">
      <h1 className="text-3xl font-bold mb-8 text-center">SimpleBet Test Interface</h1>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Your Balance</h3>
          <p className="text-lg">{userBalance ? formatEther(userBalance) : "0"} TEST</p>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Contract Balance</h3>
          <p className="text-lg">{contractBalance ? formatEther(contractBalance) : "0"} TEST</p>
        </div>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Total Bets</h3>
          <p className="text-lg">{totalBets?.toString() || "0"}</p>
        </div>
      </div>

      {/* Encryption Status */}
      <div className="mb-8">
        <div className={`p-4 rounded-lg border-2 ${
          isOnSapphire 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {isOnSapphire ? (
              <>
                <span className="text-2xl">🔒</span>
                <div className="text-center">
                  <div className="font-semibold">Encrypted Transactions Enabled</div>
                  <div className="text-sm">Connected to Sapphire Network - All transactions are encrypted</div>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">⚠️</span>
                <div className="text-center">
                  <div className="font-semibold">Unencrypted Network</div>
                  <div className="text-sm">Switch to Sapphire Testnet for encrypted transactions</div>
                </div>
              </>
            )}
          </div>
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
        {/* Place Aggregated Bet */}
        <div className="bg-base-100 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Place Aggregated Bet</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Description (Private)</label>
              <input
                type="text"
                value={betDescription}
                onChange={e => setBetDescription(e.target.value)}
                className="input input-bordered w-full"
                placeholder="What are you betting on? (This will be private)"
              />
              <div className="label">
                <span className="label-text-alt text-info">
                  ℹ️ Description is private and requires SIWE authentication to view
                </span>
              </div>
            </div>

            <div>
              <label className="label">Overall Outcome</label>
              <select
                value={betOutcome}
                onChange={e => setBetOutcome(parseInt(e.target.value))}
                className="select select-bordered w-full"
              >
                <option value={0}>YES</option>
                <option value={1}>NO</option>
              </select>
              <div className="label">
                <span className="label-text-alt text-info">ℹ️ All subbets will use this same outcome</span>
              </div>
            </div>

            {/* SubBets */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label">SubBets (Platforms)</label>
                <button onClick={addSubBet} className="btn btn-sm btn-outline">
                  + Add Platform
                </button>
              </div>

              {subBets.map((subBet, index) => (
                <div key={index} className="border p-4 rounded-lg mb-3 bg-base-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Platform {index + 1}</span>
                    {subBets.length > 1 && (
                      <button onClick={() => removeSubBet(index)} className="btn btn-xs btn-error">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="label label-text-sm">Platform</label>
                      <input
                        type="text"
                        value={subBet.platform}
                        onChange={e => updateSubBet(index, "platform", e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="e.g., Polymarket"
                      />
                    </div>

                    <div>
                      <label className="label label-text-sm">Amount (TEST)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={subBet.amount}
                        onChange={e => updateSubBet(index, "amount", e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="0.1"
                      />
                    </div>

                    <div>
                      <label className="label label-text-sm">Market ID</label>
                      <input
                        type="text"
                        value={subBet.marketId}
                        onChange={e => updateSubBet(index, "marketId", e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="market123"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-right">
                <span className="text-lg font-semibold">Total: {getTotalAmount().toFixed(4)} TEST</span>
              </div>
            </div>

            <button onClick={handlePlaceBet} disabled={isPlacingBet} className="btn btn-primary w-full">
              {isPlacingBet ? "Placing Aggregated Bet..." : "Place Aggregated Bet"}
            </button>
          </div>
        </div>

        {/* User Actions */}
        <div className="space-y-6">
          {/* Get User Bets */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Bets (Private)</h2>
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
                      <span>{formatEther(bet.amount)} TEST</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Status: {["Active", "Won", "Lost", "Cancelled"][bet.status]}
                      {bet.totalPayout > 0 && <span> | Payout: {formatEther(bet.totalPayout)} TEST</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      Bettor: {bet.bettor} | ID: {bet.id?.toString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Get Single Bet */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Get Single Bet</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Bet Index</label>
                <input
                  type="number"
                  value={betIndex}
                  onChange={e => setBetIndex(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter bet index (0, 1, 2, ...)"
                />
              </div>
              <button
                onClick={handleGetSingleBet}
                disabled={loadingSingleBet || !isAuthenticated}
                className="btn btn-info w-full"
              >
                {loadingSingleBet ? "Loading..." : "Get Bet"}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-500">Please authenticate with SIWE to view bet details</p>
              )}

              {singleBet && (
                <div className="border p-4 rounded bg-base-200">
                  <h3 className="font-semibold mb-2">Bet Details</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>ID:</strong> {singleBet.id?.toString()}
                    </div>
                    <div>
                      <strong>Description:</strong> {singleBet.description}
                    </div>
                    <div>
                      <strong>Amount:</strong> {formatEther(singleBet.amount)} TEST
                    </div>
                    <div>
                      <strong>Outcome:</strong> {singleBet.outcome === 0 ? "YES" : "NO"}
                    </div>
                    <div>
                      <strong>Status:</strong> {["Active", "Won", "Lost", "Cancelled"][singleBet.status]}
                    </div>
                    <div>
                      <strong>Bettor:</strong> {singleBet.bettor}
                    </div>
                    <div>
                      <strong>SubBets:</strong> {singleBet.subBetCount}
                    </div>
                    {singleBet.totalPayout > 0 && (
                      <div>
                        <strong>Total Payout:</strong> {formatEther(singleBet.totalPayout)} TEST
                      </div>
                    )}
                    {singleBet.createdAt > 0 && (
                      <div>
                        <strong>Created:</strong> {new Date(singleBet.createdAt * 1000).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Owner Functions */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Owner Functions</h2>

            {/* Resolve Bet */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">Resolve Bet</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Bet ID</label>
                  <input
                    type="number"
                    value={resolveBetId}
                    onChange={e => setResolveBetId(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Enter bet ID"
                  />
                </div>
                <div>
                  <label className="label">Outcome</label>
                  <select
                    value={betWon ? "won" : "lost"}
                    onChange={e => setBetWon(e.target.value === "won")}
                    className="select select-bordered w-full"
                  >
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleResolveBet}
                    disabled={loadingResolve || !isAuthenticated}
                    className="btn btn-success w-full"
                  >
                    {loadingResolve ? "Resolving..." : "Resolve Bet"}
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">ℹ️ Resolves all subbets with 2x multiplier for wins</div>
            </div>

            {/* Cancel Bet */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">Cancel Bet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Bet ID</label>
                  <input
                    type="number"
                    value={cancelBetId}
                    onChange={e => setCancelBetId(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Enter bet ID to cancel"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCancelBet}
                    disabled={loadingCancel || !isAuthenticated}
                    className="btn btn-warning w-full"
                  >
                    {loadingCancel ? "Cancelling..." : "Cancel Bet"}
                  </button>
                </div>
              </div>
            </div>

            {/* Transfer Contract Balance */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Transfer Contract Balance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Recipient Address</label>
                  <input
                    type="text"
                    value={transferAddress}
                    onChange={e => setTransferAddress(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="label">Amount (TEST)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="0.1"
                  />
                  <div className="label">
                    <span className="label-text-alt text-info">
                      Available: {contractBalance ? formatEther(contractBalance) : "0"} TEST
                    </span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleTransferContractBalance}
                    disabled={loadingTransfer || !isAuthenticated || !contractBalance || contractBalance === 0n}
                    className="btn btn-primary w-full"
                  >
                    {loadingTransfer ? "Transferring..." : "Transfer"}
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                ℹ️ Transfer contract funds to any address. Only the contract owner can perform this action.
              </div>
            </div>

            {!isAuthenticated && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Please authenticate with SIWE to use owner functions</p>
              </div>
            )}
          </div>

          {/* SubBet Details */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">SubBet Details</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Bet ID</label>
                <input
                  type="number"
                  value={subBetDetailsId}
                  onChange={e => setSubBetDetailsId(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter bet ID to view subbets"
                />
              </div>
              <button
                onClick={handleGetSubBetDetails}
                disabled={loadingSubBetDetails || !isAuthenticated}
                className="btn btn-info w-full"
              >
                {loadingSubBetDetails ? "Loading..." : "Get SubBet Details"}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-500">Please authenticate with SIWE to view subbet details</p>
              )}

              {subBetDetails.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">SubBets for Bet #{subBetDetailsId}</h3>
                  {subBetDetails.map((subBet, index) => (
                    <div key={index} className="border p-3 rounded bg-base-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <strong>Index:</strong> {subBet.index}
                        </div>
                        <div>
                          <strong>Platform:</strong> {subBet.platform}
                        </div>
                        <div>
                          <strong>Market ID:</strong> {subBet.marketId}
                        </div>
                        <div>
                          <strong>Amount:</strong> {formatEther(subBet.amount)} TEST
                        </div>
                        <div>
                          <strong>Outcome:</strong> {subBet.outcome === 0 ? "YES" : "NO"}
                        </div>
                        <div>
                          <strong>Status:</strong> {["Active", "Won", "Lost", "Cancelled"][subBet.status]}
                        </div>
                        {subBet.payout > 0 && (
                          <div className="col-span-2 md:col-span-3">
                            <strong>Payout:</strong> {formatEther(subBet.payout)} TEST
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Withdraw Balance */}
          <div className="bg-base-100 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Withdraw Balance</h2>
            <p className="mb-4">Available: {userBalance ? formatEther(userBalance) : "0"} TEST</p>
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
