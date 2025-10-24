// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCToken is ERC20 {
    constructor() ERC20("USDC Token", "USDC") { }

    /**
     * @dev Overrides the default ERC20 decimals function to return 6.
     * This is the standard for USDC.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
