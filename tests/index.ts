import hre from 'hardhat';

import { runExchangeTests } from './exchange.test';
import { runExecuteTests } from './execution.test';
import { runSignatureTests } from './signatures.test';
import { runMulticoinTests } from './multcoin.test';
import { 
  SetupExchangeResult,
  eth, 
  Order, 
  setupTest, 
  Side
} from '../exchange';

import { deployFull } from '../scripts/deploy';

const order = '(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes)';

export async function setupExchange(): Promise<SetupExchangeResult> {
  return deployFull(hre, 'TestDMXExchange');
}

const price = eth('1');
const feeRate = 300;

// runExchangeTests(
//   setupExchange
// );

// runExchangeTests(
//   async () => {
//     return setupTest({price, feeRate, setupExchange});
//   }
// );


// runExecuteTests(async () => {
//   return setupTest({price, feeRate, setupExchange});
// })

// runSignatureTests(async () => {
//   return setupTest({price, feeRate, setupExchange});
// })


runMulticoinTests(async () => {
  return setupTest({price, feeRate, setupExchange});
})













