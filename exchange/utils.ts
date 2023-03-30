import { expect } from 'chai';
import { BigNumber, ContractReceipt, Signer } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { hashWithoutDomain, hash } from './signatures';

import { sign, signBulk } from './signatures';

export enum Side {
  Buy = 0,
  Sell = 1,
}

export enum AssetType {
  ERC721 = 0,
  ERC1155 = 1,
}

export enum SignatureVersion {
  Single = 0,
  Bulk = 1,
}

export interface Fee {
  rate: number;
  recipient: string;
}

export interface OrderParameters {
  trader: string;
  side: Side;
  matchingPolicy: string;
  collection: string;
  tokenId: string | number;
  amount: string | number;
  paymentToken: string;
  price: BigNumber;
  listingTime: string;
  expirationTime: string;
  fees: Fee[];
  salt: number;
  extraParams: string;
}

export interface OrderWithNonce extends OrderParameters {
  nonce: any;
}

export class Order {
  parameters: OrderParameters;
  user: any;
  exchange: any;

  constructor(
    user: any,
    parameters: OrderParameters,
    exchange: any,
  ) {
    this.user = user;
    this.parameters = parameters;
    this.exchange = exchange;
  }

  async hash(): Promise<string> {
    const nonce = await this.exchange.nonces(this.parameters.trader);
    return hashWithoutDomain({ ...this.parameters, nonce });
  }

  async hashToSign(): Promise<string> {
    const nonce = await this.exchange.nonces(this.parameters.trader);
    return hash({ ...this.parameters, nonce }, this.exchange);
  }

  async pack(
    options: { signer?: Signer; oracle?: Signer; blockNumber?: number } = {},
  ) {
    const signature = await sign(
      this.parameters,
      options.signer || this.user,
      this.exchange,
    );
    const {v, r, s} = signature;
    return {
      order: this.parameters,
      v,
      r,
      s,
      extraSignature: '0x',
      signatureVersion: SignatureVersion.Single,
      blockNumber: (await ethers.provider.getBlock('latest')).number,
    };
  }

  async packNoSigs() {
    return {
      order: this.parameters,
      v: 27,
      r: ZERO_BYTES32,
      s: ZERO_BYTES32,
      extraSignature: '0x',
      signatureVersion: SignatureVersion.Single,
      blockNumber: (await ethers.provider.getBlock('latest')).number
    };
  }
  
  // 只有 卖方 才能挂 Bulk 单 
  async packBulk(otherOrders: Order[]) {
    const { path, r, v, s } = await signBulk(
      [this.parameters, ...otherOrders.map((_) => _.parameters)],
      this.user,
      this.exchange,
    );
    
    return {
      order: this.parameters,
      r,
      v,
      s,
      extraSignature: path,
      signatureVersion: SignatureVersion.Bulk,
      blockNumber: (await ethers.provider.getBlock('latest')).number,
    };
  }
}

export interface Field {
  name: string;
  type: string;
}

export interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface TypedData {
  name: string;
  fields: Field[];
  domain: Domain;
  data: OrderParameters;
}

export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function eth(amount: string) {
  return parseEther(amount);
}

export async function waitForTx(tx: Promise<any>): Promise<ContractReceipt> {
  const resolvedTx = await tx;
  return await resolvedTx.wait();
}

export async function assertPublicMutableMethods(
  contract: any,
  expectedPublicMethods: string[],
) {
  const allModifiableFns = Object.values(contract.interface.functions)
    .filter((f: any) => {
      return (
        f.stateMutability === 'nonpayable' || f.stateMutability === 'payable'
      );
    })
    .map((f: any) => f.format());
  expect(allModifiableFns.sort()).to.be.deep.eq(expectedPublicMethods.sort());
}
