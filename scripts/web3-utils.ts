import { FactoryOptions, HardhatRuntimeEnvironment } from 'hardhat/types';
import { ContractReceipt, ContractTransaction, Signer } from 'ethers';
// import { getContractAddress } from 'ethers/lib/utils';
import fs from 'fs';

const DEPLOYMENTS_DIR = `./deployments`;



const contractVariables: Record<string, string> = {
  DMXExchange: 'DMXExchange',
  ExecutionDelegate: 'EXECUTION_DELEGATE',
  PolicyManager: 'POLICY_MANAGER',
  StandardPolicyERC721: 'STANDARD_POLICY_ERC721',
  MerkleVerifier: 'MERKLE_VERIFIER',
  DMXExchangeProxy: 'DMXExchangeProxy',

  MockERC721: 'MockERC721',
  // MockERC20: 'MockERC20',
};

export function getNetwork(hre: any): {
  network: string;
  chainId: string;
} {
  return {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
  };
}

export async function waitForTx(tx: ContractTransaction): Promise<ContractReceipt> {
  return await tx.wait();
}


function _save(name: string, contract: any, network: string) {
  if (!fs.existsSync(`${DEPLOYMENTS_DIR}/${network}`)) {
    fs.mkdirSync(`${DEPLOYMENTS_DIR}/${network}`, { recursive: true });
  }
  fs.writeFileSync(`${DEPLOYMENTS_DIR}/${network}/${name}.json`,
    JSON.stringify({ address: contract.address }, null, 4),
  );
}

// 获取合约地址
function _load(name: string, network: string) {
  const file = `${DEPLOYMENTS_DIR}/${network}/${name}.json`
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ }, null, 4));
  }
  const { address } = JSON.parse(fs.readFileSync(file).toString());
  
  return address;
}

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  name: string,
  calldata: any = [],
  options: FactoryOptions = {},
  saveName = '',
) {
  // console.log(`Deploying: ${name}...`);
  const contractFactory = await hre.ethers.getContractFactory(name, options);

  const contract = await contractFactory.deploy(...calldata);
  console.log(`Deployed: ${name} to: ${contract.address}`);

  _save(saveName || name, contract, hre.network.name);
  updateAddresses(hre.network.name);
  
  await contract.deployed();

  return contract;
}


export function updateAddresses(
  network: string,
) {

  const contractNames = Object.keys(contractVariables)

  const contractAddresses: Record<string, string> = {};

  contractNames.forEach((name) => {
    const _name = contractVariables[name];
    contractAddresses[_name] = _load(name, network);
  });

  let addresses: Record<string, string> = {};
  if (fs.existsSync(`${DEPLOYMENTS_DIR}/${network}.json`)) {
    let fileContent = fs.readFileSync(`${DEPLOYMENTS_DIR}/${network}.json`).toString();
    addresses = JSON.parse(fileContent);
  }

  addresses = {
    ...addresses,
    ...contractAddresses,
  };

  console.log('\nAddresses:');

  Object.entries(contractAddresses).forEach(([key, value]) => {
    console.log(` ${key}: ${value}`);
  });

  fs.writeFileSync(`${DEPLOYMENTS_DIR}/${network}.json`, JSON.stringify(addresses, null, 4));
}

export function getAddress(
  contractName: string,
  network: string,
): string {
  try {
    let _content = fs.readFileSync(`${DEPLOYMENTS_DIR}/${network}/${contractName}.json`).toString();
    const { address } = JSON.parse(_content);
    return address
  } catch (err) {
    throw Error(`${contractName} deployment on ${network} not found`);
  }
}

export async function getContract(
  hre: HardhatRuntimeEnvironment,
  name: string,
  options: FactoryOptions = {},
) {
  const { network } = getNetwork(hre);
  const address = await getAddress(name, network);

  const contractFactory = await hre.ethers.getContractFactory(name, options);
  return contractFactory.attach(address);
}