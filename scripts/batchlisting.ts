import { task } from 'hardhat/config';
import { getAddress, getContract, getNetwork } from './web3-utils';

import { Trader, eth, Order, Side, ZERO_ADDRESS } from '../exchange/utils';

import { BigNumber, ethers } from 'ethers';
import { DMXExchange } from '../typechain-types';
import { formatEther, formatUnits, parseEther, parseUnits } from 'ethers/lib/utils';

import { login, listing, get_nonce as get_login_nonce } from './backendAPI'

const getSetupExchange = async (hre: any) => {
    const { network } = getNetwork(hre);
    console.log('network:', network);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);

    // 交易所 logic 合约
    const exchangeImpl = await getContract(hre, 'DMXExchange');
    console.log('sss:', exchangeImpl.address)
    const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
    const exchange: DMXExchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
    const executionDelegate = await getContract(hre, 'ExecutionDelegate');
    const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');
    console.log('721sss', standardPolicyERC721.address)
    const testNFT = await getContract(hre, 'MockERC721');
    console.log(testNFT.address)
    // const mockERC20 = await getContract(hre, 'MockERC20');
    return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, testNFT };
    
}


// 开始的 NFT ID
const FROM_NFT_ID = 1; 
// 结束的 NFT ID
const END_NFT_ID = 20; 

const decimals = 6;
// 价格 
const NFT_SELL_PRICE =  parseUnits('2998', decimals); //eth('2998');

const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
//'0x4Cc8Cd735BB841A3bDdda871b6668cc0d0Cbc14A'
const NFT_ADDRESS = '0xc7aA778906e8DEAf9C0F7ADa99f73bDB81242044'

// 版税接收者
const FEE_Recipient = '0x8DC6315758468A222072DFFc68DFB8b0dF8D839A'
// '0x158F323C98547A0E5998eDB5A5BC9F182158159B'
const FEE_Rate = 300

task('batchlisting', 'batchlisting').setAction(async (_, hre) => {

    const [ _admin, seller ] = await hre.ethers.getSigners();
    console.log('_admin:', _admin.address)
    console.log('seller:', seller.address)

    const { exchange, matchingPolicies, executionDelegate, testNFT } = await getSetupExchange(hre);
    const matchingPolicy = matchingPolicies.standardPolicyERC721.address;

    const _login_nonce: string = await get_login_nonce(seller.address);
    const _login_sig = await seller.signMessage(_login_nonce);
    const _token = await login(seller.address, _login_sig);

    //  // Verify 1. 授权 market 合约 可以调用委托种的 转移代币方法
    //  let isApprovedContract = await executionDelegate.contracts(exchange.address);
    //  if(!isApprovedContract) {
    //     let tx = await executionDelegate.approveContract(exchange.address)
    //     await tx.wait();

    //     isApprovedContract = await executionDelegate.contracts(exchange.address);
    //  }
    //  console.log('isApprovedContract:', isApprovedContract)
 
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
            expirationTime: '1735660800', //2025-1-1 00:00:00
            extraParams: '0x',
            fees: [
                {
                    rate: FEE_Rate,
                    recipient: FEE_Recipient,
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
        i.order.numberPrice = formatUnits(price, decimals)
    })

    const list_order = { sale_nft_new: _orders }
    console.log('list_order:', JSON.stringify(list_order, null, 2));
    // // 批量上架
    await listing(_token, list_order);  
});

