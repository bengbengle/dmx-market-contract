// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (proxy/ERC1967/ERC1967Proxy.sol)
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";

/**
 * @dev 该合约实现了一个可升级的代理。
 * 它是可升级的，因为调用被委托给一个可以更改的实现地址。
 * 此地址存储在 `EIP1967` 指定的存储位置中, 因此它不会与代理后面的实现的存储布局冲突。
 */
contract ERC1967Proxy is Proxy, ERC1967Upgrade {
    /**
     * @dev 使用 `_logic` 指定的初始实现 来 初始化 可升级代理
     *
     * If `_data` is nonempty, it's used as data in a delegate call to `_logic`. 
     * This will typically be an encoded
     * function call, and allows initializating the storage of the proxy like a Solidity constructor.
     * 如果 _data 不为空时候， 它是用在 委托中调用 `_logic` 的数据。
     * 这通常是一个编码的函数调用，并允许像 Solidity 构造函数一样初始化代理的存储。
     */
    constructor(address _logic, bytes memory _data) payable {
        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1));
        _upgradeToAndCall(_logic, _data, false);
    }

    /**
     * @dev 返回当前的实现地址
     */
    function _implementation() internal view virtual override returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }


    /**
     * @dev 返回当前的实现地址
     */
    function implementation() external view returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }


}
