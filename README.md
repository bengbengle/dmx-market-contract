### 订单列表
``` json
{
  "trader": "0x558395439377A3146aF3076B44B51E41504bD588",
  "side": 0,
  "matchingPolicy": "0x18e8DC0F5AB80076Bc4A4F9007187A73EE38cd61",
  "collection": "0x4539885B6c2222d79140044262dbD82E3e7238c7",
  "tokenId": 1,
  "amount": 0,
  "paymentToken": "0x3dEEfe08f3Fd1a1789b152357B1A4a8428d1629d",
  "price": "1000000000000000000",
  "listingTime": "0",
  "expirationTime": "1679630942",
  "fees": [
    {
      "rate": 300,
      "recipient": "0x0017446d75054F370106976DE781ff60b53630Df"
    }
  ],
  "salt": 0,
  "extraParams": "0x",
  "nonce": 0
}

```


#### Setters

#### Internal Functions
##### View

1. _validateOrderParameters  验证订单参数的有效性

##### Setters

1. _transferTo  以ETH 或 WETH 转账金额 (eth, weth, 也可以是 blur pool 中的 pool_eth )
2. _executeTokenTransfer 通过代理转移 NFT (1155, 721)



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

4. Order 参数结构 
    * 怎么构建 NFT 卖单 订单
    * 卖家怎么签名
    * 后端 / 合约 验证签名是否有效
    * 买家 构建 erc20 买单
    * 买单 是否需要签名呢 ? 验证？
    * 调用合约 执行 
    * 验证买卖 订单的策略 是否匹配


5. 策略 匹配的 验证测试 

6. 订单执行 测试

    execution test





### 签名

### 数据结构

<!-- mapping(bytes32 => bool) public cancelledOrFilled; -->
mapping(address => uint256) public nonces; // user address --> 0,1,2,3,4 ....


### Test

index.ts
exchange.test
execution.test




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




