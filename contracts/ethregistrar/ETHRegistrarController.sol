//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import {BaseRegistrarImplementation} from "./BaseRegistrarImplementation.sol";
import {StringUtils} from "../utils/StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ENS} from "../registry/ENS.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
import {IETHRegistrarController, IPriceOracle} from "./IETHRegistrarController.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";
import {ERC20Recoverable} from "../utils/ERC20Recoverable.sol";
import {TokenPriceOracle} from "./TokenPriceOracle.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReferralController} from "./ReferralController.sol";
import {Airdrop} from "./Airdrop.sol";

error CommitmentTooNew(bytes32 commitment);
error CommitmentTooOld(bytes32 commitment);
error NameNotAvailable(string name);
error DurationTooShort(uint256 duration);
error ResolverRequiredWhenDataSupplied();
error UnexpiredCommitmentExists(bytes32 commitment);
error InsufficientValue();
error Unauthorised(bytes32 node);
error MaxCommitmentAgeTooLow();
error MaxCommitmentAgeTooHigh();

/// @dev A registrar controller for registering and renewing names at fixed cost.
contract ETHRegistrarController is
    Ownable,
    IETHRegistrarController,
    IERC165,
    ERC20Recoverable,
    ReverseClaimer
{
    using StringUtils for *;
    using Address for address;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    bytes32 private constant ETH_NODE =
        0xf92e9539a836c60f519caef3f817b823139813f56a7a19c9621f7b47f35b340d;
    uint64 private constant MAX_EXPIRY = type(uint64).max;
    BaseRegistrarImplementation immutable base;
    TokenPriceOracle public prices;
    uint256 public immutable minCommitmentAge;
    uint256 public immutable maxCommitmentAge;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;
    ReferralController public referralController;
    address public infoFi;
    mapping(bytes32 => uint256) public commitments;
    address public backendWallet;
    uint256 public untrackedInfoFi;
    mapping(address => Token) public verifiedTokens;
    Airdrop public airdrop;
    bool public useAirdrop;
    uint256 public mints;
    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 baseCost,
        uint256 premium,
        uint256 expires
    );
    event NameRenewed(
        string name,
        bytes32 indexed label,
        uint256 cost,
        uint256 expires
    );

    struct Token {
        string token;
        address tokenAddress;
    }
    modifier onlyBackend() {
        require(msg.sender == backendWallet, "Not Backend");
        _;
    }

    constructor(
        BaseRegistrarImplementation _base,
        TokenPriceOracle _prices,
        uint256 _minCommitmentAge,
        uint256 _maxCommitmentAge,
        ReverseRegistrar _reverseRegistrar,
        INameWrapper _nameWrapper,
        ENS _ens,
        ReferralController _referralController
    ) ReverseClaimer(_ens, msg.sender) {
        if (_maxCommitmentAge <= _minCommitmentAge) {
            revert MaxCommitmentAgeTooLow();
        }

        if (_maxCommitmentAge > block.timestamp) {
            revert MaxCommitmentAgeTooHigh();
        }

        base = _base;
        prices = _prices;
        minCommitmentAge = _minCommitmentAge;
        maxCommitmentAge = _maxCommitmentAge;
        reverseRegistrar = _reverseRegistrar;
        nameWrapper = _nameWrapper;
        referralController = _referralController;
    }

    function setAirdrop(Airdrop _airdrop) public onlyOwner {
        airdrop = _airdrop;
    }

    function controlAirdrop(bool enabled) public onlyOwner {
        useAirdrop = enabled;
    }

    function setBackend(address wallet) public onlyOwner {
        backendWallet = wallet;
    }

    function setOracle(address oracle) public onlyOwner {
        prices = TokenPriceOracle(oracle);
    }

    function setReferral(address referral) public onlyOwner {
        referralController = ReferralController(referral);
    }

    function setToken(
        Token memory token,
        address tokenAddress
    ) public onlyOwner {
        verifiedTokens[tokenAddress] = token;
    }

    function removeToken(address tokenAddress) public onlyOwner {
        delete verifiedTokens[tokenAddress];
    }

    function setInfoFi(address _infoFi) public onlyOwner {
        infoFi = _infoFi;
    }

    function rentPrice(
        string memory name,
        uint256 duration,
        bool lifetime
    ) public view virtual override returns (IPriceOracle.Price memory price) {
        require(
            duration == 0 || duration >= MIN_REGISTRATION_DURATION,
            "Invalid duration"
        );
        bytes32 label = keccak256(bytes(name));
        price = prices.price(
            name,
            base.nameExpires(uint256(label)),
            duration,
            lifetime
        );
    }

    function rentPriceToken(
        string memory name,
        uint256 duration,
        string memory token,
        bool lifetime
    ) public view virtual override returns (IPriceOracle.Price memory price) {
        require(
            duration == 0 || duration >= MIN_REGISTRATION_DURATION,
            "Invalid duration"
        );
        bytes32 label = keccak256(bytes(name));
        price = prices.priceToken(
            name,
            base.nameExpires(uint256(label)),
            duration,
            token,
            lifetime
        );
    }

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() >= 2;
    }

    function available(string memory name) public view override returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime
    ) public pure override returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        if (data.length > 0 && resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }
        return
            keccak256(
                abi.encode(
                    label,
                    owner,
                    duration,
                    secret,
                    resolver,
                    data,
                    reverseRecord,
                    ownerControlledFuses,
                    lifetime
                )
            );
    }

    function commit(bytes32 commitment) public override {
        if (commitments[commitment] + maxCommitmentAge >= block.timestamp) {
            revert UnexpiredCommitmentExists(commitment);
        }
        commitments[commitment] = block.timestamp;
    }

    function _updatePoints(
        string memory name,
        uint256 duration,
        address owner,
        bool lifetime
    ) internal {
        uint256 point = 0;
        if (name.strlen() == 2) {
            point = 100;
        } else if (name.strlen() == 3) {
            point = 50;
        } else if (name.strlen() == 4) {
            point = 20;
        } else {
            point = 10;
        }
        if (useAirdrop) {
            uint256 points = point * (lifetime ? 3 : duration / 31536000);
            airdrop.updatePoints(owner, points);
        }
    }

    function register(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime,
        string memory referree
    ) public payable override {
        if (lifetime) {
            duration = 31536000000;
        }
        _updatePoints(name, duration, owner, lifetime);

        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        if (msg.value < price.base + price.premium) {
            revert InsufficientValue();
        }

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
            bool canRefer = referralController.setCode(name, owner);
            if (canRefer) {
                referralController.setReferree(
                    keccak256(bytes(name)),
                    owner,
                    expires
                );
            }
        }

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );
        if (msg.value > (price.base + price.premium)) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - (price.base + price.premium)
            }("");
            require(success, "Refund failed");
        }
        _referralPayout(price, referree, name, owner);
    }

    function registerWithCard(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime,
        string memory referree
    ) public {
        if (lifetime) {
            duration = 31536000000;
        }

        if (mints > 1000) {
            require(msg.sender == backendWallet, "Not Backend");
        }
        _updatePoints(name, duration, owner, lifetime);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, owner);
            bool canRefer = referralController.setCode(name, owner);
            if (canRefer) {
                referralController.setReferree(
                    keccak256(bytes(name)),
                    owner,
                    expires
                );
            }
        }

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );
        if (mints > 1000) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            if (keccak256(bytes(referree)) != keccak256(bytes(""))) {
                referralController.settlementRegisterWithCard(
                    referree,
                    name,
                    owner,
                    price.base + price.premium,
                    receiver
                );
            }
        }
        untrackedInfoFi += (((price.base + price.premium) * 35) / 100);
        mints += 1;
    }

    function resetInfoFi() external payable onlyOwner {
        require(msg.value > 0, "Must send value to reset infoFi");
        (bool ok, ) = payable(infoFi).call{value: msg.value}("");
        require(ok, "Payment to infoFi failed");
        untrackedInfoFi = 0;
    }

    function _tokenTransfer(
        address tokenAddress,
        IPriceOracle.Price memory price
    ) internal {
        IERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            price.base + price.premium
        );
    }

    function _internalRecordsCall(
        string memory name,
        bytes[] memory data,
        address owner,
        address resolver,
        bool reverseRecord,
        uint256 duration
    ) internal {
        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
            bool canRefer = referralController.setCode(name, owner);
            if (canRefer) {
                referralController.setReferree(
                    keccak256(bytes(name)),
                    owner,
                    duration
                );
            }
        }
    }

    function registerWithToken(
        RegisterParams memory registerParams,
        address tokenAddress,
        bool lifetime,
        string memory referree
    ) external override {
        require(
            verifiedTokens[tokenAddress].tokenAddress != address(0),
            "Unaccepted Token"
        );
        _updatePoints(
            registerParams.name,
            registerParams.duration,
            registerParams.owner,
            lifetime
        );
        Token memory t = verifiedTokens[tokenAddress];
        if (lifetime) {
            registerParams.duration = 31536000000;
        }
        _consumeCommitment(
            registerParams.name,
            registerParams.duration,
            makeCommitment(
                registerParams.name,
                registerParams.owner,
                registerParams.duration,
                registerParams.secret,
                registerParams.resolver,
                registerParams.data,
                registerParams.reverseRecord,
                registerParams.ownerControlledFuses,
                lifetime
            )
        );

        IPriceOracle.Price memory price = rentPriceToken(
            registerParams.name,
            registerParams.duration,
            t.token,
            lifetime
        );
        if (
            IERC20(tokenAddress).balanceOf(msg.sender) <
            price.base + price.premium
        ) {
            revert InsufficientValue();
        }

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            registerParams.name,
            registerParams.owner,
            registerParams.duration,
            registerParams.resolver,
            registerParams.ownerControlledFuses
        );

        _internalRecordsCall(
            registerParams.name,
            registerParams.data,
            registerParams.owner,
            registerParams.resolver,
            registerParams.reverseRecord,
            expires
        );
        _tokenTransfer(tokenAddress, price);

        emit NameRegistered(
            registerParams.name,
            keccak256(bytes(registerParams.name)),
            registerParams.owner,
            price.base,
            price.premium,
            expires
        );
        address receiver = referralController.referrees(
            keccak256(bytes(referree))
        );

        uint256 referrals = referralController.totalReferrals(receiver);
        if (keccak256(bytes(referree)) != keccak256(bytes(""))) {
            uint256 pct = 25;
            if (referrals >= 5) {
                pct = 30;
            }
            IERC20(tokenAddress).safeTransfer(
                address(referralController),
                ((price.base + price.premium) * pct) / 100
            );
            referralController.settlementRegisterWithToken(
                referree,
                registerParams.name,
                registerParams.owner,
                price.base + price.premium,
                tokenAddress
            );
        }
    }

    function renewCard(
        string calldata name,
        uint256 duration,
        bool lifetime
    ) external onlyBackend {
        if (lifetime) {
            duration = 31536000000;
        }
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        string memory referree = referralController.referredBy(labelhash);

        uint256 expires = nameWrapper.renew(tokenId, duration);
        referralController.updateReferralCode(keccak256(bytes(name)), expires);

        emit NameRenewed(name, labelhash, price.base, expires);
        if (
            referralController.referrees(keccak256(bytes(referree))) !=
            address(0)
        ) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            referralController.settlementCard(
                price.base + price.premium,
                receiver,
                referree
            );
        }
        untrackedInfoFi += ((price.base + price.premium) * 35) / 100;
    }

    function renew(
        string calldata name,
        uint256 duration,
        bool lifetime
    ) external payable {
        if (lifetime) {
            duration = 31536000000;
        }
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        string memory referree = referralController.referredBy(labelhash);
        if (msg.value < price.base) {
            revert InsufficientValue();
        }
        uint256 expires = nameWrapper.renew(tokenId, duration);
        referralController.updateReferralCode(keccak256(bytes(name)), expires);

        if (msg.value > price.base) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - price.base
            }("");
            require(success, "Refund Failed");
        }
        emit NameRenewed(name, labelhash, msg.value, expires);
        if (
            referralController.referrees(keccak256(bytes(referree))) !=
            address(0)
        ) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            uint256 referrals = referralController.totalReferrals(receiver);
            uint256 pct = 25;
            if (referrals >= 5) {
                pct = 30;
            }
            referralController.settlement{
                value: (((price.base + price.premium) * pct) / 100)
            }(price.base + price.premium, receiver, referree);
        }
    }

    function renewTokens(
        string calldata name,
        uint256 duration,
        address tokenAddress,
        bool lifetime
    ) external override {
        if (lifetime) {
            duration = 31536000000;
        }
        require(
            verifiedTokens[tokenAddress].tokenAddress != address(0),
            "Unaccepted Token"
        );

        Token memory t = verifiedTokens[tokenAddress];
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        string memory referree = referralController.referredBy(labelhash);
        IPriceOracle.Price memory price = rentPriceToken(
            name,
            duration,
            t.token,
            lifetime
        );
        if (
            IERC20(tokenAddress).balanceOf(msg.sender) <
            price.base + price.premium
        ) {
            revert InsufficientValue();
        }
        IERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            price.base + price.premium
        );
        uint256 expires = nameWrapper.renew(tokenId, duration);
        referralController.updateReferralCode(keccak256(bytes(name)), expires);

        emit NameRenewed(name, labelhash, price.base + price.premium, expires);

        if (
            referralController.referrees(keccak256(bytes(referree))) !=
            address(0)
        ) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            uint256 referrals = referralController.totalReferrals(receiver);
            uint256 pct = 25;
            if (referrals >= 5) {
                pct = 30;
            }
            IERC20(tokenAddress).safeTransferFrom(
                address(this),
                address(referralController),
                ((price.base + price.premium) * pct) / 100
            );
            referralController.settlementWithToken(
                price.base + price.premium,
                receiver,
                tokenAddress,
                referree
            );
        }
    }

    function withdraw() public {
        (bool success, ) = payable(owner()).call{value: address(this).balance}(
            ""
        );
        require(success, "Transfer failed");
    }

    function withdrawTokens(address tokenAddress) public {
        IERC20(tokenAddress).safeTransfer(
            owner(),
            IERC20(tokenAddress).balanceOf(address(this))
        );
    }

    function _referralPayout(
        IPriceOracle.Price memory price,
        string memory referree,
        string memory name,
        address owner
    ) internal {
        address receiver = referralController.referrees(
            keccak256(bytes(referree))
        );
        if (keccak256(bytes(referree)) != keccak256(bytes(""))) {
            uint256 pct = 25;

            uint256 referrals = referralController.totalReferrals(receiver);
            if (referrals >= 5) {
                pct = 30;
            }
            referralController.settlementRegister{
                value: (((price.base + price.premium) * pct) / 100)
            }(referree, name, owner, price.base + price.premium, receiver);
        }
    }

    function getMints() public view returns (uint256) {
        return mints;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IETHRegistrarController).interfaceId;
    }

    /* Internal functions */

    function _consumeCommitment(
        string memory name,
        uint256 duration,
        bytes32 commitment
    ) internal {
        // Require an old enough commitment.
        if (commitments[commitment] + minCommitmentAge > block.timestamp) {
            revert CommitmentTooNew(commitment);
        }

        // If the commitment is too old, or the name is registered, stop
        if (commitments[commitment] + maxCommitmentAge <= block.timestamp) {
            revert CommitmentTooOld(commitment);
        }
        if (!available(name)) {
            revert NameNotAvailable(name);
        }

        delete (commitments[commitment]);

        if (duration != 0 && duration < MIN_REGISTRATION_DURATION) {
            revert DurationTooShort(duration);
        }
    }

    function _setRecords(
        address resolverAddress,
        bytes32 label,
        bytes[] memory data
    ) internal {
        // use hardcoded .eth namehash
        bytes32 nodehash = keccak256(abi.encodePacked(ETH_NODE, label));
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    function _setReverseRecord(
        string memory name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, ".safu")
        );
    }
}
