import { simpleDeploy } from '@makerdao/hardhat-utils';
import { expect } from 'chai';
import { BigNumber, Contract, ethers, Signer, Wallet } from 'ethers';
import hre from 'hardhat';

import { eth, Order, Side } from './utils';
import { MockERC20, MockERC721 } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FactoryOptions, HardhatRuntimeEnvironment } from 'hardhat/types';


export async function deploy(
  hre: HardhatRuntimeEnvironment,
  name: string,
  calldata: any = [],
  options: FactoryOptions
) {
  const contractFactory = await hre.ethers.getContractFactory(name, options);
  const contract = await contractFactory.deploy(...calldata);

  await contract.deployed();
  return contract;
}

export interface SetupExchangeResult {
  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
}

export type SetupExchangeFunction = () => Promise<SetupExchangeResult>;

interface SetupTestOpts {
  price: BigNumber;
  feeRate: number;
  setupExchange: SetupExchangeFunction;
}

export type CheckBalances = (...args: any[]) => Promise<void>;
export type GenerateOrder = (account: Wallet, overrides?: any) => Order;

interface SetupTestResult {
  provider: ethers.providers.JsonRpcProvider;
  admin: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  thirdParty: SignerWithAddress;

  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
  
  mockERC721: Contract;
  weth: Contract;

  tokenId: number;

  checkBalances: CheckBalances;
  generateOrder: GenerateOrder;
}

export type SetupTestFunction = (opts: SetupTestOpts) => Promise<SetupTestResult>;

async function setupRegistry(

  alice: SignerWithAddress ,
  bob: SignerWithAddress,
  mockERC721: Contract,
  weth: Contract,
  executionDelegate: Contract,
  exchange: Contract

) {
  await exchange.setWethAddress(weth.address);

  await mockERC721
    .connect(alice)
    .setApprovalForAll(executionDelegate.address, true);
  
    await mockERC721
    .connect(bob)
    .setApprovalForAll(executionDelegate.address, true);

  await weth
    .connect(bob)
    .approve(executionDelegate.address, eth('10000000000000'));

  await weth
    .connect(alice)
    .approve(executionDelegate.address, eth('1000000000000'));

}

async function setupTokenMocks(alice: SignerWithAddress, bob: SignerWithAddress) {

  const mockERC721 = (await simpleDeploy('MockERC721', [])) as MockERC721;
  const weth = (await simpleDeploy('MockERC20', [])) as MockERC20;
  const usdt = (await simpleDeploy('MockERC20', [])) as MockERC20;
  const usdc = (await simpleDeploy('MockERC20', [])) as MockERC20;

  const totalSupply = await mockERC721.totalSupply();
  const tokenId = totalSupply.toNumber() + 1;

  await mockERC721.mint(alice.address, tokenId);

  await weth.mint(bob.address, eth('1000'));
  await weth.mint(alice.address, eth('1000'));

  return { weth, usdc, usdt, mockERC721, tokenId };

}

export async function setupTest({price, feeRate, setupExchange}: SetupTestOpts): Promise<SetupTestResult> {

  console.log("setupTest provider: ", hre.ethers.provider);
  const [admin, alice, bob, thirdParty] = await hre.ethers.getSigners();

  const { weth, mockERC721, tokenId } = await setupTokenMocks(alice, bob);
  
  const { exchange, executionDelegate, matchingPolicies } = await setupExchange();

  await setupRegistry(alice, bob, mockERC721, weth, executionDelegate, exchange);

  const checkBalances = async (
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
    
    expect(
      await admin.provider!.getBalance(thirdParty.address)
    ).to.be.equal(feeRecipientEth);
    
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

  const generateOrder = (account: Wallet, overrides: any = {}): Order => {
    
    return new Order(
      account,
      {
        trader: account.address,
        side: Side.Buy,
        matchingPolicy: matchingPolicies.standardPolicyERC721.address,
        collection: mockERC721.address,
        tokenId,
        amount: 0,
        paymentToken: weth.address,
        price,
        listingTime: '0',
        expirationTime: '0',
        fees: [
          {
            rate: feeRate,
            recipient: thirdParty.address,
          },
        ],
        salt: 0,
        extraParams: '0x',
        ...overrides,
      },
      exchange,
    );
  };
  
  const provider = hre.ethers.provider;
  
  return {
    provider,
    admin,
    alice,
    bob,
    thirdParty,
    exchange,
    executionDelegate,
    matchingPolicies,
    mockERC721,
    tokenId,
    weth,
    checkBalances,
    generateOrder,
  };
}