import { expect } from 'chai';
import { Wallet, Contract, BigNumber } from 'ethers';

import type { CheckBalances, GenerateOrder } from './exchange';
import { eth, Order } from './exchange';
import { Side, ZERO_ADDRESS } from './exchange/utils';
import { waitForTx } from '../scripts/web3-utils';

export function runExecuteTests(setupTest: any) {
  
  return async () => {
    const INVERSE_BASIS_POINT = 10000;
    const price: BigNumber = eth('1');
    const feeRate = 300;

    let exchange: Contract;
    let executionDelegate: Contract;

    let admin: Wallet;
    let alice: Wallet;
    let bob: Wallet;
    let thirdParty: Wallet;

    let weth: Contract;
    let mockERC721: Contract;

    let generateOrder: GenerateOrder;
    let checkBalances: CheckBalances;

    let sell: Order;
    let sellInput: any;
    let buy: Order;
    let buyInput: any;
    let otherOrders: Order[];
    let fee: BigNumber;
    let priceMinusFee: BigNumber;
    let tokenId: number;

    let aliceBalance: BigNumber;
    let aliceBalanceWeth: BigNumber;
    let bobBalance: BigNumber;
    let bobBalanceWeth: BigNumber;
    let feeRecipientBalance: BigNumber;
    let feeRecipientBalanceWeth: BigNumber;

    const updateBalances = async () => {
      aliceBalance = await alice.getBalance();
      aliceBalanceWeth = await weth.balanceOf(alice.address);
      bobBalance = await bob.getBalance();
      bobBalanceWeth = await weth.balanceOf(bob.address);
      feeRecipientBalance = await admin.provider.getBalance(thirdParty.address);
      feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);
    };

    before(async () => {
      ({
        admin,
        alice,
        bob,
        thirdParty,
        weth,
        mockERC721,
        tokenId,
        exchange,
        executionDelegate,
        generateOrder,
        checkBalances,
      } = await setupTest());
    });

    beforeEach(async () => {
      await updateBalances();
      tokenId += 1;
      await mockERC721.mint(alice.address, tokenId);

      fee = price.mul(feeRate).div(INVERSE_BASIS_POINT);
      priceMinusFee = price.sub(fee);

      sell = generateOrder(alice, {
        side: Side.Sell,
        tokenId,
      });

      buy = generateOrder(bob, { side: Side.Buy, tokenId });

      otherOrders = [
        generateOrder(alice, { salt: 1 }),
        generateOrder(alice, { salt: 2 }),
        generateOrder(alice, { salt: 3 }),
      ];

      sellInput = await sell.pack();
      buyInput = await buy.pack();
    });

    it('can cancel order', async () => {
      await exchange.connect(bob).cancelOrder(buy.parameters);

      await expect(
          exchange.execute(sellInput, buyInput)
        ).to.be.revertedWith(
          'Buy has invalid parameters',
        );
    });
    
    it('can cancel bulk listing', async () => {
      sellInput = await sell.packBulk(otherOrders);
      await exchange.connect(alice).cancelOrder(sell.parameters);
      await expect(exchange.execute(sellInput, buyInput)).to.be.revertedWith(
        'Sell has invalid parameters',
      );
    });
    
    it('can cancel multiple orders', async () => {
      const buy2 = generateOrder(bob, { side: Side.Buy, tokenId });
      const buyInput2 = await buy2.pack();
      await exchange
        .connect(bob)
        .cancelOrders([buy.parameters, buy2.parameters]);
      await expect(exchange.execute(sellInput, buyInput)).to.be.revertedWith(
        'Buy has invalid parameters',
      );
      await expect(exchange.execute(sellInput, buyInput2)).to.be.revertedWith(
        'Buy has invalid parameters',
      );
    });
      
    it('should succeed if reopened', async () => {
      await exchange.open();

      buyInput = await buy.packNoSigs();
      const tx = await waitForTx(
        exchange.connect(bob).execute(sellInput, buyInput),
      );
      const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);

      expect(await mockERC721.ownerOf(tokenId)).to.be.equal(bob.address);

      await checkBalances(
        aliceBalance,
        aliceBalanceWeth.add(priceMinusFee),
        bobBalance.sub(gasFee),
        bobBalanceWeth.sub(price),
        feeRecipientBalance,
        feeRecipientBalanceWeth.add(fee),
      );

    });
  };
}
