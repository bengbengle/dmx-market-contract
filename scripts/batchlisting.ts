import { task } from 'hardhat/config';
import { getAddress, getContract, getNetwork } from './web3-utils';

import { Trader, eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils';

import { BigNumber, ethers } from 'ethers';
import { DMXExchange } from '../typechain-types';
import { formatEther } from 'ethers/lib/utils';

import { login, listing, get_nonce as get_login_nonce } from './backendAPI'

const getSetupExchange = async (hre: any) => {
    const { network } = getNetwork(hre);
    console.log('network:', network);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);

    // 交易所 logic 合约
    const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });
    const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
    const exchange: DMXExchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
    const executionDelegate = await getContract(hre, 'ExecutionDelegate');
    const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');

    const testNFT = await getContract(hre, 'MockERC721');
    const mockERC20 = await getContract(hre, 'MockERC20');
    return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, testNFT, mockERC20 };
    
}


// 开始的 NFT ID
const FROM_NFT_ID = 1; 
// 结束的 NFT ID
const END_NFT_ID = 3; 

// testnet: 0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' 

//0x966ae2552B359fC73743442F6Ac7BD0253F303ff 
const NFT_ADDRESS = '0xc7aA778906e8DEAf9C0F7ADa99f73bDB81242044'

const NFT_SELL_PRICE =  eth('2998');

// 版税接收者
// const FEE_Recipient = '0x158F323C98547A0E5998eDB5A5BC9F182158159B'
const FEE_Recipient = '0x8DC6315758468A222072DFFc68DFB8b0dF8D839A'

const FEE_Rate = 300

task('batchlisting', 'batchlisting').setAction(async (_, hre) => {

    const [ _admin, seller ] = await hre.ethers.getSigners();
    const { exchange, matchingPolicies, executionDelegate, testNFT } = await getSetupExchange(hre);
    const matchingPolicy = matchingPolicies.standardPolicyERC721.address;

    const _login_nonce: string = await get_login_nonce(seller.address);
    const _login_sig = await seller.signMessage(_login_nonce);
    const _token = await login(seller.address, _login_sig);

     // Verify 2. 如果没有授权，需要授权
     let _isApprovedForAll = await testNFT.connect(seller).isApprovedForAll(seller.address, executionDelegate.address);
     if(!_isApprovedForAll) {
        let tx = await testNFT.connect(seller).setApprovalForAll(executionDelegate.address, true);
        await tx.wait();
    }
    
    console.log('_isApprovedForAll:', _isApprovedForAll)


    const _trader = new Trader(seller, exchange);
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
            extraParams: '0x',
            fees: [
                {
                    rate: FEE_Rate,
                    recipient: FEE_Recipient
                }
            ]
        })

    }

    // 签名
    const nonce = await exchange.nonces(seller.address)
    const blocknumber = (await hre.ethers.provider.getBlock('latest')).number;
    const _orders = await _trader.bulkSigs(blocknumber as number, nonce)

    _orders?.map(i => {
        let price: BigNumber = i?.order?.price;
        i.order.numberPrice = formatEther(price.toString())
    })

    const list_order = { sale_nft_new: _orders }

    // 批量上架
    await listing(_token, list_order);  
});

