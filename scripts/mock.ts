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
  const mockERC721 = (await deploy(hre, 'MockERC721')) as any;

  const totalSupply = await mockERC721.totalSupply();
  const tokenId = totalSupply.toNumber() + 1;

  await mockERC721.mint(alice.address, tokenId);
  await mockERC721.mint(bob.address, tokenId + 1);

  console.log('mockERC721:', mockERC721.address);
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

task('mint-nft', 'Mint mock nft').setAction(async (_, hre) => {

  const [ admin, alice, bob] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);

  const mockERC721 = await getContract(hre, 'MockERC721');

  // await mockERC721.mint(alice.address, 3);
  // await mockERC721.mint(alice.address, 4);
  // await mockERC721.mint(alice.address, 5);
  // await mockERC721.mint(alice.address, 6);
  // await mockERC721.mint(alice.address, 7);
  // await mockERC721.mint(alice.address, 8);

  for(let i = 0; i < 10; i++) {
    await mockERC721.mint(alice.address, 3+i);
  }

  const totalSupply = await mockERC721.totalSupply();
  console.log('totalSupply:', totalSupply.toString());

  const balance = await mockERC721.balanceOf(alice.address);
  console.log('balance:', balance.toString());

  // console.log('mockERC721Address:', mockERC721.address);

});

task('mint-weth', 'Mint mock nft').setAction(async (_, hre) => {

  const [admin, alice, bob] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);

  const mockERC20 = await getContract(hre, 'MockERC20');

  await mockERC20.mint(alice.address, 100000000);
  await mockERC20.mint(bob.address, 100000000);

  const totalSupply = await mockERC20.totalSupply();
  console.log('totalSupply:', totalSupply.toString());
  console.log('mockERC721Address:', mockERC20.address);

});

task('set-weth', 'Deploy').setAction(async (_, hre) => {

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



