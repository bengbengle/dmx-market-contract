import { simpleDeploy } from '@makerdao/hardhat-utils';
import { expect } from 'chai';
import { BigNumber, Contract, ethers, Signer, Wallet } from 'ethers';
import hre from 'hardhat';

import { eth, Order, Side } from './utils';
import { ExecutionDelegate, MockERC20, MockERC721 } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FactoryOptions, HardhatRuntimeEnvironment } from 'hardhat/types';

export async function deploy(hre: HardhatRuntimeEnvironment, name: string, calldata: any = [], options: FactoryOptions) {
  const contractFactory = await hre.ethers.getContractFactory(name, options);
  const contract = await contractFactory.deploy(...calldata);
  await contract.deployed();
  return contract;
}

export type SetupExchangeResult = {
  exchange: Contract;
  executionDelegate: ExecutionDelegate;
  matchingPolicies: Record<string, Contract>;
}

export type SetupExchangeFunction = () => Promise<SetupExchangeResult>;

type SetupTestOpts = {
  setupExchange: SetupExchangeFunction;
}

export type CheckBalances = (...args: any[]) => Promise<void>;
export type GenerateOrder = (account: SignerWithAddress, overrides?: any) => Order;

interface SetupTestResult {
  provider: ethers.providers.JsonRpcProvider;
  admin: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  thirdParty: SignerWithAddress;

  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;

  testNFT: MockERC721;
  usdt: MockERC20;
  usdc: MockERC20;
  weth: Contract;

  checkBalances: CheckBalances;
  generateOrder: GenerateOrder;
}

export type SetupTestFunction = (opts: SetupTestOpts) => Promise<SetupTestResult>;

// async function setupRegistry(
//   alice: SignerWithAddress,
//   bob: SignerWithAddress,
//   testNFT: Contract,
//   coin: Contract,
//   executionDelegate: Contract,
//   exchange: Contract
// ) {

//   await exchange.setWethAddress(coin.address);

//   await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
//   await testNFT.connect(bob).setApprovalForAll(executionDelegate.address, true);

//   await coin.connect(bob).approve(executionDelegate.address, eth('10000000000000'));
//   await coin.connect(alice).approve(executionDelegate.address, eth('1000000000000'));

// }


async function setupRegistry(
  alice: SignerWithAddress,
  bob: SignerWithAddress,
  testNFT: Contract,
  coin: Contract,
  executionDelegate: Contract,
  exchange: Contract
) {

  // await exchange.setWethAddress(coin.address);

  await testNFT.connect(alice).setApprovalForAll(executionDelegate.address, true);
  await testNFT.connect(bob).setApprovalForAll(executionDelegate.address, true);

  await coin.connect(bob).approve(executionDelegate.address, eth('10000000000000'));
  await coin.connect(alice).approve(executionDelegate.address, eth('1000000000000'));

}

async function _registryWETH(coin: Contract, exchange: Contract) {
  await exchange.setWethAddress(coin.address);
}

async function _mockTokens(alice: SignerWithAddress, bob: SignerWithAddress) {

  const weth = (await simpleDeploy('MockERC20', ["WETH", "WETH"])) as MockERC20;
  await weth.mint(bob.address, eth('1000'));
  await weth.mint(alice.address, eth('1000'));

  const usdt = (await simpleDeploy('MockERC20', ["USDT", "USDT"])) as MockERC20;
  await usdt.mint(bob.address, eth('1000'));
  await usdt.mint(alice.address, eth('1000'));

  const usdc = (await simpleDeploy('MockERC20', ["USDC", "USDC"])) as MockERC20;
  await usdc.mint(bob.address, eth('1000'));
  await usdc.mint(alice.address, eth('1000'));

  return { weth, usdc, usdt};
}

async function _mockNFT(alice: SignerWithAddress, bob: SignerWithAddress) {

  const testNFT = (await simpleDeploy('MockERC721', ["testNFT", "NFT"])) as MockERC721;

  return { testNFT };
}
async function _approveNFT(nft: Contract, account: SignerWithAddress, executionDelegate: ExecutionDelegate) {
  await nft.connect(account).setApprovalForAll(executionDelegate.address, true);
}

async function _approveERC20(coin: MockERC20, account: SignerWithAddress, executionDelegate: ExecutionDelegate) {
  
  await coin.connect(account).approve(executionDelegate.address, eth('10000000000000'));
}

// const provider = hre.ethers.provider;

export async function setupTest(contracts: SetupExchangeResult): Promise<SetupTestResult> {

  const { exchange, executionDelegate, matchingPolicies } = contracts;
  const [ admin, alice, bob, thirdParty ] = await hre.ethers.getSigners();

  const { weth, usdt, usdc } = await _mockTokens(alice, bob);
  const { testNFT } = await _mockNFT(alice, bob);
  

  await _registryWETH(weth, exchange);

  await _approveNFT(testNFT, alice, executionDelegate);
  await _approveNFT(testNFT, bob, executionDelegate);
  
  await _approveERC20(weth, alice, executionDelegate);
  await _approveERC20(weth, bob, executionDelegate);

  await _approveERC20(usdt, alice, executionDelegate);
  await _approveERC20(usdt, bob, executionDelegate);

  await _approveERC20(usdc, alice, executionDelegate);
  await _approveERC20(usdc, bob, executionDelegate);

  const _checkBalances = async (

    aliceEth: BigNumber,
    aliceWeth: BigNumber,

    bobEth: BigNumber,
    bobWeth: BigNumber,

    feeRecipientEth: BigNumber,
    feeRecipientWeth: BigNumber,

    adminEth?: BigNumber,
    adminWeth?: BigNumber,

  ) => {
    
    expect(await alice.getBalance()).to.be.equal(aliceEth);
    expect(await bob.getBalance()).to.be.equal(bobEth);

    expect(await weth.balanceOf(alice.address)).to.be.equal(aliceWeth);
    expect(await weth.balanceOf(bob.address)).to.be.equal(bobWeth);

    expect(await admin.provider!.getBalance(thirdParty.address)).to.be.equal(feeRecipientEth);

    expect(
      await weth.balanceOf(thirdParty.address)
    ).to.be.equal(feeRecipientWeth);

    if (adminEth) {
      expect(await admin.getBalance()).to.be.equal(adminEth);
    }

    if (adminWeth) {
      expect(await weth.balanceOf(admin.address)).to.be.equal(adminWeth);
    }
  };

  const _generateOrder = (account: SignerWithAddress, overrides: any = {}): Order => {

    const price = eth('1');
    const feeRate = 300;

    return new Order(
      account,
      {
        trader: account.address,
        side: Side.Buy,
        matchingPolicy: matchingPolicies.standardPolicyERC721.address,
        collection: testNFT.address,
        tokenId: 1,
        amount: 0,
        paymentToken: weth.address,
        price,
        listingTime: '0',
        expirationTime: '0',
        fees: [
          {
            rate: feeRate,
            recipient: admin.address,
          },
        ],
        salt: 0,
        extraParams: '0x',
        ...overrides,
      },
      exchange,
    );
  };


  return {
    provider: hre.ethers.provider,
    admin,
    alice,
    bob,
    thirdParty,
    exchange,
    executionDelegate,
    matchingPolicies,
    testNFT,
    weth,
    usdt,
    usdc,
    checkBalances: _checkBalances,
    generateOrder: _generateOrder,
  };
}