

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
    // let thirdParty: SignerWithAddress;
    // standardPolicyERC721: StandardPolicyERC721;

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

    // let aliceBalance: BigNumber;
    // let aliceUsdtBalance: BigNumber;
    // let aliceBalanceWeth: BigNumber;
    // let bobBalance: BigNumber;
    // let bobUsdtBalance: BigNumber;
    // let bobBalanceWeth: BigNumber;
    // let feeRecipientBalance: BigNumber;
    // let feeRecipientBalanceWeth: BigNumber;

    const updateBalances = async () => {
        // aliceBalance = await alice.getBalance();
        // aliceUsdtBalance = await usdt.balanceOf(alice.address);
        // aliceBalanceWeth = await weth.balanceOf(alice.address);
        // bobBalance = await bob.getBalance();
        // bobUsdtBalance = await await usdt.balanceOf(bob.address);
        // bobBalanceWeth = await weth.balanceOf(bob.address);
        // feeRecipientBalance = await ethers.provider.getBalance(thirdParty.address);
        // feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);
    };

    before(async () => {
        ({
            admin,
            alice,
            bob,
            // thirdParty,
            weth,
            testNFT: testNFT,
            exchange,
            generateOrder,
            executionDelegate,
            matchingPolicies: { standardPolicyERC721 },
            usdt,
        } = await setupExchange());

        let protocal_fee = await exchange.feeRate();
        console.log('feeRate:', protocal_fee.toString());

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
        console.log('bob usdt _balance:', formatEther(_balance.toString()));

         // Verify 4. check allowance
        let _allowance = await (usdt as MockERC20).allowance(bob.address, executionDelegate.address);
        if (!_allowance) {
            await (usdt as MockERC20).connect(bob).approve(executionDelegate.address, eth('1000000'));
        }
        
        // assert(_isApprovedForAll, '_allowance is false');

    });

    

    it('check the single order is valid', async () => {

        await updateBalances();
        tokenId = tokenId + 1;
        await testNFT.mint(alice.address, tokenId);

        const price = eth('100');

        sell = generateOrder(alice, { side: Side.Sell, tokenId, paymentToken: usdt.address, price });
        buy = generateOrder(bob, { side: Side.Buy, tokenId, paymentToken: usdt.address, price });

        sellInput = await sell.pack({ signer: alice });
        buyInput = await buy.pack();



        console.log('sellInput:', JSON.stringify(sellInput, null ,2 ));
        console.log('buyInput:', JSON.stringify(buyInput, null ,2 ));
        let tx =  exchange.connect(bob).execute(sellInput, buyInput);
        console.log('tx:', tx);
        const pendingTx: TransactionResponse = await tx;
        const receipt = await pendingTx.wait();

        assert(receipt.status == 1, 'receipt.status is false');

        let alice_usdt = await usdt.balanceOf(alice.address)
        let bob_usdt = await usdt.balanceOf(bob.address)
        let admin_usdt = await usdt.balanceOf(admin.address)

        assert(formatEther(alice_usdt.toString()) == '1097.0', 'alice_usdt is false');
        assert(formatEther(bob_usdt.toString()) == '900.0', 'bob_usdt is false');
        assert(formatEther(admin_usdt.toString()) == '3.0', 'admin_usdt is false');

    });

    it('check the bulk sell order is valid', async () => {
        
        await updateBalances();
        await testNFT.mint(alice.address, 5);
        await testNFT.mint(alice.address, 6);
        await testNFT.mint(alice.address, 7);
        await testNFT.mint(alice.address, 8);

        const price = eth('100');

        sell = generateOrder(alice, { side: Side.Sell, tokenId, paymentToken: usdt.address, price });
        buy = generateOrder(bob, { side: Side.Buy, tokenId, paymentToken: usdt.address, price });

        sellInput = await sell.pack({ signer: alice });
        buyInput = await buy.pack();

        // standardPolicyERC721

        let trader = new Trader(admin, exchange );
        for(let i = 25; i <= 25; i++ ) {

            let tokenId = i.toString()
    
            trader.addOrder({
                tokenId: tokenId,
                matchingPolicy: standardPolicyERC721.address, // '0x7A6E1b14DcE51275300C3e5617F6891c78bFCEfb', 
                collection: testNFT.address, // '0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3', 
                amount: 0,
                side: Side.Sell,
                salt: Date.now(),
                listingTime: '1691316213',  //2023-08-06 18:03:33
                expirationTime: '1699697013', //2023-11-11 18:03:33
                price: eth('1'),
                paymentToken: usdt.address, // '0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A', 
                extraParams: '0x'
            })
        }

        const nonce = await exchange.nonces(admin.address)
        console.log('nonce:', nonce);

        const blocknumber = (await hre.ethers.provider.getBlock('latest')).number;
        const _sell_orders = await trader.bulkSigs(blocknumber as number, nonce)
        






        
        
        // console.log('sellInput:', JSON.stringify(sellInput, null ,2 ));
        // console.log('buyInput:', JSON.stringify(buyInput, null ,2 ));
        // let tx =  exchange.connect(bob).execute(sellInput, buyInput);
        // console.log('tx:', tx);
        // const pendingTx: TransactionResponse = await tx;
        // const receipt = await pendingTx.wait();
        // assert(receipt.status == 1, 'receipt.status is false');
        // let alice_usdt = await usdt.balanceOf(alice.address)
        // let bob_usdt = await usdt.balanceOf(bob.address)
        // let admin_usdt = await usdt.balanceOf(admin.address)

        // assert(formatEther(alice_usdt.toString()) == '1097.0', 'alice_usdt is false');
        // assert(formatEther(bob_usdt.toString()) == '900.0', 'bob_usdt is false');
        // assert(formatEther(admin_usdt.toString()) == '3.0', 'admin_usdt is false');
    });
});