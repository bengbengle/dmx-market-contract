import { task } from 'hardhat/config';

import { Contract } from 'ethers';
import { getAddress, getContract, updateAddresses } from './utils';
import { deploy, getAddressEnv, getNetwork, waitForTx } from './web3-utils';

export async function deployFull(
  hre: any,
  exchangeName: string,
  chainId: string | number,
  WETH_ADDRESS: string,
  oracleAddress: string,
): Promise<{
  exchange: Contract;
  executionDelegate: Contract;
  matchingPolicies: Record<string, Contract>;
}> {
  const executionDelegate = await deploy(hre, 'ExecutionDelegate');
  const policyManager = await deploy(hre, 'PolicyManager');

  const standardPolicyERC721 = await deploy(hre, 'StandardPolicyERC721');
  // const standardPolicyERC1155 = await deploy(hre, 'StandardPolicyERC1155');
  await waitForTx(policyManager.addPolicy(standardPolicyERC721.address));

  // await waitForTx(policyManager.addPolicy(standardPolicyERC1155.address));
  // const matchingPolicies = { standardPolicyERC721, standardPolicyERC1155 };
  
  const matchingPolicies = { standardPolicyERC721 };

  const merkleVerifier = await deploy(hre, 'MerkleVerifier', []);
  
  const exchangeImpl = await deploy(hre, exchangeName, [], { libraries: { MerkleVerifier: merkleVerifier.address } }, 'DMXExchangeImpl');

  const initializeInterface = new hre.ethers.utils.Interface([
    'function initialize(uint256, address, address, address, address, uint256)',
  ]);
  
  const initialize = initializeInterface.encodeFunctionData('initialize', [
    chainId, // chainId
    WETH_ADDRESS, // _weth
    executionDelegate.address, // _executionDelegate
    policyManager.address, // _policyManager
    oracleAddress, // _oracle
    5, // _blockRange
  ]);

  console.log('initialize:', initialize);

  const exchangeProxy = await deploy(hre, 'ERC1967Proxy',
    [exchangeImpl.address, initialize],
    {},
    'DMXExchangeProxy',
  );

  await waitForTx(executionDelegate.approveContract(exchangeProxy.address));

  const exchange = new hre.ethers.Contract(
    exchangeProxy.address,
    exchangeImpl.interface,
    exchangeImpl.signer,
  );

  return { exchange, executionDelegate, matchingPolicies };
}

task('deploy', 'Deploy').setAction(async (_, hre) => {

  const [admin] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);

  console.log(`Deploying exchange on ${network}`);
  console.log(`Deploying from: ${(await admin.getAddress()).toString()}`);

  const WETH_ADDRESS = getAddressEnv('WETH', NETWORK);

  await deployFull(hre, 'DMXExchange', chainId, WETH_ADDRESS, await admin.getAddress() );

  updateAddresses(network);
});

task('upgrade', 'Upgrade').setAction(async (_, hre) => {
  const [admin] = await hre.ethers.getSigners();
  const { network, NETWORK, chainId } = getNetwork(hre);

  console.log(`Calling on ${network}`);
  console.log(`Calling from: ${(await admin.getAddress()).toString()}`);

  const WETH_ADDRESS = getAddressEnv('WETH_ADDRESS', NETWORK);
  const executionDelegateAddress = getAddress('ExecutionDelegate', network);
  const feeMechanismAddress = getAddress('FeeMechanism', network);

  const exchangeImpl = await deploy(hre, 'DMXExchange', [], ' DMXExchangeImpl');
  
  const initializeInterface = new hre.ethers.utils.Interface([
    'function initialize(uint256, address, address, address, address, uint256)',
  ]);

  const initialize = initializeInterface.encodeFunctionData('initialize', [
    chainId, // chainId
    executionDelegateAddress, // _executionDelegate
    WETH_ADDRESS, // _weth
    feeMechanismAddress, // _feeMechanism
    await admin.getAddress(), // _oracle
    5, // _blockRange
  ]);
  
  const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
  
  const exchange = await getContract(hre, 'DMXExchange', {
    libraries: { MerkleVerifier: merkleVerifierAddress },
  });
  
  await exchange.upgradeToAndCall(exchangeImpl.address, initialize);
});

task('set-block-range', 'Set Block Range')
  .addParam('b', 'New block range')
  .setAction(async ({ b }, hre) => {
    const { network } = getNetwork(hre);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
    const exchange = await getContract(hre, 'DMXExchange', {
      libraries: { MerkleVerifier: merkleVerifierAddress },
    });
    await exchange.setBlockRange(b);
  });

task('set-execution-delegate', 'Set Execution Delegate').setAction(
  
  async (_, hre) => {
    const { network } = getNetwork(hre);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
    const exchange = await getContract(hre, 'DMXExchange', {
      libraries: { MerkleVerifier: merkleVerifierAddress },
    });

    const executionDelegate = await deploy(hre, 'ExecutionDelegate', []);
    await executionDelegate.approveContract(exchange.address);
    await exchange.setFeeMechanism(executionDelegate.address);

    updateAddresses(network, ['ExecutionDelegate']);
  },
  
);

task('set-fee-mechanism', 'Set Fee Mechanism').setAction(async (_, hre) => {
  const { network, NETWORK } = getNetwork(hre);

  const WETH_ADDRESS = getAddressEnv('WETH', NETWORK);

  const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
  const exchange = await getContract(hre, 'DMXExchange', {
    libraries: { MerkleVerifier: merkleVerifierAddress },
  });

  const feeMechanism = await deploy(hre, 'FeeMechanism', [WETH_ADDRESS]);
  await exchange.setFeeMechanism(feeMechanism.address);

  updateAddresses(network, ['FeeMechanism']);
});

task('set-oracle', 'Set Oracle').addParam('o', 'New Oracle').setAction(async ({ o }, hre) => {
    const { network } = getNetwork(hre);

    const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
    const exchange = await getContract(hre, 'DMXExchange', {
      libraries: { MerkleVerifier: merkleVerifierAddress },
    });

    await exchange.setOracle(o);
  });

task('close', 'Close').setAction(async (_, hre) => {

  const { network } = getNetwork(hre);

  const merkleVerifierAddress = await getAddress('MerkleVerifier', network);
  const exchange = await getContract(hre, 'DMXExchange', {
    libraries: { MerkleVerifier: merkleVerifierAddress },
  });

  await exchange.close();

});

task('transfer-admin', 'Transfer Admin to DAO Governance')
  .addParam('contractName', 'Name of contract to change admin')
  .setAction(async ({ contractName }, hre) => {
    const { network, NETWORK } = getNetwork(hre);

    const [admin] = await hre.ethers.getSigners();

    console.log(`Calling on ${network}`);
    console.log(`Calling from: ${await admin.getAddress()}`);

    const DAO_ADMIN_ADDRESS = getAddressEnv('DAO_ADMIN', NETWORK);

    const contract = await getContract(hre, contractName);

    await waitForTx(contract.transferOwnership(DAO_ADMIN_ADDRESS));
  });
