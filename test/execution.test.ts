// import { expect } from 'chai';
// import { Wallet, Contract, BigNumber } from 'ethers';

// import type { CheckBalances, GenerateOrder } from '../exchange';
// import { eth, Order, Side, waitForTx, ZERO_ADDRESS } from '../exchange';
// // import { waitForTx } from '../scripts/web3-utils';
// import { setupExchange } from './utils/index';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { ethers } from 'hardhat';

// describe('ExecuteTests', function () {

//     const INVERSE_BASIS_POINT = 10000;
//     const price: BigNumber = eth('1');
//     const feeRate = 300; // 3%

//     let exchange: Contract;
//     let executionDelegate: Contract;

//     let admin: SignerWithAddress;
//     let alice: SignerWithAddress;
//     let bob: SignerWithAddress;
//     let thirdParty: SignerWithAddress;

//     let weth: Contract;
//     let usdt: Contract;
//     let usdc: Contract;
//     let testNFT: Contract;

//     let generateOrder: GenerateOrder;
//     let checkBalances: CheckBalances;

//     let sell: Order;
//     let sellInput: any;
//     let buy: Order;
//     let buyInput: any;
//     let otherOrders: Order[];
//     let fee: BigNumber;
//     let priceMinusFee: BigNumber;
//     let tokenId: number;

//     let aliceBalance: BigNumber;
//     let aliceBalanceWeth: BigNumber;
//     let bobBalance: BigNumber;
//     let bobBalanceWeth: BigNumber;
//     let feeRecipientBalance: BigNumber;
//     let feeRecipientBalanceWeth: BigNumber;

//     let adminBalance: BigNumber;
//     let adminBalanceWeth: BigNumber;

//     const updateBalances = async () => {
//         aliceBalance = await alice.getBalance();
//         aliceBalanceWeth = await weth.balanceOf(alice.address);
//         bobBalance = await bob.getBalance();
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
//             testNFT,
//             tokenId,
//             exchange,

//             generateOrder,
//             checkBalances,
//             executionDelegate

//         } = await setupExchange());


//         // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
//         let isApprovedContract = await executionDelegate.contracts(exchange.address);
//         if (!isApprovedContract) {
//             await executionDelegate.approveContract(exchange.address)
//         }

//         // Verify 2. 如果没有授权，需要授权
//         let _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
//         if (!_isApprovedForAll) {
//             await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
//         }
//     });

//     beforeEach(async () => {
//         await updateBalances();

//         // await testNFT.mint(alice.address, 1);
//         // await testNFT.mint(alice.address, 2);
//         // await testNFT.mint(alice.address, 3);

//         // await testNFT.mint(alice.address, 4);
//         // await testNFT.mint(alice.address, 5);
//         // await testNFT.mint(alice.address, 6);

//         // await testNFT.mint(alice.address, 7);
//         // await testNFT.mint(alice.address, 8);
//         // await testNFT.mint(alice.address, 9);

//         // await testNFT.mint(alice.address, 10);
//         // await testNFT.mint(alice.address, 11);
//         // await testNFT.mint(alice.address, 12);

//         fee = price.mul(feeRate).div(INVERSE_BASIS_POINT);
//         priceMinusFee = price.sub(fee);

//         sell = generateOrder(alice, { side: Side.Sell, tokenId });
//         buy = generateOrder(bob, { side: Side.Buy, tokenId });

//         // sellInput = await sell.pack({ signer: alice });
//         // buyInput = await buy.pack({ signer: bob });
//     });

//       it('check the single order is valid', async () => {
//         const tx = await waitForTx(
//           exchange.connect(bob).execute(sellInput, buyInput)
//         );
//       });

//       it('can cancel bulk listing', async () => {

//         otherOrders = [
//             generateOrder(alice, { salt: 1, Side: Side.Sell, tokenId: 1 }),
//             generateOrder(alice, { salt: 2, Side: Side.Sell, tokenId: 2 }),
//             generateOrder(alice, { salt: 3, Side: Side.Sell, tokenId: 3 }),
//         ];

//         console.log('sellInput:', sellInput);
//         console.log('buyInput:', buyInput);

//         const _blockNumber = (await ethers.provider.getBlock('latest')).number;
//         const seller_orders = await sell.bulkSigs(otherOrders, _blockNumber);

//         let buy = generateOrder(admin, { tokenId: 1, side: Side.Buy});

//         // let buy = generateOrder(bob, { tokenId: 1, side: Side.Buy});

//         let buyer_orders = await buy.bulkNoSigs(otherOrders, seller_orders, _blockNumber);


//         const _execution1 = { sell: seller_orders[0], buy: buyer_orders[0] }
//         // const _execution2 = { sell: seller_orders[1], buy: buyer_orders[1] }

//         console.log('otherOrders:', JSON.stringify(_execution1, null, 4))

//         await exchange.connect(bob).bulkExecute([_execution1], { value: price.mul(3), gasLimit: 3738000 });

//         // .bu([buy.parameters, ...otherOrders.map(_ => _.parameters)]);

