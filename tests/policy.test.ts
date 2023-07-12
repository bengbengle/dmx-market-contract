import { expect } from 'chai';
import { Wallet, Contract } from 'ethers';

import type { GenerateOrder } from '../exchange';
import { eth, OrderParameters } from '../exchange';
import { Order, Side, ZERO_ADDRESS } from '../exchange/utils';


export function runMatchingPolicyTests(setupTest: any) {
  return async () => {
    const tokenId = 1;

    let admin: Wallet;
    let alice: Wallet;
    let bob: Wallet;

    let exchange: Contract;
    let matchingPolicies: Record<string, Contract>;

    let generateOrder: GenerateOrder;

    let sell: OrderParameters;
    let buy: OrderParameters;

    before(async () => {
      ({ admin, alice, bob, exchange, matchingPolicies, generateOrder } = await setupTest());
    });

    describe('StandardPolicyERC721', () => {
      beforeEach(async () => {
        sell = generateOrder(alice, { side: Side.Sell, tokenId }).parameters;
        buy = generateOrder(bob, { side: Side.Buy, tokenId }).parameters;
      });

      describe('sell is maker', () => {

        it('should match', async () => {
          
          const { price, tokenId, amount } = await exchange.canMatchOrders(sell, buy);

          expect(price).to.equal(sell.price);
          expect(tokenId).to.equal(sell.tokenId);
          expect(amount).to.equal(1);
        });
      });
    });
  }
}
