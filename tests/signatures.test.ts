import { expect } from 'chai';
import { Wallet } from 'ethers';

import type { GenerateOrder } from './exchange';
import { eth, Order } from './exchange';

export function runSignatureTests(setupTest: any) {

  let alice: Wallet;
  let bob: Wallet;
  let exchange: any;

  let generateOrder: GenerateOrder;

  let orderInput: any;
  let order: Order;
  let otherOrders: Order[];
  let orderHash: string;

  before(async () => {
    ({ alice, bob, exchange, generateOrder } = await setupTest());
  });

  beforeEach(async () => {
    order = generateOrder(alice);

    otherOrders = [
      generateOrder(alice, { salt: 1 }),
      generateOrder(alice, { salt: 2 }),
      generateOrder(alice, { salt: 3 }),
    ];

    orderHash = await order.hash();
    orderInput = await order.pack();
  });

  describe('SignatureTests', function () {

    beforeEach(async () => {
      
      // 过期时间 1 天
      order.parameters.expirationTime = (Math.floor(new Date().getTime() / 1000) + 24 * 60 * 60 ).toString();
      
      orderHash = await order.hash();
      orderInput = await order.pack();
    });

    describe('single', function () {

      it('sent by trader no signatures', async () => {
        orderInput = await order.packNoSigs();
        expect(
          await exchange
            .connect(alice)
            .validateSignatures(orderInput, orderHash),
        ).to.equal(true);
      });

      it('not sent by trader valid signatures', async () => {
        expect(
          await exchange.validateSignatures(orderInput, orderHash)
        ).to.equal(true);
      })
    
    });

    describe('bulk sign', function () {

      // 如果 卖家最后执行交易,  可以不用签名     
      it('sent by trader no signatures', async () => {

        orderInput = await order.packNoSigs();

        expect(
        
          await exchange
            .connect(alice)
            .validateSignatures(orderInput, orderHash)

          ).to.equal(true)

      });
 
      it('not sent by trader valid signatures', async () => {

        orderInput = await order.packBulk(otherOrders);

        expect(
          
          await exchange.validateSignatures(orderInput, orderHash)

        ).to.equal(true);
      
      });
    });
  });
}
