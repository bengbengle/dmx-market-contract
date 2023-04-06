import { simpleDeploy } from '@makerdao/hardhat-utils';
import { expect } from 'chai';
import { BigNumber, Contract, ethers, Wallet } from 'ethers';
import hre from 'hardhat';

import { eth, Order, Side } from './utils';

export async function deploy(
  hre: any,
  name: string,
  calldata: any = [],
  options: any = {},
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
  admin: any;
  alice: any;
  bob: any;
  thirdParty: any;

  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
  
  mockERC721: Contract;
  weth: any;

  tokenId: number;

  checkBalances: CheckBalances;
  generateOrder: GenerateOrder;
}

export type SetupTestFunction = (opts: SetupTestOpts) => Promise<SetupTestResult>;

async function setupRegistry(
  alice: any,
  bob: any,
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

async function setupMocks(alice: any, bob: any) {
  const mockERC721 = (await simpleDeploy('MockERC721', [])) as any;
  const weth = (await simpleDeploy('MockERC20', [])) as any;

  const totalSupply = await mockERC721.totalSupply();
  const tokenId = totalSupply.toNumber() + 1;

  await mockERC721.mint(alice.address, tokenId);

  await weth.mint(bob.address, eth('1000'));
  await weth.mint(alice.address, eth('1000'));

  return { weth, mockERC721, tokenId };

}

export async function setupTest({price, feeRate, setupExchange}: SetupTestOpts): Promise<SetupTestResult> {

  const [admin, alice, bob, thirdParty] = await hre.ethers.getSigners();

  const { weth, mockERC721, tokenId } = await setupMocks(alice, bob);
  
  const { exchange, executionDelegate, matchingPolicies } = await setupExchange();

  await setupRegistry(alice, bob, mockERC721, weth, executionDelegate, exchange);

  const checkBalances = async (
    aliceEth: any,
    aliceWeth: any,

    bobEth: any,
    bobWeth: any,

    feeRecipientEth: any,
    feeRecipientWeth: any,
    
    adminEth?: any,
    adminWeth?: any,
  ) => {

    expect(await alice.getBalance()).to.be.equal(aliceEth);
    expect(await bob.getBalance()).to.be.equal(bobEth);

    expect(await weth.balanceOf(alice.address)).to.be.equal(aliceWeth);
    expect(await weth.balanceOf(bob.address)).to.be.equal(bobWeth);
    
    expect(
      await (admin.provider as ethers.providers.Provider).getBalance(thirdParty.address)
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

  return {
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