// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import {IExecutionDelegate} from "./interfaces/IExecutionDelegate.sol";

/**
 * @title ExecutionDelegate
 * @dev Proxy contract to manage user token approvals
 */
contract ExecutionDelegate is IExecutionDelegate, Ownable {

    mapping(address => bool) public contracts;
    mapping(address => bool) public revokedApproval;

    modifier approvedContract() {
        require(contracts[msg.sender], "Contract is not approved to make transfers");
        _;
    }

    event ApproveContract(address indexed _contract);
    event DenyContract(address indexed _contract);

    event RevokeApproval(address indexed user);
    event GrantApproval(address indexed user);

    /**
     * @dev 批准合约 调用传输函数
     * @param _contract address of contract to approve
     */
    function approveContract(address _contract) onlyOwner external {
        contracts[_contract] = true;
        emit ApproveContract(_contract);
    }

    /**
     * @dev 撤销批准的合约 调用传输函数 
     * @param _contract address of contract to revoke approval
     */
    function denyContract(address _contract) onlyOwner external {
        contracts[_contract] = false;
        emit DenyContract(_contract);
    }

    /**
     * @dev Block contract from making transfers on-behalf of a specific user
     */
    function revokeApproval() external {
        revokedApproval[msg.sender] = true;
        emit RevokeApproval(msg.sender);
    }

    /**
     * @dev 允许合约代表特定用户进行转账
     */
    function grantApproval() external {
        revokedApproval[msg.sender] = false;
        emit GrantApproval(msg.sender);
    }

    /**
     * @dev Transfer ERC721 token using `transferFrom`
     * @param collection address of the collection
     * @param from address of the sender
     * @param to address of the recipient
     * @param tokenId tokenId
     */
    function transferERC721Unsafe(address collection, address from, address to, uint256 tokenId)
        approvedContract
        external
    {
        require(revokedApproval[from] == false, "User has revoked approval");
        IERC721(collection).transferFrom(from, to, tokenId);
    }

    /**
     * @dev Transfer ERC721 token using `safeTransferFrom`
     * @param collection address of the collection
     * @param from address of the sender
     * @param to address of the recipient
     * @param tokenId tokenId
     */
    function transferERC721(address collection, address from, address to, uint256 tokenId)
        approvedContract
        external
    {
        require(revokedApproval[from] == false, "User has revoked approval");
        IERC721(collection).safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev Transfer ERC1155 token using `safeTransferFrom`
     * @param collection address of the collection
     * @param from address of the sender
     * @param to address of the recipient
     * @param tokenId tokenId
     * @param amount amount
     */
    function transferERC1155(address collection, address from, address to, uint256 tokenId, uint256 amount)
        approvedContract
        external
    {
        require(revokedApproval[from] == false, "User has revoked approval");
        IERC1155(collection).safeTransferFrom(from, to, tokenId, amount, "");
    }

    /**
     * @dev Transfer ERC20 token
     * @param token address of the token
     * @param from address of the sender
     * @param to address of the recipient
     * @param amount amount
     */
    function transferERC20(address token, address from, address to, uint256 amount)
        approvedContract
        external
        returns (bool)
    {
        require(revokedApproval[from] == false, "User has revoked approval");
        return IERC20(token).transferFrom(from, to, amount);
    }
}
