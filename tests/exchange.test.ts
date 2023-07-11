import { expect } from 'chai';
import { BigNumber, Wallet, providers } from 'ethers';

import type { GenerateOrder, SetupExchangeFunction } from '../exchange';

import { eth, Order, setupTest, Side } from '../exchange';

type JsonRpcProvider = providers.JsonRpcProvider;

export function runExchangeTests(
  setupExchange: any,
) {
  
  describe('Exchange', function () {

    const feeRate = 300;

    const price: BigNumber = eth('1');

    let seller_alice: any;
    let exchange: any;
    let provider: JsonRpcProvider;
    let generateOrder: GenerateOrder;

    describe('validateOrderParameters', function () {
      let order: Order;
      let orderHash: string;

      before(async () => {
        ({ alice: seller_alice, exchange, generateOrder, provider} = await setupTest({price, feeRate, setupExchange}));
      });

      beforeEach(async () => {
        order = generateOrder(seller_alice, { side: Side.Sell });
        orderHash = await order.hash();
      });
      
      it('cancelled or filled', async () => {
        
        expect(
          await exchange.validateOrderParameters(order.parameters, orderHash),
        ).to.equal(true);
      });
    });
 
  });
}
