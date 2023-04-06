import {
  getContract as _getContract,
  updateAddresses as _updateAddresses,
  getAddress as _getAddress,
} from './web3-utils';

const repo = 'DMXExchange';

const contracts = {
  DMXExchange: 'DMXExchange',
  ExecutionDelegate: 'EXECUTION_DELEGATE',
  PolicyManager: 'POLICY_MANAGER',
  StandardPolicyERC721: 'STANDARD_POLICY_ERC721',
  MerkleVerifier: 'MERKLE_VERIFIER',

  DMXExchangeProxy: 'DMXExchangeProxy',

  MockERC721: 'MockERC721', 
  MockERC20: 'MockERC20',
};

export function getAddress(contract: string, network: string): string {
  return _getAddress(repo, contract, contracts, network);
}

export function getContract(hre: any, contract: string, options?: any) {
  return _getContract(hre, repo, contract, contracts, options);
}

export function updateAddresses(
  network: string,
  addresses = Object.keys(contracts),
) {
  _updateAddresses(repo, addresses, contracts, network);
}


// export function getAddress(contract: string, network: string): string {
//   return _getAddress(repo, contract, contracts, network);
// }

// export function getContract(hre: any, contract: string, options?: any) {
//   return _getContract(hre, repo, contract, contracts, options);
// }

// export function updateAddresses(network: string, addresses = Object.keys(contracts)) {
//   _updateAddresses(repo, addresses, contracts, network);
// }



