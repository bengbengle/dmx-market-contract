// import { expect } from 'chai';
// import { Wallet, Contract, BigNumber } from 'ethers';

// import type { CheckBalances, GenerateOrder } from '../exchange';
// import { eth, Order, Side, waitForTx, ZERO_ADDRESS } from '../exchange';
// import { setupExchange } from './utils/index';

// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { ethers } from 'hardhat';

// describe('Bulk_Execute_Tests', function () {

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
//     // let checkBalances: CheckBalances;

//     let sell: Order;
//     // let sellInput: any;
//     let buy: Order;
//     // let buyInput: any;
//     // let otherOrders: Order[];
//     let fee: BigNumber;
//     let tokenId: number;
//     let priceMinusFee: BigNumber;

//     // let aliceBalance: BigNumber;
//     // let aliceBalanceWeth: BigNumber;
//     // let bobBalance: BigNumber;
//     // let bobBalanceWeth: BigNumber;
//     // let feeRecipientBalance: BigNumber;
//     // let feeRecipientBalanceWeth: BigNumber;

//     // let adminBalance: BigNumber;
//     // let adminBalanceWeth: BigNumber;

//     // const updateBalances = async () => {
//     //     aliceBalance = await alice.getBalance();
//     //     aliceBalanceWeth = await weth.balanceOf(alice.address);
//     //     bobBalance = await bob.getBalance();
//     //     bobBalanceWeth = await weth.balanceOf(bob.address);
//     //     feeRecipientBalance = await ethers.provider.getBalance(thirdParty.address);
//     //     feeRecipientBalanceWeth = await weth.balanceOf(thirdParty.address);
//     // };

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
//             // checkBalances,
//             executionDelegate

//         } = await setupExchange());


//         // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
//         let isApprovedContract = await executionDelegate.contracts(exchange.address);
//         if (!isApprovedContract) {
//             await executionDelegate.approveContract(exchange.address)
//         }

//         // Verify 2. 如果没有授权，需要授权
//         let _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
//         console.log('_isApprovedForAll:', _isApprovedForAll)
    
//         if (!_isApprovedForAll) {
//             await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
//         }
        
//         _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
//         console.log('_isApprovedForAll2:', _isApprovedForAll)
        
//     });

//     beforeEach(async () => {
//         // await updateBalances();
 
//         fee = price.mul(feeRate).div(INVERSE_BASIS_POINT);
//         priceMinusFee = price.sub(fee);

//         sell = generateOrder(alice, { side: Side.Sell, tokenId });
//         buy = generateOrder(bob, { side: Side.Buy, tokenId });
//     }); 


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
//         console.log(tx.status)
//     });
// });