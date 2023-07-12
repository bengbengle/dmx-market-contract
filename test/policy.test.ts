// import { expect } from 'chai';

// import { Contract, BigNumber , providers, Wallet } from 'ethers';
// import type { CheckBalances, GenerateOrder, OrderParameters } from '../exchange';

// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { eth, Order, Side, setupTest } from '../exchange';
// import { setupExchange } from './utils/index';
// const tokenId = 1;

// let admin: SignerWithAddress;
// let alice: SignerWithAddress;
// let bob: SignerWithAddress;
// let thirdParty: SignerWithAddress;

// let exchange: Contract;
// let matchingPolicies: Record<string, Contract>;

// let generateOrder: GenerateOrder;

// let sell: OrderParameters;
// let buy: OrderParameters;

// describe('ERC721 Policy ', () => {
//   before(async () => {
//     ({ admin, alice, bob, exchange, matchingPolicies, generateOrder } = await setupExchange());
//   });
  
//   beforeEach(async () => {
//     sell = generateOrder(alice, { side: Side.Sell, tokenId }).parameters;
//     buy = generateOrder(bob, { side: Side.Buy, tokenId }).parameters;
//   });

//   describe('sell is maker', () => {
//     it('should match', async () => {

//       const { price, tokenId, amount } = await exchange.canMatchOrders(sell, buy);

//       expect(price).to.equal(sell.price);
//       expect(tokenId).to.equal(sell.tokenId);
//       expect(amount).to.equal(1);
//     });
//   });
// });