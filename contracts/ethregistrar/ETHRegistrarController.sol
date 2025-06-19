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
        0x4f2c0fc83d175c423d55ddf2fef3b9b38af479fac3adb42afb02778397a27454;
    uint64 private constant MAX_EXPIRY = type(uint64).max;
    BaseRegistrarImplementation immutable base;
    TokenPriceOracle public immutable prices;
    uint256 public immutable minCommitmentAge;
    uint256 public immutable maxCommitmentAge;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;
    ReferralController public immutable referralController;
    address public infoFi;
    mapping(bytes32 => uint256) public commitments;
    address public backendWallet;
    uint256 public untrackedInfoFi;

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
        address _infoFi,
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
        infoFi = _infoFi;
        referralController = _referralController;
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
        return name.strlen() >= 3;
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
            referralController.setReferree(keccak256(bytes(name)), owner);
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
            payable(msg.sender).transfer(
                msg.value - (price.base + price.premium)
            );
        }
        address receiver = referralController.referrees(
            keccak256(bytes(referree))
        );

        referralController.settlementRegister(
            referree,
            name,
            owner,
            price,
            receiver
        );
        (bool ok, ) = payable(infoFi).call{
            value: (price.base + price.premium) -
                ((price.base + price.premium) * 35) /
                100
        }("");
        require(ok, "Payment to infoFi failed");
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
    ) public onlyBackend{
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
            referralController.setReferree(keccak256(bytes(name)), owner);
        }

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );
        address receiver = referralController.referrees(
            keccak256(bytes(referree))
        );

        referralController.settlementRegister(
            referree,
            name,
            owner,
            price,
            receiver
        );

        untrackedInfoFi += (((price.base + price.premium) * 35) / 100);
    }

    function resetInfoFi () external onlyOwner {
        untrackedInfoFi = 0;
    }

    function _tokenTransfer(
        address tokenAddress,
        IPriceOracle.Price memory price
    ) internal {
        require(
            IERC20(tokenAddress).allowance(msg.sender, address(this)) >=
                price.base + price.premium,
            "Insufficient ERC20 allowance"
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
    }

    function _internalRecordsCall(
        string memory name,
        bytes[] memory data,
        address owner,
        address resolver,
        bool reverseRecord
    ) internal {
        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
            referralController.setReferree(keccak256(bytes(name)), owner);
        }
    }

    function registerWithToken(
        RegisterParams memory registerParams,
        TokenParams memory tokenParams,
        bool lifetime,
        string memory referree
    ) external override {
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
            tokenParams.token,
            lifetime
        );

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
            registerParams.reverseRecord
        );
        _tokenTransfer(
            tokenParams.tokenAddress,
            rentPriceToken(
                registerParams.name,
                registerParams.duration,
                tokenParams.token,
                lifetime
            )
        );

        emit NameRegistered(
            registerParams.name,
            keccak256(bytes(registerParams.name)),
            registerParams.owner,
            rentPriceToken(
                registerParams.name,
                registerParams.duration,
                tokenParams.token,
                lifetime
            ).base,
            rentPriceToken(
                registerParams.name,
                registerParams.duration,
                tokenParams.token,
                lifetime
            ).premium,
            expires
        );
        referralController.settlementRegisterWithToken(
            referree,
            registerParams.name,
            registerParams.owner,
            rentPriceToken(
                registerParams.name,
                registerParams.duration,
                tokenParams.token,
                lifetime
            ),
            tokenParams.tokenAddress
        );
        IERC20(tokenParams.tokenAddress).safeTransferFrom(
            address(this),
            infoFi,
            ((price.base + price.premium) * 35) / 100
        );
    }

    function renew(
        string calldata name,
        uint256 duration,
        bool lifetime
    ) external payable {
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        string memory referree = referralController.referredBy(labelhash);
        if (msg.value < price.base) {
            revert InsufficientValue();
        }
        uint256 expires = nameWrapper.renew(tokenId, duration);

        if (msg.value > price.base) {
            payable(msg.sender).transfer(msg.value - price.base);
        }
        emit NameRenewed(name, labelhash, msg.value, expires);
        if (
            referralController.referrees(keccak256(bytes(referree))) !=
            address(0)
        ) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            referralController.settlement(price, receiver);
        }
        (bool ok, ) = payable(infoFi).call{
            value: (price.base + price.premium) -
                ((price.base + price.premium) * 35) /
                100
        }("");
        require(ok, "Payment to infoFi failed");
    }

    function renewTokens(
        string calldata name,
        uint256 duration,
        string memory token,
        address tokenAddress,
        bool lifetime
    ) external override {
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        string memory referree = referralController.referredBy(labelhash);
        IPriceOracle.Price memory price = rentPriceToken(
            name,
            duration,
            token,
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

        emit NameRenewed(name, labelhash, price.base + price.premium, expires);

        if (
            referralController.referrees(keccak256(bytes(referree))) !=
            address(0)
        ) {
            address receiver = referralController.referrees(
                keccak256(bytes(referree))
            );
            referralController.settlementWithToken(
                price,
                receiver,
                tokenAddress
            );
        }
        IERC20(tokenAddress).safeTransferFrom(
            address(this),
            infoFi,
            ((price.base + price.premium) * 35) / 100
        );
    }

    function withdraw() public {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens(address tokenAddress) public {
        IERC20(tokenAddress).safeTransfer(
            owner(),
            IERC20(tokenAddress).balanceOf(address(this))
        );
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
            string.concat(name, ".creator")
        );
    }
}
