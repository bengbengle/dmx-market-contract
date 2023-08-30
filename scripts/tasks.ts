import { task } from 'hardhat/config';

import { getAddress, getContract, updateAddresses } from './utils';
import { deploy, getAddressEnv, getNetwork, waitForTx } from './web3-utils';

const DMXExchange_ContractName = 'DMXExchange';

task('deploy-nft', 'Deploy mock nft').setAction(async (_, hre) => {

  const [admin, alice, bob] = await hre.ethers.getSigners();
  const { network } = getNetwork(hre);

  console.log(`Deploying exchange on ${network}`);
  console.log(`Deploying from: ${(await admin.getAddress()).toString()}`);

  // 1. MockERC721
  const testNFT = (await deploy(hre, 'MockERC721')) as any;

  const totalSupply = await testNFT.totalSupply();
  const tokenId = totalSupply.toNumber() + 1;

  await testNFT.mint(alice.address, tokenId);
  await testNFT.mint(bob.address, tokenId + 1);

  console.log('testNFT:', testNFT.address);
  console.log('tokenId:', tokenId);

  updateAddresses(network);

});

task('deploy-weth', 'Deploy mock nft').setAction(async (_, hre) => {

  const [admin, alice, bob] = await hre.ethers.getSigners();
  const { network } = getNetwork(hre);

  // 1. mockERC20
  const mockERC20 = (await deploy(hre, 'MockERC20')) as any;

  await mockERC20.mint(alice.address, 100000000);
  await mockERC20.mint(bob.address, 100000000);

  const totalSupply = await mockERC20.totalSupply();
  console.log('totalSupply:', totalSupply.toString());

  updateAddresses(network);

});

task('mint-nft', 'mint-nft-mock').setAction(async (_, hre) => {

  const [ admin, alice, bob] = await hre.ethers.getSigners();

  const testNFT = await getContract(hre, 'MockERC721');

   
  for(let i = 0; i < 10; i++) {
    await testNFT.mint(alice.address, 3+i);
  }

  const totalSupply = await testNFT.totalSupply();
  console.log('totalSupply:', totalSupply.toString());

  const balance = await testNFT.balanceOf(alice.address);
  console.log('balance:', balance.toString());

  // console.log('testNFTAddress:', testNFT.address);

});

task('mint-weth', 'mint-weth-mock').setAction(async (_, hre) => {

  const [admin, alice, bob] = await hre.ethers.getSigners();

  const mockERC20 = await getContract(hre, 'MockERC20');

  await mockERC20.mint(alice.address, 100000000);
  await mockERC20.mint(bob.address, 100000000);

  const totalSupply = await mockERC20.totalSupply();
  console.log('totalSupply:', totalSupply.toString());
  console.log('testNFTAddress:', mockERC20.address);

});

task('set-weth', 'set-weth').setAction(async (_, hre) => {

  const { network } = getNetwork(hre);

  const merkleVerifierAddress = await getAddress('MerkleVerifier', network);

  // 交易所 logic 合约
  const exchangeImpl = await getContract(hre, 'DMXExchange', { libraries: { MerkleVerifier: merkleVerifierAddress } });

  console.log('exchangeImpl:', exchangeImpl.address);

  const DMXExchangeProxy = await getAddress('DMXExchangeProxy', network);

  const exchange = new hre.ethers.Contract(DMXExchangeProxy, exchangeImpl.interface, exchangeImpl.signer);

  const weth = await getAddress('MockERC20', network);

  await exchange.setWethAddress(weth);



});




