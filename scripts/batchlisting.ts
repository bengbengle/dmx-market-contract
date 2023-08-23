import { task } from 'hardhat/config';
import { getAddress, getContract } from './utils';
import { getNetwork, waitForTx } from './web3-utils';

import { Trader, eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils';

import { BigNumber, ethers } from 'ethers';
import { DMXExchange } from '../typechain-types';
import { formatEther } from 'ethers/lib/utils';

import { login, listing, get_nonce as get_login_nonce, sign } from './backendAPI'

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

task('batchlisting', 'batchlisting').setAction(async (_, hre) => {

    const [admin] = await hre.ethers.getSigners();
    const { exchange, matchingPolicies } = await getSetupExchange(hre);
    const matchingPolicy = matchingPolicies.standardPolicyERC721.address;

    // 登录
    const _login_nonce: string = await get_login_nonce(admin.address);
    const _login_sig = await admin.signMessage(_login_nonce);
    const _token = await login(admin.address, _login_sig);

    // 批量上架
    // const FROM_NFT_ID = 61; // 开始的 nft id
    // const END_NFT_ID = 91; // 结束的 nft id

    const FROM_NFT_ID = 402; // 开始的 nft id
    const END_NFT_ID = 500; // 结束的 nft id

    const USDT = '0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A'
    const NFT_ADDRESS = '0x651b9D1F1a2da81abB55515aFF90bb9d5dbd57d3'
    const NFT_SELL_PRICE =  eth('0.1');

    const _trader = new Trader(admin, exchange);
    for (let i = FROM_NFT_ID; i <= END_NFT_ID; i++) {
        
        let tokenId = i.toString()
        
        _trader.addOrder({
            tokenId: tokenId,
            collection: NFT_ADDRESS,
            price: NFT_SELL_PRICE,
            paymentToken: USDT,

            matchingPolicy: matchingPolicy,
            amount: 0,
            side: Side.Sell,
            salt: Date.now(),
            listingTime: '1691316213',  //2023-08-06 18:03:33
            expirationTime: '1699697013', //2023-11-11 18:03:33
            extraParams: '0x'
        })

    }

    // 签名
    const nonce = await exchange.nonces(admin.address)
    const blocknumber = (await hre.ethers.provider.getBlock('latest')).number;
    const _orders = await _trader.bulkSigs(blocknumber as number, nonce)

    _orders?.map(i => {
        let price: BigNumber = i?.order?.price;
        i.order.numberPrice = formatEther(price.toString())
    })
    const list_order = { sale_nft_new: _orders }

    // console.log('_orders:', JSON.stringify(list_order));

    // 批量上架
    await listing(_token, list_order)

});

