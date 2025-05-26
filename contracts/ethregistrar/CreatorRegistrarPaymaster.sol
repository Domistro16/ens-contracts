// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9.0;

import "@pancakeswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./IETHRegistrarController.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/utils/TransferHelper.sol";
import "../utils/IWBNB.sol";

contract CreatorRegistrarPaymaster {
    ISwapRouter public immutable router;
    IETHRegistrarController public immutable controller;
    IWBNB public immutable WBNB;

    /// @dev The minimum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MIN_TICK)
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    /// @dev The maximum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MAX_TICK)
    uint160 internal constant MAX_SQRT_RATIO =
        1461446703485210103287273052203988822378723970342;

    constructor(address _router, address _controller, address _WBNB) {
        router = ISwapRouter(_router);
        controller = IETHRegistrarController(_controller);
        WBNB = IWBNB(_WBNB);
    }

    /// @notice Pay with any ERC-20: swap → unwrap → ENS register → refund
    function registerWithToken(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 fuses,
        address token,
        uint256 amountIn,
        uint256 minBnbOut,
        uint24 poolFee
    ) external {
        _pullAndSwap(
            token,
            amountIn,
            minBnbOut,
            poolFee
        );
        _registerENS(
            name,
            owner,
            duration,
            secret,
            resolver,
            data,
            reverseRecord,
            fuses
        );
        _refundDust();
    }

    function renewWithToken(
        string memory name,
        uint256 duration,
        address token,
        uint256 amountIn,
        uint256 minBnbOut,
        uint24 poolFee
    ) external {
        TransferHelper.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amountIn
        );
        // 2) approve router
        TransferHelper.safeApprove(token, address(router), amountIn);

        // 3) swap token → WBNB
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: token,
                tokenOut: address(WBNB),
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: minBnbOut,
                sqrtPriceLimitX96: 0
            });
        uint256 wbnbReceived = router.exactInputSingle(params);

        // 4) unwrap to native BNB
        WBNB.withdraw(wbnbReceived);

        _renewENS(name, duration);
        _refundDust();
    }

      function _pullAndSwap(
        address token,
        uint256 amountIn,
        uint256 minBnbOut,
        uint24  poolFee
    ) internal {
        // 1) pull ERC20
        bool zeroForOne = token < address(WBNB);
        uint160 limit = zeroForOne
            ? MIN_SQRT_RATIO + 1
            : MAX_SQRT_RATIO - 1; 

        TransferHelper.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amountIn
        );
        // 2) approve router
        TransferHelper.safeApprove(token, address(router), amountIn);

        // 3) swap token → WBNB
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: token,
                tokenOut: address(WBNB),
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: minBnbOut,
                sqrtPriceLimitX96: limit
            });
        uint256 wbnbReceived = router.exactInputSingle(params);

        // 4) unwrap to native BNB
        WBNB.withdraw(wbnbReceived);
        
    } 

    function _registerENS(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 fuses
    ) internal {
        // compute required BNB
        IPriceOracle.Price memory price = controller.rentPrice(name, duration);
        uint256 total = price.base + price.premium;
        require(address(this).balance >= total, "Insufficient BNB");

        // commit + register in one
        controller.register{value: total}(
            name,
            owner,
            duration,
            secret,
            resolver,
            data,
            reverseRecord,
            fuses
        );
    }

    function _renewENS(string memory name, uint256 duration) internal {
        // compute required BNB
        IPriceOracle.Price memory price = controller.rentPrice(name, duration);
        uint256 total = price.base + price.premium;
        require(address(this).balance >= total, "Insufficient BNB");

        // commit + register in one
        controller.renew{value: total}(name, duration);
    }

    function _refundDust() internal {
        uint256 bal = address(this).balance;
        if (bal > 0) {
            payable(msg.sender).transfer(bal);
        }
    }

    // receive unwrapped BNB
    receive() external payable {}
}
