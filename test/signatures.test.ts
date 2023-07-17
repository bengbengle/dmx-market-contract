// import { expect } from "chai";
// import hre from 'hardhat';

// import { Contract, BigNumber, providers, Wallet } from 'ethers';
// import { setupExchange } from './utils/index';
// import type { CheckBalances, GenerateOrder } from '../exchange';
// import { eth, Order } from '../exchange';

// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { TransactionResponse } from "@ethersproject/providers";


// describe('signatures', () => {

//     let alice: SignerWithAddress;
//     let bob: SignerWithAddress;
//     let exchange: any;

//     let generateOrder: GenerateOrder;

//     let orderInput: any;
//     let order: Order;
//     let otherOrders: Order[];
//     let orderHash: string | string[];

//     before(async () => {
//         ({ alice, bob, exchange, generateOrder } = await setupExchange());
//     });

//     beforeEach(async () => {
//         order = generateOrder(alice);

//         otherOrders = [
//             generateOrder(alice, { salt: 1 }),
//             generateOrder(alice, { salt: 2 }),
//             generateOrder(alice, { salt: 3 }),
//         ];

//         orderHash = await order.hash();
//         orderInput = await order.pack();
//     });

//     describe('single', function () {
//         beforeEach(async () => {
//             // 过期时间 1 天
//             order.parameters.expirationTime = (Math.floor(new Date().getTime() / 1000) + 24 * 60 * 60).toString();

//             orderHash = await order.hash();
//             orderInput = await order.pack();

//         });
//         it('[single]send by trader no signatures', async () => {
//             orderInput = await order.packNoSigs();
//             expect(
//                 await exchange.connect(alice).validateSignatures(orderInput, orderHash),
//             ).to.equal(true);
//         });

//         it('[single]not send by trader valid signatures', async () => {
//             expect(
//                 await exchange.validateSignatures(orderInput, orderHash)
//             ).to.equal(true);
//         })

//     });

//     describe('bulk sign', function () {
        
//         beforeEach(async () => {
//             // 过期时间 1 天
//             order.parameters.expirationTime = (Math.floor(new Date().getTime() / 1000) + 24 * 60 * 60).toString();
//             orderHash = await order.bulkhash(otherOrders);
//             orderInput = await order.packBulk(otherOrders);
//         });

//         // 如果卖家最后执行交易,  可以不用签名     
//         it('[bulk]send by trader no signatures', async () => {

//             expect(
//                 await exchange.connect(alice).validateSignatures(orderInput, orderHash[0])
//             ).to.equal(true)
//         });

//         it('[bulk]not send by trader valid signatures', async () => {

//             expect(
//                 await exchange.validateSignatures(orderInput, orderHash[0])
//             ).to.equal(true);
//         });
//     });
// });
