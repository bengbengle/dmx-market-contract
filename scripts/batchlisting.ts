import { task } from 'hardhat/config';
import { getAddress, getContract, getNetwork } from './web3-utils';

import { Trader, Side} from '../exchange/utils';

import { BigNumber } from 'ethers';
import { DMXExchange } from '../typechain-types';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

import { login, listing, get_nonce as get_login_nonce, status } from './backendAPI'
import assert from 'assert';

const getSetupExchange = async (hre: any) => {
    const { network } = getNetwork(hre);

    console.log('network:', network);

    // 交易所 logic 合约
    // const exchangeImpl = await getContract(hre, 'DMXExchange');
    const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);
    

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);

    // 交易所 logic 合约
    const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });

    const exchange: DMXExchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
    const executionDelegate = await getContract(hre, 'ExecutionDelegate');
    const standardPolicyERC721 = await getContract(hre, 'StandardPolicyERC721');
    const testNFT = await getContract(hre, 'MockERC721'); // 测试 NFT
    return { exchange, executionDelegate, matchingPolicies: { standardPolicyERC721 }, testNFT };
}

const NETWORK: any = 'testnet';

// testnet
let confg = {
    USDT_ADDRESS: '0x629afCC089732Ff5f01dDa6C6B41dAC2488B7E22',
    NFT_ADDRESS: '0x966ae2552B359fC73743442F6Ac7BD0253F303ff',
    DECIMALS: 6,
    NFT_SELL_PRICE: parseUnits('166', 6),
    FEE_RECIPIENT: '0x158F323C98547A0E5998eDB5A5BC9F182158159B',
    FEE_RATE: 300,
    FROM_NFT_ID: 500,
    END_NFT_ID: 600,
}

if(NETWORK == 'mainnet') {
    confg.NFT_ADDRESS = '0xc7aA778906e8DEAf9C0F7ADa99f73bDB81242044'
    confg.USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'
    confg.FEE_RECIPIENT = '0x8DC6315758468A222072DFFc68DFB8b0dF8D839A' // 版税接收者
    confg.END_NFT_ID = 450
    confg.FROM_NFT_ID = 400
    confg.NFT_SELL_PRICE = parseUnits('100', 6)
    confg.FEE_RATE = 300
}


task('batchlisting', 'batchlisting').setAction(async (_, hre) => {

    let seller, _admin = null; 

    [ seller, _admin] = await hre.ethers.getSigners();
    if(NETWORK == 'mainnet') {
        [seller, _admin] = await hre.ethers.getSigners();
    }
    assert(seller != null, 'seller is null')

    console.log('_admin:', _admin.address)
    console.log('seller:', seller.address)

    const { exchange, matchingPolicies, executionDelegate, testNFT } = await getSetupExchange(hre);
    const matchingPolicy = matchingPolicies.standardPolicyERC721.address;

    const _nonce_to_sign: string = await get_login_nonce(seller.address);
    const _login_sig = await seller.signMessage(_nonce_to_sign);
    const _token = await login(seller.address, _login_sig);

     // Verify 2. 如果没有授权，需要授权
     let _isApprovedForAll = await testNFT.connect(seller).isApprovedForAll(seller.address, executionDelegate.address);
     if(!_isApprovedForAll) {
        let tx = await testNFT.connect(seller).setApprovalForAll(executionDelegate.address, true);
        await tx.wait();
    }
    
    const _trader = new Trader(seller, exchange);
    for (let i = confg.FROM_NFT_ID; i <= confg.END_NFT_ID; i++) {

        let tokenId = i.toString()
        
        let _owner = await testNFT.ownerOf(tokenId);
        if(_owner != seller.address) { 
            console.log('owner:', _owner, 'seller:', seller.address, 'tokenId:', tokenId, 'eq?:', _owner == seller.address)
            continue;
        }

        let _status = await status(testNFT.address, tokenId);
        console.log('nft status:', _status.data.status)
        
        if(_status.data.status != 2) {
            console.log('nft status:', _status.data.status)
            continue;
        }

        _trader.addOrder({
            tokenId: tokenId,
            collection: confg.NFT_ADDRESS,
            price: confg.NFT_SELL_PRICE,
            paymentToken: confg.USDT_ADDRESS,
            matchingPolicy: matchingPolicy,
            amount: 0,
            side: Side.Sell,
            salt: Date.now(),
            listingTime: '1691316213',  //2023-08-06 18:03:33
            expirationTime: '1735660800', //2025-1-1 00:00:00
            extraParams: '0x',
            fees: [
                {
                    rate: confg.FEE_RATE,
                    recipient: confg.FEE_RECIPIENT
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
        i.order.numberPrice = formatUnits(price, confg.DECIMALS)
    })

    const list_order = { sale_nft_new: _orders }

    console.log('...')
    // 批量上架
    let result = await listing(_token, list_order);    

    console.log('nft status:', result.data)

});

