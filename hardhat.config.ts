import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'solidity-coverage';
import '@nomicfoundation/hardhat-toolbox';

import { config as dotenvConfig } from 'dotenv';
import { HardhatUserConfig, task } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';
import { resolve } from 'path';
import { ethers } from "ethers"

import './scripts/deploy'
import './scripts/tasks'
import './scripts/execution'
import './scripts/packbulk'
import './scripts/batchlisting'

dotenvConfig({ path: resolve(__dirname, './.env') });


const chainIds = {
  goerli: 5,
  mainnet: 1,
  sepolia: 11155111,
  'linea-goerli': 59140,
};

const CHAIN_ID: string = process.env.CHAIN_ID || "";

if (!CHAIN_ID) {
  throw new Error('Please set your CHAIN_ID in a .env file');
}

// Ensure that we have all the environment variables we need.
const PRIVATE_KEYS: string = process.env.PRIVATE_KEYS || "";

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic || !PRIVATE_KEYS) {
  throw new Error('Please set your PRIVATE_KEYS in a .env file');
}

const accounts = PRIVATE_KEYS.split(',');

task("verions", "versions", async () => {
  let version = ethers.version
  console.log('version::', version);
});


function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url = `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`;
  return {
    accounts,
    chainId: chainIds[network],
    url,
    gasMultiplier: 1.5,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    goerli: getChainConfig('goerli'),
    mainnet: getChainConfig('mainnet'),
    sepolia: getChainConfig('sepolia'),
    'linea-goerli': getChainConfig("linea-goerli"),
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1,
    },
    hardhat: {
      chainId: parseInt(CHAIN_ID),
      accounts: {
        count: 10,
        mnemonic: process.env.MNEMONIC,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          metadata: {
            bytecodeHash: 'none',
          },
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: "12cc6805-d3a2-4bed-85e6-fe3119b41877",
    currency: "USD",
  },
  etherscan: {
    apiKey: "JZ1KK9X9RH91IY6JE997SIW92UTZGEKBZ7",
  },
};

export default config;





