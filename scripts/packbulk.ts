import { task } from 'hardhat/config';
import { getAddress, getContract } from './utils';
import { getNetwork, waitForTx } from './web3-utils';

import { eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils';


task("packbulk", "can sing packBulk sell order and execute").setAction(async (_, hre) => {

    const [admin, alice, bob, thirdParty] = await hre.ethers.getSigners();

    const getSetupExchange = async (hre: any) => {
        
        const { network } = getNetwork(hre);
        console.log('network:', network);
    
        const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
    
        // 交易所 logic 合约
        const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });
    
        console.log('exchangeImpl:', exchangeImpl.address);
    
        const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
        console.log('DMXExchangeProxy:', DMXExchangeProxy);
        
        const exchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
    
        const executionDelegate = await getContract(hre, 'ExecutionDelegate');
        const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');
    
        const mockERC721 = await getContract(hre, 'MockERC721');
        const mockERC20 = await getContract(hre, 'MockERC20');
    
        return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, mockERC721, mockERC20, };
    }

    const { exchange, executionDelegate, matchingPolicies, mockERC721, mockERC20 } = await getSetupExchange(hre);

    const generateOrder = (account: any, overrides: any = {}): Order => {

        let params = {
            trader: account.address,
            side: Side.Sell,
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
        };

        return new Order(account, params, exchange);
    };

    const price = eth('0.00001');
    const feeRate = 300;

    const token1 = 10;
    const token2 = 12;
    const token3 = 12;

    let sell = generateOrder(alice, { tokenId: token1, side: Side.Sell});

    const otherOrders = [
        generateOrder(alice, { tokenId: token1, Side: Side.Sell }),
        generateOrder(alice, { tokenId: token2, Side: Side.Sell }),
    ];

    const _blockNumber = (await hre.ethers.provider.getBlock('latest')).number;
    const seller_orders = await sell.bulkSigs(otherOrders, _blockNumber);
    
    const seller_orders_hashes = await sell.bulkhash(otherOrders, _blockNumber);

    console.log('seller_orders:', JSON.stringify(seller_orders, null, 4) );
    console.log('seller_orders_hashes:', JSON.stringify(seller_orders_hashes, null, 4));

    let buy = generateOrder(admin, { tokenId: token1, side: Side.Buy});
    
    let buyer_orders = await buy.bulkNoSigs(otherOrders, seller_orders, _blockNumber);

    console.log('alice mockERC721 balance:', (await mockERC721.balanceOf(alice.address)).toString());
    console.log('admin mockERC721 balance:', (await mockERC721.balanceOf(admin.address)).toString());

    console.log('alice eth balance:', (await alice.getBalance()).toString());
    console.log('admin eth balance:', (await admin.getBalance()).toString());

    const _execution1 = { sell: seller_orders[0], buy: buyer_orders[0] }
    const _execution2 = { sell: seller_orders[1], buy: buyer_orders[1] }

    await waitForTx(
        await exchange
            .connect(admin)
            .bulkExecute([_execution1, _execution2], { value: price.mul(3), gasLimit: 3738000 })
    )

    // await waitForTx(
    //     await exchange
    //         .connect(admin)
    //         .execute(seller_orders[0], buyer_orders[0], { value: price.mul(2), gasLimit: 3738000 })
    // )
    console.log('alice mockERC721 balance:', (await mockERC721.balanceOf(alice.address)).toString());
    console.log('admin mockERC721 balance:', (await mockERC721.balanceOf(admin.address)).toString());
    console.log('alice eth balance:', (await alice.getBalance()).toString());
    console.log('admin eth balance:', (await admin.getBalance()).toString());
   
});
