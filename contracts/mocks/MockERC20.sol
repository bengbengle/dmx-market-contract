// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {

    modifier onlyPayloadSize(uint size) {
        require(!(msg.data.length < size + 4));
        _;
    }

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    }

    function mint(address to, uint256 value) external returns (bool) {
        _mint(to, value);
        return true;
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // /**
    // * @dev Transfer tokens from one address to another
    // * @param _from address The address which you want to send tokens from
    // * @param _to address The address which you want to transfer to
    // * @param _value uint the amount of tokens to be transferred
    // */
    // function transferFrom(address _from, address _to, uint _value) public override onlyPayloadSize(3 * 32) {
    //     // transferFrom(_from, _to, _value);
    // }

    // 0xB8166598db31AB3e622de37C83cd13f68D900f95
}
