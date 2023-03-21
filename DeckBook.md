### 事件

### Delegate
1. RevokeApproval: 禁用 (用户) 
2. GrantApproval: 授权 (用户)

3. ApproveContract: 授权合约 (管理员)
4. DenyContract: 禁用合约 (管理员)

### Exchange

1. OrdersMatched 订单匹配完成 (用户) --> execute(Input calldata sell, Input calldata buy)
2. OrderCancelled 取消订单 (用户)
3. NonceIncremented 取消用户当前的所有订单 (用户)

1. Opened (管理员)
2. Closed (管理员)
3. NewExecutionDelegate(管理员) --> setExecutionDelegate
4. NewPolicyManager(管理员) --> setPolicyManager
5. NewOracle (管理员)   --> setOracle
6. NewBlockRange(管理员)  --> setBlockRange


#### Setters


#### Internal Functions
##### View

1. _validateOrderParameters  验证订单参数的有效性

##### Setters

1. _transferTo  以ETH 或 WETH 转账金额 (eth, weth, 也可以是 blur pool 中的 pool_eth )
2. _executeTokenTransfer 通过代理转移 NFT (1155, 721)


## Market

## Maker (GasFree)

1. seller
    
    listing: 
        single （√）
        bulk （批量上架） MARKTREE JS SIGN, (public key, nfts(tokenid, price, ))

2. buyer  (暂时不做), eth --> pool eth
    bid:
        single 
        collection

### SERVER
    sign 
        nfts(tokenid, price), hash, public key 


## Taker
    
1. buyer
    buy
    
    MARKTREE JS SIGN ([oracle, order(token, price, root sign, nft path) ]) 
    Execute (accept single listing)
    BulkExecute(accept bulk listing) 

    eth 

2. seller (暂时不做)
    sell

    Execute (accept single bid)
    BULKEXECUTE(accept multi bids)


### 问题

1. 2种 合约升级模式

    UUPSUpgradeable

2. 4种事件监听方式

3. pragma abicoder v2;

4. 存储结构

    https://docs.soliditylang.org/zh/v0.8.17/internals/layout_in_memory.html




3.16 会议

    Marketplace 上线 4.20 号

    发合约 出接口 4.5

 

todo:


1. UUPS 部署 
    升级

2. 权限 设置的 测试 
    委托代理 合约测试
    转移 NFT， weth 设置测试

3. 签名 验证 测试
4. order 参数结构 
5. 策略 匹配的 验证测试 

6. 订单执行 测试

    execution test



### struct 

``` rust
Input {
    Order order;
    uint8 v;
    bytes32 r;
    bytes32 s;
    bytes extraSignature;
    SignatureVersion signatureVersion;
    uint256 blockNumber;
}

```

```rust
Order {
    address trader;
    Side side;
    address matchingPolicy;
    address collection;
    uint256 tokenId;
    uint256 amount;
    address paymentToken;
    uint256 price;
    uint256 listingTime; // 挂单时间
    uint256 expirationTime; // 过期时间
    Fee[] fees;
    uint256 salt;
    bytes extraParams;
}
```



``` rust
Fee {
    uint16 rate;
    address payable recipient;
}
```

### INPUT DEMO
``` json
{
    "trader": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "side": 0,
    "matchingPolicy": "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B",
    "collection": "0xDC11f7E700A4c898AE5CAddB1082cFfa76512aDD",
    "tokenId": 1,
    "amount": 0,
    "paymentToken": "0x36b58F5C1969B7b6591D752ea6F5486D069010AB",
    "price": {
        "type": "BigNumber",
        "hex": "0x0de0b6b3a7640000"
    },
    "listingTime": "0",
    "expirationTime": "0",
    "fees": [
        {
            "rate": 300,
            "recipient": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        }
    ],
    "salt": 1,
    "extraParams": "0x"
}

```