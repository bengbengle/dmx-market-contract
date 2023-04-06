import { task } from 'hardhat/config';
// import { run } from 'hardhat';
import { Contract } from 'ethers';
import { getAddress, getContract, updateAddresses } from './utils';
import { deploy, getAddressEnv, getNetwork, waitForTx } from './web3-utils';
 

const DMXExchange_ContractName = 'TestDMXExchange'; //'DMXExchange';
const ERC1967Proxy_ContractName = 'ERC1967Proxy';

export async function deployFull(hre: any, exchangeName: string): Promise<{
  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
}> {
  // 1. 代理合约
  const executionDelegate = await deploy(hre, 'ExecutionDelegate');
  // 2. 策略管理
  const policyManager = await deploy(hre, 'PolicyManager');
  // 3. ERC721 策略
  const standardPolicyERC721 = await deploy(hre, 'StandardPolicyERC721');

  await waitForTx(policyManager.addPolicy(standardPolicyERC721.address));
  // 4. merkle 校验
  const merkleVerifier = await deploy(hre, 'MerkleVerifier', []);
  
  // 5. 交易所 logic 合约
  const exchangeImpl = await deploy(hre, exchangeName, [], { libraries: { MerkleVerifier: merkleVerifier.address } }, 'DMXExchange');

  const initializeInterface = new hre.ethers.utils.Interface(['function initialize(address, address)']);
  
  const _executionDelegate = executionDelegate.address;
  const _policyManager = policyManager.address;

  const initialize = initializeInterface.encodeFunctionData('initialize', [_executionDelegate, _policyManager]);

  const exchangeProxy = await deploy(hre, 'ERC1967Proxy', [exchangeImpl.address, initialize], {}, 'DMXExchangeProxy');

  const exchange = new hre.ethers.Contract(exchangeProxy.address, exchangeImpl.interface, exchangeImpl.signer);
  
  return { exchange, executionDelegate, matchingPolicies: {standardPolicyERC721} };
}


task('deploy', 'Deploy').setAction(async (_, hre) => {
  const [ admin ] = await hre.ethers.getSigners();
  const { network } = getNetwork(hre);

  console.log(`Deploying exchange on ${network}`);
  console.log(`Deploying from: ${(await admin.getAddress()).toString()}`);

  await deployFull(hre, DMXExchange_ContractName);

  updateAddresses(network);
});


task('upgrade', 'Upgrade').setAction(async (_, hre) => {
  const [admin] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);

  console.log(`Calling on ${network}`);
  console.log(`Calling from: ${(await admin.getAddress()).toString()}`);

  const executionDelegateAddress = getAddress('ExecutionDelegate', network);
  const policyManager = getAddress('PolicyManager', network);
  const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
  console.log('merkleVerifierAddress:', merkleVerifierAddress);

  const exchangeImpl = await deploy(hre, DMXExchange_ContractName, [], { libraries: { MerkleVerifier: merkleVerifierAddress } }, 'DMXExchange');
  
  
  const initializeInterface = new hre.ethers.utils.Interface(['function initialize(address, address)']);

  const initialize = initializeInterface.encodeFunctionData('initialize', [executionDelegateAddress, policyManager]);


  const _exchangeProxy = await getAddress('DMXExchangeProxy', network);
  const exchange = new hre.ethers.Contract(_exchangeProxy, exchangeImpl.interface, exchangeImpl.signer);
  
  await exchange.upgradeToAndCall(exchangeImpl.address, initialize);

  console.log('functions::', exchange.functions);

});

task('verify', 'verify').setAction(async (_, hre) => {
  const [admin] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);
  const {run} = hre
  console.log(`Calling on ${network}`);
  console.log(`Calling from: ${(await admin.getAddress()).toString()}`);

  const _delegate = getAddress('ExecutionDelegate', network);
  const _policyMG = getAddress('PolicyManager', network);
  const _merkle = getAddress('MerkleVerifier', network);
  const _policy721 = getAddress('StandardPolicyERC721', network);
  const _impl = getAddress('DMXExchange', network);

  const initializeInterface = new hre.ethers.utils.Interface(['function initialize(address, address)']);
  const initialize = initializeInterface.encodeFunctionData('initialize', [_delegate, _policyMG]);
  const _exchangeProxy = getAddress('DMXExchangeProxy', network); 
  
  console.log('_exchangeProxy:', _exchangeProxy);

  await run(`verify:verify`, {address: _delegate, constructorArguments: [] }); 
  await run(`verify:verify`, {address: _policyMG, constructorArguments: [] }); 
  await run(`verify:verify`, {address: _merkle, constructorArguments: [] }); 
  await run(`verify:verify`, {address: _policy721, constructorArguments: [] }); 
  await run(`verify:verify`, {address: _impl, constructorArguments: [] }); 
  await run(`verify:verify`, {address: _exchangeProxy, constructorArguments: [_impl, initialize] }); 
});

 