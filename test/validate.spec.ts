// import { expect } from "chai";
// import { Wallet, providers } from 'ethers';
// import { Order, Side } from './utils/constants';
// // import { setupTest } from '../exchange';

// import type { GenerateOrder } from '../exchange';
// import { setupExchange } from './utils/index';

// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// type JsonRpcProvider = providers.JsonRpcProvider;

// describe(`DMXExechange ValidateCheck`, function () {

//   let alice: SignerWithAddress;
//   let bob: SignerWithAddress;
//   let exchange: any;
//   let provider: JsonRpcProvider;
//   let generateOrder: GenerateOrder;

//   describe('validate', function () {
//     let order: Order;
//     let orderHash: string;

//     before(async () => {
//       ({ alice, bob, exchange, generateOrder } = await setupExchange());
//     });

//     beforeEach(async () => {
//       order = generateOrder(alice, { side: Side.Sell });
//       orderHash = await order.hash();
//     });

//     it('cancelled or filled', async () => {
//       expect(
//         await exchange.validateOrderParameters(order.parameters, orderHash)
//       ).to.equal(true);
//     });

//   });
// });


