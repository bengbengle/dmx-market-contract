import { task } from 'hardhat/config';
import { getAddress, getContract } from './utils';
import { getNetwork, waitForTx } from './web3-utils';

import { eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils_test';



task("nft-listing", "sign and Maker a NFT Listing").setAction(async (_, hre) => {
    const [admin, alice, bob, thirdParty] = await hre.ethers.getSigners();

    // const { network } = getNetwork(hre);

    const getSetupExchange = async (hre: any) => {
        
        const { network } = getNetwork(hre);
    
        const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
    
        // 交易所 logic 合约
        const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });
    
        console.log('exchangeImpl:', exchangeImpl.address);
    
        const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
    
        const exchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
    
        const executionDelegate = await getContract(hre, 'ExecutionDelegate');
        const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');
    
        const mockERC721 = await getContract(hre, 'MockERC721');
        const mockERC20 = await getContract(hre, 'MockERC20');
    
        return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, mockERC721, mockERC20, };
    }

    const { exchange, executionDelegate, matchingPolicies, mockERC721, mockERC20 } = await getSetupExchange(hre);

    // console.log('exchange.executionDelegate :', await exchange.executionDelegate() );
    // console.log('exchange.weth :', await exchange.weth() );
    // console.log('exchange.feeRecipient:', await exchange.feeRecipient() );
    // console.log('exchange.policyManager:', await exchange.policyManager() );
    
    const generateOrder = (account: any, overrides: any = {}): Order => {

        return new Order(
            account,
            {
                trader: account.address,
                side: Side.Buy,
                matchingPolicy: matchingPolicies.standardPolicyERC721.address,
                collection: mockERC721.address,
                tokenId: 1,
                amount: 0,
                paymentToken: ZERO_ADDRESS,
                price,
                listingTime: '0',
                expirationTime: '0',
                fees: [
                    {
                        rate: feeRate,
                        recipient: thirdParty.address,
                    },
                ],
                salt: 0,
                extraParams: '0x',
                ...overrides,
            },
            exchange,
        );
    };

    const price = eth('0.00001');
    const feeRate = 300;

    const token1 = 4;
    const token2 = 5;
    
    console.log('executionDelegate.address:', executionDelegate.address);

    // await 
    // await mockERC721.connect(alice).setApprovalForAll(executionDelegate.address, true);
    // await mockERC721.connect(admin).setApprovalForAll(executionDelegate.address, true);
    
    await executionDelegate.connect(alice).grantApproval();
    
    const sell1 = generateOrder(alice, { side: Side.Sell, tokenId: token1});
    sell1.parameters.paymentToken = ZERO_ADDRESS;
   
    const buy1 = generateOrder(admin, { side: Side.Buy, tokenId: token1 });
    buy1.parameters.paymentToken = ZERO_ADDRESS;

    // const sell2 = generateOrder(alice, { side: Side.Sell, tokenId: token2 });
    // sell2.parameters.paymentToken = ZERO_ADDRESS;
    // const buy2 = generateOrder(admin, { side: Side.Buy, tokenId: token2 });
    // buy2.parameters.paymentToken = ZERO_ADDRESS;
    const _blockNumber = (await hre.ethers.provider.getBlock('latest')).number;
    let sellInput1 = await sell1.pack();
    sellInput1.blockNumber = _blockNumber;

    const buyInput1 = await buy1.packNoSigs();
    buyInput1.blockNumber = _blockNumber;

    // const sellInput2 = await sell2.pack();
    // const buyInput2 = await buy2.packNoSigs();

    // const _execution1 = { sell: sellInput1, buy: buyInput1 }
    // const _execution2 = { sell: sellInput2, buy: buyInput2 }

    // console.log('[_execution1]:', JSON.stringify([_execution1]) );

    console.log('sellInput1:', JSON.stringify(sellInput1) );
    console.log('buyInput1:', JSON.stringify(buyInput1) );

    // const _transaction = await exchange.connect(admin)
    //     .execute(sellInput1, buyInput1, { value: price, gasLimit: 4500000  });

    // console.log('_transaction:', _transaction);

    // exchange
    //         .connect(admin)
    //         .execute(sellInput1, buyInput1, { value: price, gasLimit: 3e7  })
    // const tx = await waitForTx(_transaction);

    // const tx = await waitForTx(
    //     exchange
    //         .connect(admin)
    //         .bulkExecute([_execution1], { value: price  })


    console.log('alice mockERC721 balance:', (await mockERC721.balanceOf(alice.address)).toString());

    console.log('admin mockERC721 balance:', (await mockERC721.balanceOf(admin.address)).toString());

});

