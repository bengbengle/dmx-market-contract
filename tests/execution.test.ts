import { expect } from 'chai';
import { Wallet, Contract, BigNumber } from 'ethers';

import type { CheckBalances, GenerateOrder, SetupExchangeFunction } from '../exchange';
import { eth, Order, setupTest, Side, ZERO_ADDRESS } from '../exchange';
import { waitForTx } from '../scripts/web3-utils';

export function runExecuteTests(setupTest: any) {
  
  describe('ExecuteTests', function () {

    const INVERSE_BASIS_POINT = 10000;
    const price: BigNumber = eth('1');
    const feeRate = 300; // 3%

    let exchange: Contract;
    // let executionDelegate: Contract;

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

    let adminBalance: BigNumber;
    let adminBalanceWeth: BigNumber;

    const updateBalances = async () => {
     

      aliceBalance = await alice.getBalance();
      aliceBalanceWeth = await weth.balanceOf(alice.address);
      bobBalance = await bob.getBalance();
      bobBalanceWeth = await weth.balanceOf(bob.address);
      feeRecipientBalance = await admin.provider.getBalance(thirdParty.address);
      feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);


      console.log("aliceBalance: ", aliceBalance.toString());
      console.log("bobBalance: ", bobBalance.toString());
      // console.log("adminBalance: ", adminBalance.toString());

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
        // executionDelegate,
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

      sell = generateOrder(alice, { side: Side.Sell, tokenId});
      buy = generateOrder(admin, { side: Side.Buy, tokenId });
      
      // otherOrders = [
      //   generateOrder(alice, { salt: 1 }),
      //   generateOrder(alice, { salt: 2 }),
      //   generateOrder(alice, { salt: 3 }),
      // ];

      sellInput = await sell.pack();
      buyInput = await buy.pack();

    });

    // it('can cancel order', async () => {
    //   await exchange.connect(bob).cancelOrder(buy.parameters);

    //   await expect(
    //       exchange.execute(sellInput, buyInput)
    //     ).to.be.revertedWith(
    //       'Buy has invalid parameters',
    //     );
    // });
    
    // it('can cancel bulk listing', async () => {
    //   sellInput = await sell.packBulk(otherOrders);
        
    //   let alice_amount = await mockERC721.balanceOf(alice.address);
    //   let bob_amount = await mockERC721.balanceOf(bob.address);
 
    //   await exchange.connect(bob).execute(sellInput, buyInput);
      
    //   let alice_amount_after = await mockERC721.balanceOf(alice.address);
    //   let bob_amount_after = await mockERC721.balanceOf(bob.address);
    // });
    
    // it('can cancel multiple orders', async () => {
    //   const buy2 = generateOrder(bob, { side: Side.Buy, tokenId });
    //   const buyInput2 = await buy2.pack();

    //   await exchange
    //     .connect(bob)
    //     .cancelOrders([buy.parameters, buy2.parameters]);
    //     await expect(exchange.execute(sellInput, buyInput)).to.be.revertedWith('Buy has invalid parameters');
      
      
    //   await expect(exchange.execute(sellInput, buyInput2)).to.be.revertedWith(
    //     'Buy has invalid parameters',
    //   );

    // });
    
    // it('should succeed if reopened', async () => {
    //   buyInput = await buy.packNoSigs();
    //   const tx = await waitForTx(
    //     exchange
    //       .connect(bob)
    //       .execute(sellInput, buyInput)
    //   );
    //   const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);

    //   expect(await mockERC721.ownerOf(tokenId)).to.be.equal(bob.address);
      
      
    //   await checkBalances(

    //     aliceBalance,
    //     aliceBalanceWeth.add(priceMinusFee),

    //     bobBalance.sub(gasFee),
    //     bobBalanceWeth.sub(price),
        
    //     feeRecipientBalance,
    //     feeRecipientBalanceWeth.add(fee)

    //   );

    // });

    // it('should bulkExecute succeed multiple orders', async () => {
    //   await mockERC721.mint(alice.address, 8);
    //   await mockERC721.mint(alice.address, 9);
    //   const sell1 = generateOrder(alice, { side: Side.Sell, tokenId: 8});
    //   const sell2 = generateOrder(alice, { side: Side.Sell, tokenId: 9 });

    //   const buy1 = generateOrder(bob, { side: Side.Buy, tokenId: 8 });
    //   const buy2 = generateOrder(bob, { side: Side.Buy, tokenId: 9 });


    //   const sellInput1 = await sell1.pack();
    //   const sellInput2 = await sell2.pack();
      
    //   const buyInput1 = await buy1.packNoSigs();
    //   const buyInput2 = await buy2.packNoSigs();

    //   // console.log('buyInput1:', buyInput1);
    //   // console.log('buyInput2:', buyInput2);

    //   const _execution = { sell: sellInput1, buy: buyInput1 }
    //   const _execution1 = { sell: sellInput2, buy: buyInput2 }
   
    //   const tx = await waitForTx(
    //     exchange
    //       .connect(bob)
    //       .bulkExecute([_execution, _execution1])
    //   );
      
    //   const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);
    //   expect(await mockERC721.ownerOf(8)).to.be.equal(bob.address);
    //   expect(await mockERC721.ownerOf(9)).to.be.equal(bob.address);
       
      
    //   await checkBalances(
    //     aliceBalance,
    //     aliceBalanceWeth.add(priceMinusFee).add(priceMinusFee),

    //     bobBalance.sub(gasFee),
    //     bobBalanceWeth.sub(price).sub(price),
        
    //     feeRecipientBalance,
    //     feeRecipientBalanceWeth.add(fee).add(fee)
    //   );
    // });


    it('should bulkExecute succeed with native eth call multiple orders', async () => {

      const token1 = 10;
      const token2 = 11;
      
      await mockERC721.mint(alice.address, token1);
      await mockERC721.mint(alice.address, token2);

      const sell1 = generateOrder(alice, { side: Side.Sell, tokenId: token1});
      const sell2 = generateOrder(alice, { side: Side.Sell, tokenId: token2 });

      sell1.parameters.paymentToken = ZERO_ADDRESS;
      sell2.parameters.paymentToken = ZERO_ADDRESS;


      const buy1 = generateOrder(admin, { side: Side.Buy, tokenId: token1 });
      const buy2 = generateOrder(admin, { side: Side.Buy, tokenId: token2 });

      buy1.parameters.paymentToken = ZERO_ADDRESS;
      buy2.parameters.paymentToken = ZERO_ADDRESS;

      const sellInput1 = await sell1.pack();
      const sellInput2 = await sell2.pack();

      const buyInput1 = await buy1.packNoSigs();
      const buyInput2 = await buy2.packNoSigs();

      // const _execution1 = { sell: sellInput1, buy: buyInput1 }

      const _execution2 = { sell: sellInput2, buy: buyInput2 }

      adminBalance = await admin.getBalance();
      adminBalanceWeth = await weth.balanceOf(admin.address);
      
      const tx = await waitForTx(
        exchange
          .connect(admin)
          .bulkExecute([_execution2], { value: (price) })
      );

      const tx2 = await waitForTx(
        exchange
          .connect(admin)
          .bulkExecute([_execution2], { value: (price) })
      );
      
      console.log('tx:', tx);
      console.log('tx2:', tx2);
      
      const gasFee = tx.gasUsed.mul(tx.effectiveGasPrice);
       
      console.log('fee:', fee.toString());
      console.log('gasFee:', gasFee.toString());
      console.log('feeRate:', (await exchange.feeRate()).toString());
      
      await checkBalances(
        aliceBalance.add(priceMinusFee),
        aliceBalanceWeth,

        bobBalance,
        bobBalanceWeth,
        
        feeRecipientBalance.add(fee),
        feeRecipientBalanceWeth,

        adminBalance.sub(price).sub(gasFee),
        adminBalanceWeth,

      );
    });

  });
}