// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title USDTToken
 * @dev A simple mock ERC20 token for USDT with 6 decimals.
 */
contract USDTToken is ERC20 {
    constructor() ERC20("USDT Token", "USDT") {}

    /**
     * @dev Overrides the default ERC20 decimals function to return 6.
     * This is the standard for USDT.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Public mint function to create tokens for testing purposes.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
