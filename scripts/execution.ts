import { task } from 'hardhat/config';
import { getAddress, getContract } from './utils';
import { getNetwork, waitForTx } from './web3-utils';

import { Trader, eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils';


import { login, listing, get_nonce, sign } from './backendAPI'
import { BigNumber, ethers } from 'ethers';
import { DMXExchange } from '../typechain-types';
import { formatEther } from 'ethers/lib/utils';

const getSetupExchange = async (hre: any) => {
    const { network } = getNetwork(hre);
    console.log('network:', network);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);

    // 交易所 logic 合约
    const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });

    console.log('exchangeImpl:', exchangeImpl.address);

    const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
    console.log('DMXExchangeProxy:', DMXExchangeProxy);
    
    const exchange: DMXExchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);

    console.log('exchange:', exchange.address);

    const executionDelegate = await getContract(hre, 'ExecutionDelegate');
    const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');

    const testNFT = await getContract(hre, 'MockERC721');
    console.log('testNFT:', testNFT.address)
    const mockERC20 = await getContract(hre, 'MockERC20');
    console.log('standardPolicyERC721:', standardPolicyERC721.address)
    return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, testNFT, mockERC20, };
}


task("nft-listing", "sign and Maker a NFT Listing").setAction(async (_, hre) => {
    const [admin, alice, bob, thirdParty] = await hre.ethers.getSigners();
    const { exchange, executionDelegate, matchingPolicies, testNFT, mockERC20 } = await getSetupExchange(hre);
 
    const generateOrder = (account: any, overrides: any = {}): Order => {

        return new Order(
            account,
            {
                trader: account.address,
                side: Side.Buy,
                matchingPolicy: matchingPolicies.standardPolicyERC721.address,
                collection: testNFT.address,
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

    const token1 = 3;
    const token2 = 5;
    
    console.log('executionDelegate.address:', executionDelegate.address);

    // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
    let isApprovedContract = await executionDelegate.contracts(exchange.address);
    if(!isApprovedContract) {
        await executionDelegate.approveContract(exchange.address)
        isApprovedContract = await executionDelegate.contracts(exchange.address);
    }

    // Verify 2. 如果没有授权，需要授权
    let _isApprovedForAll = await testNFT.connect(alice).isApprovedForAll(alice.address, executionDelegate.address);
    if(!_isApprovedForAll) {
        await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
    }

    // Verify 3.
    // 默认已授权，可以直接转移
    await executionDelegate.connect(alice).grantApproval();
    
    // Verify 4.
    let _owner = await testNFT.ownerOf(token1);
    console.log('alice is owner? :', _owner == alice.address, _owner, alice.address);

    // if(_owner != alice.address) {
    //     console.error('the nft"s owner is not alice');
    //     return 
    // }

    const sell1 = generateOrder(alice, { side: Side.Sell, tokenId: token1});
    sell1.parameters.paymentToken = ZERO_ADDRESS;
    sell1.parameters.salt = 1;
    
    // eth 作为支付代币， 是否足够支付 
    const buy1 = generateOrder(admin, { side: Side.Buy, tokenId: token1 });
    buy1.parameters.paymentToken = ZERO_ADDRESS;
    sell1.parameters.salt = 1;

    const _blockNumber = (await hre.ethers.provider.getBlock('latest')).number;
    let sell_order_hash = await sell1.hash();
    console.log('sell_order_hash:', sell_order_hash);

    let sellInput1 = await sell1.pack();
    sellInput1.blockNumber = _blockNumber;

    const buyInput1 = await buy1.packNoSigs();
    buyInput1.blockNumber = _blockNumber;

    // const sellInput2 = await sell2.pack();
    // const buyInput2 = await buy2.packNoSigs();

    const _execution1 = { sell: sellInput1, buy: buyInput1 }
    // const _execution2 = { sell: sellInput2, buy: buyInput2 }

    // console.log('[_execution1]:', JSON.stringify([_execution1]) );

    // const _transaction = await exchange.connect(admin)
    //     .execute(sellInput1, buyInput1, { value: price, gasLimit: 4500000  });
    // exchange.connect(admin).execute(sellInput1, buyInput1, { value: price, gasLimit: 3e7  })
    // const tx = await waitForTx(_transaction);

    console.log('alice testNFT balance:', (await testNFT.balanceOf(alice.address)).toString());
    console.log('admin testNFT balance:', (await testNFT.balanceOf(admin.address)).toString());

    console.log('alice eth balance:', (await alice.getBalance()).toString());
    console.log('admin eth balance:', (await admin.getBalance()).toString());


    const _transaction = await exchange.connect(admin)
        .execute(sellInput1, buyInput1, { value: price.mul(2) });

    const tx = await waitForTx(_transaction);

    console.log('alice testNFT balance:', (await testNFT.balanceOf(alice.address)).toString());
    console.log('admin testNFT balance:', (await testNFT.balanceOf(admin.address)).toString());
    console.log('alice eth balance:', (await alice.getBalance()).toString());
    console.log('admin eth balance:', (await admin.getBalance()).toString());

});


task('buyall', 'listing all').setAction(async (_, hre) => {

    const USDT = '0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A'
    const NFT_Address = '0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3'
    
    // 0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3 nft
    // DMXExchangeProxy: 0x5de88f80dd2119c538254f7ec7b1f6b6987681b8
    // exchange: 0x5de88f80dd2119c538254f7ec7b1f6b6987681b8
    // testNFT: 0x05407752491F14198F405b871517321922F47C33
    // standardPolicyERC721: 0x173e22E31B1cF8fd4dBd82144521BBaEE34012Ed

    const [admin] = await hre.ethers.getSigners();
    const { exchange, matchingPolicies } = await getSetupExchange(hre);
    const matchingPolicy = matchingPolicies.standardPolicyERC721.address;
    const sell = {
        "order": {
            "trader": "0x5866AA518CF0bBe994CC09bb3c3Bae9290F77840",
            "side": 1,
            "matchingPolicy": "0x7A6E1b14DcE51275300C3e5617F6891c78bFCEfb",
            "collection": "0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3",
            "tokenId": "25",
            "amount": 0,
            "paymentToken": "0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A",
            "price": {
                "type": "BigNumber",
                "hex": "0x0de0b6b3a7640000"
            },
            "listingTime": "1691316213",
            "expirationTime": "1699697013",
            "fees": [
                {
                    "rate": 300,
                    "recipient": "0x158F323C98547A0E5998eDB5A5BC9F182158159B"
                }
            ],
            "salt": 1692103936616,
            "extraParams": "0x"
        },
        "r": "0xac846757ddcd5042f7f237c9d607643c744fc36d680c1eb8ffcec6cd869d28a1",
        "v": 27,
        "s": "0x1c4638661ee694df4334d27263d2721a7275e8dde0752f949b5127244833cf9e",
        "extraSignature": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
        "signatureVersion": 1,
        "blockNumber": 9522143
    }
    const buy = {
        "order": {
            "trader": "0x5866AA518CF0bBe994CC09bb3c3Bae9290F77840",
            "side": 0,
            "matchingPolicy": "0x7A6E1b14DcE51275300C3e5617F6891c78bFCEfb",
            "collection": "0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3",
            "tokenId": "25",
            "amount": 0,
            "paymentToken": "0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A",
            "price": {
                "type": "BigNumber",
                "hex": "0x0de0b6b3a7640000"
            },
            "listingTime": "1692018127",
            "expirationTime": "1692190927",
            "fees": [
                {
                    "rate": 300,
                    "recipient": "0x158F323C98547A0E5998eDB5A5BC9F182158159B"
                }
            ],
            "salt": 1692104527526,
            "extraParams": "0x"
        },
        "v": 27,
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "extraSignature": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
        "signatureVersion": 1,
        "blockNumber": 9522181
    }
    
    let tx = await exchange.execute(sell as any, buy as any)
    let ss = await tx.wait();
    console.log('ss:', ss);
    // let _nonce: string = await get_nonce(admin.address);

    // let _sig = await admin.signMessage(_nonce);

    // let _token = await login(admin.address, _sig);
    // console.log('_login_token:', _token);
    // const trader = new Trader(admin, exchange);
    
    // for(let i=25; i <= 25; i++) {

    //     let tokenId = i.toString()

    //     trader.addOrder({
    //         tokenId: tokenId,
    //         matchingPolicy: matchingPolicy, 
    //         collection: NFT_Address, 
    //         amount: 0,
    //         side: Side.Sell,
    //         salt: Date.now(),
    //         listingTime: '1691316213',  //2023-08-06 18:03:33
    //         expirationTime: '1699697013', //2023-11-11 18:03:33
    //         price: eth('1'),
    //         paymentToken: USDT, 
    //         extraParams: '0x'
    //     })
    // }
    

    
    // const nonce = await exchange.nonces(admin.address)
    // console.log('nonce:', nonce);

    // const blocknumber = (await hre.ethers.provider.getBlock('latest')).number;
    // const _orders = await trader.bulkSigs(blocknumber as number, nonce)
     
    
    // _orders?.map(i => {
    //     let price: BigNumber =  i?.order?.price;
    //     i.order.numberPrice = formatEther(price.toString()) //price.toString();
    // })

    // const list_order = {
    //     sale_nft_new: _orders
    // }
    // console.log('_orders:', JSON.stringify(list_order));

    // await listing(_token, list_order)

});




