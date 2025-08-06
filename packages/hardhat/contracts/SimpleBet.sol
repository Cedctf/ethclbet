// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";

/**
 * @title SimpleBet
 * @dev A simple betting smart contract with SiweAuth integration for Oasis Sapphire
 * Users can place bets, contract acts as escrow, and owner can manage funds
 */
contract SimpleBet is SiweAuth {
    address private _owner;
    uint256 private _nextBetId = 1;
    
    enum BetOutcome {
        YES,
        NO
    }
    
    enum BetStatus {
        Active,
        Won,
        Lost,
        Cancelled
    }
    
    struct Bet {
        uint256 id;
        address user;
        uint256 amount;
        BetOutcome outcome;
        BetStatus status;
        uint256 createdAt;
        string description;
    }
    
    // Public metadata (encrypted but accessible via getter)
    Bet[] public _betMetas;
    
    // Private secret data (truly secret)
    bytes[] private _betSecrets;
    
    mapping(address => uint256[]) private _userBets;
    mapping(address => uint256) public userBalances;
    
    event BetPlaced(
        uint256 indexed betId,
        address indexed user,
        uint256 amount,
        BetOutcome outcome,
        uint256 index
    );
    
    event BetResolved(
        uint256 indexed betId,
        BetStatus status,
        uint256 payout
    );
    
    event FundsWithdrawn(
        address indexed user,
        uint256 amount
    );
    
    modifier onlyOwner(bytes memory token) {
        if (msg.sender != _owner && authMsgSender(token) != _owner) {
            revert("not allowed");
        }
        _;
    }
    
    modifier onlyBetOwner(uint256 betId, bytes memory token) {
        require(betId < _betMetas.length, "Bet does not exist");
        address betOwner = _betMetas[betId].user;
        if (msg.sender != betOwner && authMsgSender(token) != betOwner) {
            revert("not bet owner");
        }
        _;
    }
    
    constructor(string memory domain) SiweAuth(domain) {
        _owner = msg.sender;
    }
    
    /**
     * @dev Place a bet with amount and outcome
     * @param outcome The outcome to bet on (YES/NO)
     * @param description Public description of the bet
     * @param secretData Private data associated with the bet
     */
    function placeBet(
        BetOutcome outcome,
        string calldata description,
        bytes calldata secretData
    ) external payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        uint256 betId = _nextBetId++;
        
        Bet memory newBet = Bet({
            id: betId,
            user: msg.sender,
            amount: msg.value,
            outcome: outcome,
            status: BetStatus.Active,
            createdAt: block.timestamp,
            description: description
        });
        
        _betMetas.push(newBet);
        _betSecrets.push(secretData);
        _userBets[msg.sender].push(_betMetas.length - 1);
        
        // Add bet amount to user's withdrawable balance
        userBalances[msg.sender] += msg.value;
        
        emit BetPlaced(betId, msg.sender, msg.value, outcome, _betMetas.length - 1);
    }
    
    /**
     * @dev Get user's bets using SIWE authentication
     * @param token SIWE authentication token
     * @param offset Pagination offset
     * @param count Number of bets to return
     */
    function getUserBets(
        bytes memory token,
        uint256 offset,
        uint256 count
    ) external view returns (Bet[] memory) {
        address user = authMsgSender(token);
        require(user != address(0), "Invalid authentication token");
        
        uint256[] memory userBetIndices = _userBets[user];
        
        if (offset >= userBetIndices.length) {
            return new Bet[](0);
        }
        
        uint256 end = offset + count;
        if (end > userBetIndices.length) {
            end = userBetIndices.length;
        }
        
        Bet[] memory result = new Bet[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = _betMetas[userBetIndices[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Get secret data for a specific bet (only bet owner can access)
     * @param betIndex Index of the bet in the _betMetas array
     * @param token SIWE authentication token
     */
    function getBetSecret(
        uint256 betIndex,
        bytes memory token
    ) external view onlyBetOwner(_betMetas[betIndex].id, token) returns (bytes memory) {
        require(betIndex < _betSecrets.length, "Bet secret does not exist");
        return _betSecrets[betIndex];
    }
    
    /**
     * @dev Resolve a bet (only owner)
     * @param betId The bet ID to resolve
     * @param won Whether the bet won or lost
     * @param token SIWE authentication token for owner
     */
    function resolveBet(
        uint256 betId,
        bool won,
        bytes memory token
    ) external onlyOwner(token) {
        require(betId > 0 && betId < _nextBetId, "Invalid bet ID");
        
        // Find the bet in the array
        uint256 betIndex = 0;
        bool found = false;
        for (uint256 i = 0; i < _betMetas.length; i++) {
            if (_betMetas[i].id == betId) {
                betIndex = i;
                found = true;
                break;
            }
        }
        
        require(found, "Bet not found");
        require(_betMetas[betIndex].status == BetStatus.Active, "Bet already resolved");
        
        Bet storage bet = _betMetas[betIndex];
        uint256 payout = 0;
        
        if (won) {
            bet.status = BetStatus.Won;
            // Simple 2x payout for winning bets (user already has their bet amount, so add only the winnings)
            payout = bet.amount * 2;
            userBalances[bet.user] += bet.amount; // Add the winnings (original bet amount already in balance)
        } else {
            bet.status = BetStatus.Lost;
            // Remove the bet amount from user's balance since they lost
            userBalances[bet.user] -= bet.amount;
        }
        
        emit BetResolved(betId, bet.status, payout);
    }
    
    /**
     * @dev Cancel a bet and refund (only owner)
     * @param betId The bet ID to cancel
     * @param token SIWE authentication token for owner
     */
    function cancelBet(
        uint256 betId,
        bytes memory token
    ) external onlyOwner(token) {
        require(betId > 0 && betId < _nextBetId, "Invalid bet ID");
        
        // Find the bet in the array
        uint256 betIndex = 0;
        bool found = false;
        for (uint256 i = 0; i < _betMetas.length; i++) {
            if (_betMetas[i].id == betId) {
                betIndex = i;
                found = true;
                break;
            }
        }
        
        require(found, "Bet not found");
        require(_betMetas[betIndex].status == BetStatus.Active, "Bet already resolved");
        
        Bet storage bet = _betMetas[betIndex];
        bet.status = BetStatus.Cancelled;
        
        // User already has their bet amount in balance, no need to add again
        
        emit BetResolved(betId, bet.status, bet.amount);
    }
    
    /**
     * @dev Withdraw user balance
     */
    function withdrawBalance() external {
        uint256 balance = userBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        userBalances[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(msg.sender, balance);
    }
    
    /**
     * @dev Owner withdraws contract funds (only owner)
     * @param amount Amount to withdraw
     * @param token SIWE authentication token for owner
     */
    function ownerWithdraw(
        uint256 amount,
        bytes memory token
    ) external onlyOwner(token) {
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = payable(_owner).call{value: amount}("");
        require(success, "Owner withdrawal failed");
        
        emit FundsWithdrawn(_owner, amount);
    }
    
    /**
     * @dev Get all bet metadata (paginated)
     * @param offset Pagination offset
     * @param count Number of bets to return
     */
    function getAllBets(
        uint256 offset,
        uint256 count
    ) external view returns (Bet[] memory) {
        if (offset >= _betMetas.length) {
            return new Bet[](0);
        }
        
        uint256 end = offset + count;
        if (end > _betMetas.length) {
            end = _betMetas.length;
        }
        
        Bet[] memory result = new Bet[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = _betMetas[offset + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get total number of bets
     */
    function getTotalBets() external view returns (uint256) {
        return _betMetas.length;
    }
    
    /**
     * @dev Get user's total bet count
     * @param user User address
     */
    function getUserBetCount(address user) external view returns (uint256) {
        return _userBets[user].length;
    }
    
    /**
     * @dev Get owner address
     */
    function getOwner() external view returns (address) {
        return _owner;
    }
}