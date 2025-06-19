//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;
import {IPriceOracle} from "./IETHRegistrarController.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ReferralController is Ownable {
    // Mapping from referral code to referrer address
    uint16 private constant TIER1 = 10;
    uint16 private constant TIER2 = 15;
    uint256 private constant PCT1 = 15;
    uint256 private constant PCT2 = 20;
    uint256 private constant PCT3 = 25;
    mapping(address => bool) public controllers;
    mapping(bytes32 => uint256) public commitments;
    mapping(bytes32 => address) public referrees;
    mapping(address => bytes32[]) public referrals;
    mapping(bytes32 => string) public referredBy;
    mapping(address => uint256) public nativeEarnings;
    mapping(address => mapping(address => uint256)) public tokenEarnings;
    
    bytes32[] public referralCodes;
    uint256 public untrackedEarnings;
    uint256 public snapshotEarnings;

    event ReferralCodeAdded(string indexed code, address indexed referrer);
    event WithdrawalDispersed(address indexed);
    modifier onlyControllerOrOwner() {
        require(
            controllers[msg.sender] || owner() == msg.sender,
            "Not a controller or Owner"
        );
        _;
    }

    function addController(address controller) external onlyOwner {
        require(controller != address(0), "Invalid controller address");
        controllers[controller] = true;
    }

    function settlementRegister(
        string memory referree,
        string memory name,
        address owner,
        IPriceOracle.Price memory price,
        address receiver
    ) external onlyControllerOrOwner{
        // If the referree is already registered, we can use it
        require(
            receiver != address(0) && receiver != owner,
            "Invalid receiver address"
        );
        bool codeContains;
        for (uint256 i = 0; i < referralCodes.length; i++) {
            if (referralCodes[i] == keccak256(bytes(name))) {
                codeContains = true;
            }
        }
        if (!codeContains) {
            referralCodes.push(keccak256(bytes(name)));
            emit ReferralCodeAdded(name, owner);
        }
        bool contains;
        for (uint256 i = 0; i < referrals[receiver].length; i++) {
            if (referrals[receiver][i] == keccak256(bytes(name))) {
                contains = true;
            }
        }
        if (contains == false) {
            referrals[receiver].push(keccak256(bytes(name)));
            referredBy[keccak256(bytes(name))] = referree;
            _applyNativeReward(receiver, price.base + price.premium);
        } else {
            _applyNativeReward(receiver, price.base + price.premium);
        }
    }

    function settlementRegisterWithCard(
        string memory referree,
        string memory name,
        address owner,
        IPriceOracle.Price memory price,
        address receiver
    ) external onlyControllerOrOwner{
        // If the referree is already registered, we can use it
        require(
            receiver != address(0) && receiver != owner,
            "Invalid receiver address"
        );
        bool codeContains;
        for (uint256 i = 0; i < referralCodes.length; i++) {
            if (referralCodes[i] == keccak256(bytes(name))) {
                codeContains = true;
            }
        }
        if (!codeContains) {
            referralCodes.push(keccak256(bytes(name)));
            emit ReferralCodeAdded(name, owner);
        }
        bool contains;
        for (uint256 i = 0; i < referrals[receiver].length; i++) {
            if (referrals[receiver][i] == keccak256(bytes(name))) {
                contains = true;
            }
        }
        if (contains == false) {
            referrals[receiver].push(keccak256(bytes(name)));
            referredBy[keccak256(bytes(name))] = referree;
            _applyNativeReward(receiver, price.base + price.premium);
            untrackedEarnings += (price.base + price.premium);
        } else {
            _applyNativeReward(receiver, price.base + price.premium);
        }
    }

    /// @notice Only your controller or admin should be able to call this!
    function setReferree(
        bytes32 code,
        address who
    ) external onlyControllerOrOwner {
        referrees[code] = who;
        emit ReferralCodeAdded(string(abi.encodePacked(code)), who);
    }

    function settlement(
        IPriceOracle.Price memory price,
        address receiver
    ) external onlyControllerOrOwner{
        // If the referree is already registered, we can use it
        require(receiver != address(0), "Invalid receiver address");
        _applyNativeReward(receiver, price.base + price.premium);
        untrackedEarnings += (price.base + price.premium);
    }

    function settlementWithToken(
        IPriceOracle.Price memory price,
        address receiver,
        address tokenAddress
    ) external onlyControllerOrOwner{
        // If the referree is already registered, we can use it
        _applyTokenReward(receiver, tokenAddress, price.base + price.premium);
    }

    function settlementRegisterWithToken(
        string memory referree,
        string memory name,
        address owner,
        IPriceOracle.Price memory price,
        address tokenAddress
    ) external onlyControllerOrOwner{
        // If the referree is already registered, we can use it
        // Implement token settlement logic here if needed
        bool codeContains;
        for (uint256 i = 0; i < referralCodes.length; i++) {
            if (referralCodes[i] == keccak256(bytes(name))) {
                codeContains = true;
            }
        }
        if (!codeContains) {
            referralCodes.push(keccak256(bytes(name)));
            emit ReferralCodeAdded(name, owner);
        }
        address receiver = referrees[keccak256(bytes(referree))];
        if (receiver != address(0) && receiver != owner) {
            bool contains;
            for (uint256 i = 0; i < referrals[receiver].length; i++) {
                if (referrals[receiver][i] == keccak256(bytes(name))) {
                    contains = true;
                }
            }
            if (contains == false) {
                referrals[receiver].push(keccak256(bytes(name)));
                referredBy[keccak256(bytes(name))] = referree;
                _applyTokenReward(
                    receiver,
                    tokenAddress,
                    price.base + price.premium
                );
            } else {
                _applyTokenReward(
                    receiver,
                    tokenAddress,
                    price.base + price.premium
                );
            }
        }
    }

    function withdrawAllNativeEarnings() external onlyOwner {
        uint256 length = referralCodes.length;
        for (uint256 i = 0; i < length; ) {
            bytes32 code = referralCodes[i];
            address referrer = referrees[code];
            uint256 earnings = nativeEarnings[referrer];
            if (earnings > 0) {
                nativeEarnings[referrer] = 0;
                (bool ok, ) = payable(referrer).call{value: earnings}("");
                require(ok, "Payment failed");
            }
            unchecked {
                ++i;
            }
        }
        // Transfer any remaining balance to the owner
        uint256 remainingBalance = address(this).balance;
        if (remainingBalance > 0) {
            payable(owner()).transfer(remainingBalance);
        }
        // Emit an event for the withdrawal
        emit WithdrawalDispersed(msg.sender);
    }

    function withdrawAllTokenEarnings(
        address[] memory tokenAddresses
    ) external onlyOwner {
        uint256 length = referralCodes.length;
        uint256 tokenLength = tokenAddresses.length;
        require(length > 0, "No referral codes registered");
        for (uint256 j = 0; j < tokenLength; ) {
            address tokenAddress = tokenAddresses[j];
            for (uint256 i = 0; i < length; ) {
                bytes32 code = referralCodes[i];
                address referrer = referrees[code];
                uint256 earnings = tokenEarnings[referrer][tokenAddress];
                require(earnings > 0, "No earnings to withdraw");
                tokenEarnings[referrer][tokenAddress] = 0;
                // Assuming the token follows ERC20 standard
                IERC20(tokenAddress).safeTransfer(referrer, earnings);
                unchecked {
                    ++i;
                }
            }
            unchecked {
                ++j;
            }
        }
    }

    function totalReferrals(address referrer) external view returns (uint256) {
        return referrals[referrer].length;
    }

    function totalNativeEarnings(
        address referrer
    ) external view returns (uint256) {
        return nativeEarnings[referrer];
    }

    function totalTokenEarnings(
        address referrer,
        address tokenAddress
    ) external view returns (uint256) {
        return tokenEarnings[referrer][tokenAddress];
    }

    function _rewardPct(uint256 numReferrals) private pure returns (uint256) {
        if (numReferrals < TIER1) return PCT1;
        if (numReferrals < TIER2) return PCT2;
        return PCT3;
    }

    function _applyNativeReward(address receiver, uint256 amount) private {
        nativeEarnings[receiver] +=
            (amount * _rewardPct(referrals[receiver].length)) /
            100;
    }

    function _applyTokenReward(
        address receiver,
        address token,
        uint256 amount
    ) private {
        tokenEarnings[receiver][token] +=
            (amount * _rewardPct(referrals[receiver].length)) /
            100;
    }

    function balance() public view returns(uint256) {
        return address(this).balance;
    }
}
