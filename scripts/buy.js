// const { ethers } = require('ethers');
// const BlurExchangeABI = require('path/to/BlurExchange.abi.json');

// // 初始化 provider 和 signer
// const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// const signer = provider.getSigner();

// // 初始化 BlurExchange 合约
// const blurExchangeAddress = '0x123...';
// const blurExchange = new ethers.Contract(blurExchangeAddress, BlurExchangeABI, signer);

// // 设置挂单的参数
// const tokenId = 1;  // NFT 的 tokenId
// const price = ethers.utils.parseEther('0.1');  // NFT 的出售价格，单位是 Ether

// // 调用挂单函数，将 NFT 挂在交易对中
// async function placeSellOrder() {
//   const tx = await blurExchange.sell(tokenId, price);
//   await tx.wait();
//   console.log('Sell order placed');
// }

// // 购买 NFT 的函数
// async function buyNFT() {
//   const blurPairAddress = await blurExchange.getPairAddress(tokenId);  // 获取 NFT 对应的交易对地址
//   const blurPair = new ethers.Contract(blurPairAddress, BlurPairABI, signer);

//   const amountIn = ethers.utils.parseEther('0.2');  // 购买 NFT 所需要的代币数量
//   const amountOutMin = await blurPair.getAmountOut(amountIn);  // 获取最小卖出数量
//   const deadline = Math.floor(Date.now() / 1000) + 3600;  // 购买操作的截止时间

//   // 构造购买操作的参数
//   const path = [ethers.constants.AddressZero, blurPairAddress];
//   const to = signer.getAddress();
//   const value = amountIn;

//   // 执行购买操作，将代币转换成 NFT
//   const tx = await blurExchange.swap(path, value, amountOutMin, to, deadline);
//   await tx.wait();
//   console.log('NFT purchased');
// }

// placeSellOrder().then(buyNFT);
