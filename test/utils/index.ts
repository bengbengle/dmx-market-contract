import hre from 'hardhat';
import { Contract, } from 'ethers';
import { ExecutionDelegate } from '../../typechain-types';

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
