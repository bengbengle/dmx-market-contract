import { Wallet, Contract, BigNumber } from 'ethers';

import type { CheckBalances, GenerateOrder } from '../exchange';
import { eth, Order, Side } from '../exchange';
import { waitForTx } from '../scripts/web3-utils';

export function runMulticoinTests(init: any) {
  
  describe('MulticoinTests', function () {

    const INVERSE_BASIS_POINT = 10000;
    const price: BigNumber = eth('1');
    const feeRate = 300; // 3%

    let exchange: Contract;
    let executionDelegate: Contract;

    let admin: Wallet;
    let alice: Wallet;
    let bob: Wallet;
    let thirdParty: Wallet;

    let weth: Contract;
    let usdt: Contract;
    let usdc: Contract;
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

    };

    const balanceOf = async (coin: Contract, account: string) => {

        aliceBalance = await alice.getBalance();
        aliceBalanceWeth = await weth.balanceOf(alice.address);
        bobBalance = await bob.getBalance();
        bobBalanceWeth = await weth.balanceOf(bob.address);
        feeRecipientBalance = await admin.provider.getBalance(thirdParty.address);
        feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);
  
  
        console.log("aliceBalance: ", aliceBalance.toString());
        console.log("bobBalance: ", bobBalance.toString());
  
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

        generateOrder,
        checkBalances,
        executionDelegate

      } = await init());


      console.log('executionDelegate.address:', executionDelegate.address);

      // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
      let isApprovedContract = await executionDelegate.contracts(exchange.address);
      if(!isApprovedContract) {
          await executionDelegate.approveContract(exchange.address)
      }

      // Verify 2. 如果没有授权，需要授权
      let _isApprovedForAll = await mockERC721.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
      if(!_isApprovedForAll) {
          await mockERC721.connect(alice).setApprovalForAll(executionDelegate.address, true);
      }

    });

    beforeEach(async () => {

      await updateBalances();
      tokenId += 1;
      console.log('tokenId:', tokenId);
      await mockERC721.mint(alice.address, tokenId);

      fee = price.mul(feeRate).div(INVERSE_BASIS_POINT);
      priceMinusFee = price.sub(fee);

      sell = generateOrder(alice, { side: Side.Sell, tokenId});
      buy = generateOrder(bob, { side: Side.Buy, tokenId });
      
      sellInput = await sell.pack({ signer: alice });
      buyInput = await buy.pack();
     
    });

    it('check the single order is valid', async () => {


      let is_valid_sell = await exchange.validateOrderParameters(sell.parameters, sell.hash());
      let is_valid_buy = await exchange.validateOrderParameters(buy.parameters, buy.hash());
      console.log('is_valid_sell:', is_valid_sell);
      console.log('is_valid_buy:', is_valid_buy);
      
      
      
      console.log('sell.parameters:', sellInput);
      let is_valid_sig = await exchange.validateSignatures(sellInput, sell.hash())

      console.log('is_valid_sig:', is_valid_sig);

      const { price, tokenId, amount } = await exchange.canMatchOrders(sell.parameters, buy.parameters);

      console.log('price:', price.toString());
      console.log('tokenId:', tokenId.toString());
      console.log('amount:', amount.toString());
      

     
      
      const tx = await waitForTx(
        exchange.connect(bob).execute(sellInput, buyInput)
      );

      console.log('tx:', tx);
    });
    
   
  });
}