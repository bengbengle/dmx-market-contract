import hre from 'hardhat';
import { BigNumber, Contract, Signer, Wallet, ethers } from 'ethers';
import { ERC20, ExecutionDelegate, StandardPolicyERC721, MockERC20, MockERC721 } from '../../typechain-types';

import { deployFull } from '../../scripts/deploy';
import { setupTest } from '../../exchange';
 
export type SetupExchangeResult = {
  exchange: Contract;
  executionDelegate: ExecutionDelegate;
  matchingPolicies: Record<string, Contract>;
}

export const setupExchange = async (): Promise<any> => {
  let contracts: SetupExchangeResult = await deployFull(hre, 'DMXExchange')
  return await setupTest(contracts);
}
