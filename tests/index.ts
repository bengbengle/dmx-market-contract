import hre from 'hardhat';

import { runExchangeTests } from './exchange.test';
import { SetupExchangeOpts, SetupExchangeResult } from './exchange';

import { deployFull } from '../scripts/deploy';

const order = '(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes)';

// 公共 可变方法
export const publicMutableMethods = [
  'initialize(address,address)',
  'transferOwnership(address)',
  'renounceOwnership()',
  'close()',
  'open()',
  'setOracle(address)',
  'setBlockRange(uint256)',
  'setExecutionDelegate(address)',
  'setPolicyManager(address)',
  `cancelOrder(${order})`,
  `cancelOrders(${order}[])`,
  `incrementNonce()`,
  `execute((${order},uint8,bytes32,bytes32,bytes,uint8,uint256),(${order},uint8,bytes32,bytes32,bytes,uint8,uint256))`,
  'upgradeTo(address)',
  'upgradeToAndCall(address,bytes)',
];

export async function setupExchange({ admin }: SetupExchangeOpts): Promise<SetupExchangeResult> {
  return deployFull(hre, 'TestDMXExchange');
}

runExchangeTests(setupExchange);


















