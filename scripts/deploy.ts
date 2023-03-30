import { task } from 'hardhat/config';
import { Contract } from 'ethers';
import { getAddress, getContract, updateAddresses } from './utils';
import { deploy, getAddressEnv, getNetwork, waitForTx } from './web3-utils';

export async function deployFull(hre: any, exchangeName: string): Promise<{
  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
}> {

  const executionDelegate = await deploy(hre, 'ExecutionDelegate');
  const policyManager = await deploy(hre, 'PolicyManager');
  const standardPolicyERC721 = await deploy(hre, 'StandardPolicyERC721');

  await waitForTx(policyManager.addPolicy(standardPolicyERC721.address));
  
  const merkleVerifier = await deploy(hre, 'MerkleVerifier', []);
  
  const exchangeImpl = await deploy(hre, exchangeName, [], { libraries: { MerkleVerifier: merkleVerifier.address } }, 'DMXExchangeImpl');

  const initializeInterface = new hre.ethers.utils.Interface(['function initialize(address, address)']);
  
  const _executionDelegate = executionDelegate.address;
  const _policyManager = policyManager.address;

  const initialize = initializeInterface.encodeFunctionData('initialize', [_executionDelegate, _policyManager]);

  const exchangeProxy = await deploy(hre, 'ERC1967Proxy', [exchangeImpl.address, initialize], {}, 'DMXExchangeProxy');
  
  await waitForTx(executionDelegate.approveContract(exchangeProxy.address));

  console.log('exchangeProxy.address:', exchangeProxy.address);
  const exchange = new hre.ethers.Contract(exchangeProxy.address, exchangeImpl.interface, exchangeImpl.signer);
  
  return { exchange, executionDelegate, matchingPolicies: {standardPolicyERC721} };
}

task('deploy', 'Deploy').setAction(async (_, hre) => {
  const [ signer ] = await hre.ethers.getSigners();
  const { network } = getNetwork(hre);

  console.log(`Deploying exchange on ${network}`);
  console.log(`Deploying from: ${(await signer.getAddress()).toString()}`);

  await deployFull(hre, 'DMXExchange' );

});
