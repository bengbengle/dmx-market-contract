

// import { assert, expect } from "chai";
// import hre from 'hardhat';

// import { Contract, BigNumber, providers, Wallet } from 'ethers';
// import { setupExchange } from './utils/index';
// import type { CheckBalances, GenerateOrder } from '../exchange';
// import { eth, Order, Side, setupTest, Trader } from '../exchange';

// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { TransactionResponse } from "@ethersproject/providers";
// import { formatEther } from "ethers/lib/utils";
// import { DMXExchange, MockERC20, StandardPolicyERC721, TetherToken } from "../typechain-types";
// import { ExecutionStruct } from "../typechain-types/contracts/DMXExchange";

// const { ethers } = hre;

// describe('MultiCoinTests', function () {

//     let exchange: DMXExchange;
//     let executionDelegate: Contract;

//     let admin: SignerWithAddress;
//     let alice: SignerWithAddress;
//     let bob: SignerWithAddress;

//     let weth: Contract;
//     let usdt: TetherToken;
//     let testNFT: Contract;

//     let generateOrder: GenerateOrder;

//     let sell: Order;
//     let sellInput: any;
//     let buy: Order;
//     let buyInput: any;
//     let tokenId: number = 0;
//     let standardPolicyERC721: StandardPolicyERC721;


//     before(async () => {
//         ({
//             admin,
//             alice,
//             bob,
//             weth,
//             testNFT: testNFT,
//             exchange,
//             generateOrder,
//             executionDelegate,
//             matchingPolicies: { standardPolicyERC721 },
//             usdt,
//         } = await setupExchange());


//         // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
//         let isApprovedContract = await executionDelegate.contracts(exchange.address);
//         if (!isApprovedContract) {
//             await executionDelegate.approveContract(exchange.address)
//             isApprovedContract = await executionDelegate.contracts(exchange.address);
//         }
//         assert(isApprovedContract, 'isApprovedContract is false');

//         // Verify 2. 如果没有授权，需要授权
//         let _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
//         if (!_isApprovedForAll) {
//             await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
//         }
//         // assert(_isApprovedForAll, '_isApprovedForAll is false');


//         // Verify 3. check balance
//         let _balance = await usdt.balanceOf(bob.address);
//         // console.log('bob usdt _balance:', formatEther(_balance.toString()));

//         // Verify 4. check allowance
//         let _allowance = await usdt.allowance(bob.address, executionDelegate.address);
//         if (!_allowance) {
//             await usdt.connect(bob).approve(executionDelegate.address, eth('1000000'));
//         }

//         // assert(_isApprovedForAll, '_allowance is false');

//     });



//     it('check the single order is valid, sell, buy', async () => {

//         tokenId = tokenId + 1;
//         await testNFT.mint(alice.address, tokenId);

//         const price = eth('100');

//         sell = generateOrder(alice, { side: Side.Sell, tokenId, paymentToken: usdt.address, price });

//         buy = generateOrder(bob, { 
//             side: Side.Buy,
//             tokenId,
//             paymentToken: usdt.address,
//             price
//         });

//         sellInput = await sell.pack({ signer: alice });
        
//         buyInput = await buy.pack();

//         await usdt.connect(alice).transfer(bob.address, 500000);  
//         let bob_balance = await usdt.balanceOf(bob.address);

//         console.log('price:', bob_balance.toString());

//         console.log('price:', price.toString());

//         let _tx = await usdt.connect(bob).approve(executionDelegate.address, price);

//         await _tx.wait();

//         console.log('sellInput:1111');

        
//         let tx =  exchange.connect(bob).execute(sellInput, buyInput);

//         const pendingTx: TransactionResponse = await tx;
//         const receipt = await pendingTx.wait();

//         assert(receipt.status == 1, 'receipt.status is false');

//         let alice_usdt = await usdt.balanceOf(alice.address)
//         let bob_usdt = await usdt.balanceOf(bob.address)
//         let admin_usdt = await usdt.balanceOf(admin.address)

//         assert(formatEther(alice_usdt.toString()) == '1097.0', 'alice_usdt is false');
//         assert(formatEther(bob_usdt.toString()) == '900.0', 'bob_usdt is false');
//         assert(formatEther(admin_usdt.toString()) == '3.0', 'admin_usdt is false');

//         console.log('bob:', bob.address)

//         let ownerOf = await testNFT.connect(bob).ownerOf(tokenId)
//         console.log('ownerOf:', ownerOf)
        
//     });


// });