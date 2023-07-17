

// import { assert, expect } from "chai";
// import hre from 'hardhat';

// import { Contract, BigNumber, providers, Wallet } from 'ethers';
// import { setupExchange } from './utils/index';
// import type { CheckBalances, GenerateOrder } from '../exchange';
// import { eth, Order, Side, setupTest } from '../exchange';

// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { TransactionResponse } from "@ethersproject/providers";
// import { formatEther } from "ethers/lib/utils";
// import { MockERC20 } from "../typechain-types";


// const { ethers } = hre;
// describe('MultiCoinTests', function () {

//     let exchange: Contract;
//     let executionDelegate: Contract;
//     let admin: SignerWithAddress;
//     let alice: SignerWithAddress;
//     let bob: SignerWithAddress;
//     let thirdParty: SignerWithAddress;

//     let weth: Contract;
//     let usdt: Contract;
//     let testNFT: Contract;

//     let generateOrder: GenerateOrder;

//     let sell: Order;
//     let sellInput: any;
//     let buy: Order;
//     let buyInput: any;
//     let tokenId: number = 0;

//     let aliceBalance: BigNumber;
//     let aliceUsdtBalance: BigNumber;
//     let aliceBalanceWeth: BigNumber;
//     let bobBalance: BigNumber;
//     let bobUsdtBalance: BigNumber;
//     let bobBalanceWeth: BigNumber;
//     let feeRecipientBalance: BigNumber;
//     let feeRecipientBalanceWeth: BigNumber;

//     const updateBalances = async () => {
//         aliceBalance = await alice.getBalance();
//         aliceUsdtBalance = await usdt.balanceOf(alice.address);
//         aliceBalanceWeth = await weth.balanceOf(alice.address);
//         bobBalance = await bob.getBalance();
//         bobUsdtBalance = await await usdt.balanceOf(bob.address);
//         bobBalanceWeth = await weth.balanceOf(bob.address);
//         feeRecipientBalance = await ethers.provider.getBalance(thirdParty.address);
//         feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);
//     };

//     before(async () => {
//         ({
//             admin,
//             alice,
//             bob,
//             thirdParty,
//             weth,
//             testNFT: testNFT,
//             exchange,
//             generateOrder,
//             executionDelegate,
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
//         assert(_isApprovedForAll, '_isApprovedForAll is false');
 
//     });

//     beforeEach(async () => {

//         await updateBalances();
//         tokenId = tokenId + 1;
//         await testNFT.mint(alice.address, tokenId);

//         const price = eth('0.01');
//         const ETH = '0x0000000000000000000000000000000000000000';

//         sell = generateOrder(alice, { side: Side.Sell, tokenId, paymentToken: ETH, price });
//         buy = generateOrder(bob, { side: Side.Buy, tokenId, paymentToken: ETH, price });

//         assert(tokenId == 1, 'tokenId is false')
//         sellInput = await sell.pack({ signer: alice });
//         buyInput = await buy.pack();

//     });

//     it('check the single order is valid', async () => {
//         var _bobBalance = await bob.getBalance();
//         console.log('_bobBalance:', _bobBalance.toString())
//         let tx = exchange.connect(bob).execute(sellInput, buyInput, { value: eth('0.01') } )
//         const pendingTx: TransactionResponse = await tx;
//         const receipt = await pendingTx.wait();

//         assert(receipt.status == 1, 'receipt.status is false');

//     });
// });