//         // let alice_amount = await testNFT.balanceOf(alice.address);
//         // let bob_amount = await testNFT.balanceOf(bob.address);
//         // await exchange.connect(bob).execute(sellInput, buyInput);
//         // let alice_amount_after = await testNFT.balanceOf(alice.address);
//         // let bob_amount_after = await testNFT.balanceOf(bob.address);
//       });

//     //   it('can cancel multiple orders', async () => {
//     //     const buy2 = generateOrder(bob, { side: Side.Buy, tokenId });
//     //     const buyInput2 = await buy2.pack();

//     //     await exchange.connect(bob).cancelOrders([buy.parameters, buy2.parameters]);
//     //     await expect(exchange.execute(sellInput, buyInput)).to.be.revertedWith('Buy has invalid parameters');
//     //     await expect(exchange.execute(sellInput, buyInput2)).to.be.revertedWith('Buy has invalid parameters');
//     //   });

//     //   it('should succeed if reopened', async () => {
//     //     buyInput = await buy.packNoSigs();
//     //     const tx = await waitForTx(
//     //       exchange
//     //         .connect(bob)
//     //         .execute(sellInput, buyInput)
//     //     );
//     //     const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);

//     //     expect(await testNFT.ownerOf(tokenId)).to.be.equal(bob.address);


//     //     await checkBalances(

//     //       aliceBalance,
//     //       aliceBalanceWeth.add(priceMinusFee),

//     //       bobBalance.sub(gasFee),
//     //       bobBalanceWeth.sub(price),

//     //       feeRecipientBalance,
//     //       feeRecipientBalanceWeth.add(fee)
//     //     );
//     //   });

//     //   it('should bulkExecute succeed multiple orders', async () => {
//     //     await testNFT.mint(alice.address, 8);
//     //     await testNFT.mint(alice.address, 9);
//     //     const sell1 = generateOrder(alice, { side: Side.Sell, tokenId: 8});
//     //     const sell2 = generateOrder(alice, { side: Side.Sell, tokenId: 9 });

//     //     const buy1 = generateOrder(bob, { side: Side.Buy, tokenId: 8 });
//     //     const buy2 = generateOrder(bob, { side: Side.Buy, tokenId: 9 });

//     //     const sellInput1 = await sell1.pack();
//     //     const sellInput2 = await sell2.pack();

//     //     const buyInput1 = await buy1.packNoSigs();
//     //     const buyInput2 = await buy2.packNoSigs();

//     //     const _execution = { sell: sellInput1, buy: buyInput1 }
//     //     const _execution1 = { sell: sellInput2, buy: buyInput2 }

//     //     const tx = await waitForTx(
//     //       exchange.connect(bob).bulkExecute([_execution, _execution1])
//     //     );

//     //     const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);
//     //     expect(await testNFT.ownerOf(8)).to.be.equal(bob.address);
//     //     expect(await testNFT.ownerOf(9)).to.be.equal(bob.address);


//     //     await checkBalances(
//     //       aliceBalance,
//     //       aliceBalanceWeth.add(priceMinusFee).add(priceMinusFee),

//     //       bobBalance.sub(gasFee),
//     //       bobBalanceWeth.sub(price).sub(price),

//     //       feeRecipientBalance,
//     //       feeRecipientBalanceWeth.add(fee).add(fee)
//     //     );
//     //   });


//     it('should bulkExecute succeed with native eth call multiple orders', async () => {

//         const NativeETH = ZERO_ADDRESS


//         const gen_execution = async (tokenId: number) => {
//             const gen_sell_order = generateOrder(alice, { side: Side.Sell, tokenId: tokenId, paymentToken: NativeETH });

//             const gen_buy_order = generateOrder(admin, { side: Side.Buy, tokenId: tokenId, paymentToken: NativeETH });

//             const sellInput = await gen_sell_order.pack();

//             const buyInput = await gen_buy_order.packNoSigs();

//             const _execution = { sell: sellInput, buy: buyInput }

//             return _execution
//         }

//         const input = []
        
//         for (let i = 1; i <= 40; i++) {
//             await testNFT.mint(alice.address, i);

//             const _execution = await gen_execution(i)
//             input.push(_execution)
//         }

//         const tx = await waitForTx(
//             exchange.connect(admin).bulkExecute(input, { value: (price.mul(input.length)) })
//         );
        
//         // const tx2 = await waitForTx(
//         //   exchange
//         //     .connect(admin)
//         //     .bulkExecute([_execution2], { value: (price) })
//         // );

//         // const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);
//         // console.log('gasFee:', gasFee.toHexString())
//         // await checkBalances(
//         //   aliceBalance.add(priceMinusFee),
//         //   aliceBalanceWeth,

//         //   bobBalance,
//         //   bobBalanceWeth,

//         //   feeRecipientBalance.add(fee),
//         //   feeRecipientBalanceWeth,

//         //   adminBalance.sub(price).sub(gasFee),
//         //   adminBalanceWeth,

//         // );
//     });
// });