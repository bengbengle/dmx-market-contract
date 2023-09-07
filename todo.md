1. 构建交易 

    1, 单个 NFT 挂单 single
    2, 多个 NFT 挂单 bulk


    3, 购买 单个 
            1. single 单挂单
            2. bulk 挂单

    4. 购买 多个 (构建多个 Executions 数组 )  bulkExecute
            多个 single 
            多个 bulk nft
            混合 single & bulk nft
    


nft-listing 

## 多币种支持

现在支持的
1. 现在接口部分 不变 , 对应前端的调用参数不变
2. 事件 hash  不变， 
        对应后端的事件监听 Hash 方法不变
        
### TODO:
### 合约:

1. 计算 版税 和 平台费的部分 
2. 合约 执行 购买的时候，需要修改
3. 划转 资金的时候，需要修改 
4. 合约的测试用例  

### 后端支持 

    项目方指定支持哪些币种交易 usdt, usdc, eth, 对整个合辑的设定

    事件监听时候, 需要 判断 paymentToken != 0x000000, 就是 非 ETH 代币支付 

    获取 listing 列表，交易记录列表，报价数据 时候， 返回对应的 代币种类 和 logo  

### 前端需要支持

    卖方挂单时候 选择其中一种, 是对 买卖某 NFT 的设定

1. 挂单的时候 ，支持多币种， usdt, usdtc 某一种
2. 购买的时候， 支持挂单中的币种, usdt
    购买的时候，多了 Approve 的检查, 操作

3. 界面的 token 展示
    test erc20 ,设置一下 Logo , 正式 时候修改 正式的 USDT,USDC 合约地址 

### 其他:
1. 封装合约交互代码 npm 包， @dmx/sdk.js

### 其他:
1. Mint 时候， 项目方指定 支付的币种， usdt, usdc, Eth 其中的一种






sdk 的封装










1. 升级 proxy 
2. 设置 usdt
3. 设置 delegation


4. delegation 设置 approveContract(proxy_address)

5. 调用 delegation.transferUSDT


