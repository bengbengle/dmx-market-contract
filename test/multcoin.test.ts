

import { assert, expect } from "chai";
import hre from 'hardhat';

import { Contract, BigNumber, providers, Wallet } from 'ethers';
import { setupExchange } from './utils/index';
import type { CheckBalances, GenerateOrder } from '../exchange';
import { eth, Order, Side, setupTest, Trader } from '../exchange';

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TransactionResponse } from "@ethersproject/providers";
import { formatEther } from "ethers/lib/utils";
import { DMXExchange, MockERC20, StandardPolicyERC721, } from "../typechain-types";

const { ethers } = hre;

describe('MultiCoinTests', function () {

    let exchange: DMXExchange;
    let executionDelegate: Contract;

    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;

    let weth: Contract;
    let usdt: Contract;
    let testNFT: Contract;

    let generateOrder: GenerateOrder;

    let sell: Order;
    let sellInput: any;
    let buy: Order;
    let buyInput: any;
    let tokenId: number = 0;
    let standardPolicyERC721: StandardPolicyERC721;


    before(async () => {
        ({
            admin,
            alice,
            bob,
            weth,
            testNFT: testNFT,
            exchange,
            generateOrder,
            executionDelegate,
            matchingPolicies: { standardPolicyERC721 },
            usdt,
        } = await setupExchange());

        let protocal_fee = await exchange.feeRate();
        // console.log('feeRate:', protocal_fee.toString());

        // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
        let isApprovedContract = await executionDelegate.contracts(exchange.address);
        if (!isApprovedContract) {
            await executionDelegate.approveContract(exchange.address)
            isApprovedContract = await executionDelegate.contracts(exchange.address);
        }
        assert(isApprovedContract, 'isApprovedContract is false');

        // Verify 2. 如果没有授权，需要授权
        let _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
        if (!_isApprovedForAll) {
            await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
        }
        // assert(_isApprovedForAll, '_isApprovedForAll is false');


        // Verify 3. check balance
        let _balance = await (usdt as MockERC20).balanceOf(bob.address);
        // console.log('bob usdt _balance:', formatEther(_balance.toString()));

        // Verify 4. check allowance
        let _allowance = await (usdt as MockERC20).allowance(bob.address, executionDelegate.address);
        if (!_allowance) {
            await (usdt as MockERC20).connect(bob).approve(executionDelegate.address, eth('1000'));
        }

        // assert(_isApprovedForAll, '_allowance is false');

    });

    // it('transferFromUSDT', async () => {
    //     let price = 1000000000

    //     let admin_usdt = await usdt.balanceOf(admin.address)
        
    //     console.log('admin_usdt:', admin_usdt.toString());
        
    //     await usdt.connect(admin).transfer(alice.address, price);
    //     await usdt.connect(admin).transfer(bob.address, price);

    //     let alice_usdt = await usdt.balanceOf(alice.address)
    //     let bob_usdt = await usdt.balanceOf(bob.address)

    //     console.log('alice_usdt:', alice_usdt.toString());
    //     console.log('bob_usdt:', bob_usdt.toString());

    //     await usdt.connect(bob).approve(executionDelegate.address, price);
    //     let bob_approved = await usdt.allowance(bob.address, executionDelegate.address);
    //     console.log('bob_approved:', bob_approved.toString());

    //     let tx =  await exchange.connect(bob).testTransferTo(usdt.address, alice.address, bob.address, price);
    //     await tx.wait();

    //     alice_usdt = await usdt.balanceOf(alice.address)
    //     bob_usdt = await usdt.balanceOf(bob.address)
    //     console.log('alice_usdt:', alice_usdt.toString());
    //     console.log('bob_usdt:', bob_usdt.toString());
    // });


    it('check the single order is valid, sell, buy', async () => {

        tokenId = tokenId + 1;
        await testNFT.mint(alice.address, tokenId);

        let price = 1000000000

        let admin_usdt = await usdt.balanceOf(admin.address)
        
        await usdt.connect(admin).transfer(alice.address, price);
        await usdt.connect(admin).transfer(bob.address, price);
        let alice_usdt = await usdt.balanceOf(alice.address)
        let bob_usdt = await usdt.balanceOf(bob.address)

        console.log('alice_usdt:', alice_usdt.toString());
        console.log('bob_usdt:', bob_usdt.toString());
        console.log('admin_usdt:', admin_usdt.toString());

        await usdt.connect(bob).approve(executionDelegate.address, price);
        let bob_approved = await usdt.allowance(bob.address, executionDelegate.address);
        console.log('bob_approved:', bob_approved.toString());

        // alice_usdt = await usdt.balanceOf(alice.address)
        // bob_usdt = await usdt.balanceOf(bob.address)
        // console.log('alice_usdt:', alice_usdt.toString());
        // console.log('bob_usdt:', bob_usdt.toString());

        sell = generateOrder(alice, { side: Side.Sell, tokenId, paymentToken: usdt.address, price });
        
        buy = generateOrder(bob, {side: Side.Buy, tokenId, paymentToken: usdt.address, price });

        sellInput = await sell.pack({ signer: alice });
        buyInput = await buy.pack();

        let tx =  exchange.connect(bob).execute(sellInput, buyInput);

        const pendingTx: TransactionResponse = await tx;
        const receipt = await pendingTx.wait();

        assert(receipt.status == 1, 'receipt.status is false');

        alice_usdt = await usdt.balanceOf(alice.address)
        bob_usdt = await usdt.balanceOf(bob.address)

        console.log('alice_usdt:', alice_usdt.toString());
        console.log('bob_usdt:', bob_usdt.toString());

        let ownerOf = await testNFT.connect(bob).ownerOf(tokenId)
        console.log('bob address:', bob.address);
        console.log('nft owner address:', ownerOf)
    });

});