import { expect } from 'chai';
import { BigNumber, ContractReceipt, Signer, providers } from 'ethers';
import { parseEther,  } from 'ethers/lib/utils';
import { hashWithoutDomain, hash, hashWithDomain } from './signatures';

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
  tokenId: string;
  amount: number;
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
    return hashWithDomain({ ...this.parameters, nonce }, this.exchange);
  }

  async pack(
    options: { signer?: Signer; oracle?: Signer; } = {},
  ) {
    
    const signature = await sign(this.parameters, options.signer || this.user, this.exchange);
    const {v, r, s} = signature;
    return {
      order: this.parameters,
      v,
      r,
      s,
      extraSignature: '0x',
      signatureVersion: SignatureVersion.Single,
      blockNumber: 0
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
      blockNumber: 0
    };
  }
  
  // 只有 卖方 才能挂 Bulk 单 
  async packBulk(otherOrders: Order[]) {

    const orders = [...otherOrders.map((_) => _.parameters)];
    
    const nonce = await this.exchange.nonces(orders[0].trader);

    const { path, r, v, s, orders_path } = await signBulk(orders, this.user, this.exchange, nonce);
    
    return {
      order: orders[0],
      r,
      v,
      s,
      extraSignature: path,
      signatureVersion: SignatureVersion.Bulk,
      blockNumber: 0,
      // orders_path
    };
  }

  async bulkSigs(otherOrders: Order[], blockNumber: number = 0) {

    const orders = [...otherOrders.map((_) => _.parameters)];

    const nonce = await this.exchange.nonces(orders[0].trader);

    const { path, r, v, s, orders_path } = await signBulk(orders, this.user, this.exchange, nonce);
    
    let seller_sigs = [];

    for(let i = 0; i < orders.length; i++) {
      let sig = {
          order: orders[i],
          r,
          v,
          s,
          extraSignature: orders_path[i],
          signatureVersion: SignatureVersion.Bulk,
          blockNumber,
      }

      seller_sigs.push(sig);
    }

    return seller_sigs;
  }

  async bulkhash(otherOrders: Order[], blockNumber: number = 0) {
    const nonce = await this.exchange.nonces(this.parameters.trader);
    const orders = [...otherOrders.map((_) => _.parameters)];
    let hashes = [];
    for(let i = 0; i < orders.length; i++) {
      hashes.push(hashWithoutDomain({ ...orders[i], nonce }));
    }
    return hashes;
  }

  async bulkNoSigs(otherOrders: Order[], _bulkSigs: any, blockNumber: number = 0) {

    const orders = [...otherOrders.map((_) => {
      
      return {
        ..._.parameters,
        trader: this.user.address,
        side: Side.Buy,
      }
    })];
    const nonce = await this.exchange.nonces(orders[0].trader);
    const { path, r, v, s, orders_path } = await signBulk(orders, this.user, this.exchange, nonce);
    
    let seller_sigs = [];

    for(let i = 0; i < orders.length; i++) {
      let sig = {
          order: orders[i],
          v: 27,
          r: ZERO_BYTES32,
          s: ZERO_BYTES32,
          extraSignature: _bulkSigs[i].extraSignature,
          signatureVersion: SignatureVersion.Bulk,
          blockNumber,
      }
      seller_sigs.push(sig);
    }

    return seller_sigs;
  }
}


export class Trader {
    user
    exchange
    orders: any = []
    extraSignatures: any = []

    constructor(user: any, exchange: any) {
        this.user = user
        this.exchange = exchange
    }

    async addOrder(overrides = {}, _extraSignature: string = '0x') {

      const DEFAULT_ORDER: OrderWithNonce = {
            trader: this.user.address,
            side: Side.Sell,
            matchingPolicy: '0x',
            collection: '0x',
            tokenId: '1',
            amount: 0,
            paymentToken: ZERO_ADDRESS,
            price: eth('1'),
            listingTime: '0',
            expirationTime: '0',
            fees: [
                {
                    rate: 300,
                    recipient: '0x158F323C98547A0E5998eDB5A5BC9F182158159B',
                },
            ],
            salt: 1,
            extraParams: '0x',
            nonce: 0,
        }

        const _order: OrderWithNonce = {...DEFAULT_ORDER, ...overrides}

        this.orders.push(_order)

        if (_order.side === Side.Buy) {
            this.extraSignatures.push(_extraSignature)
        }
    }

    // 只有 卖方 才能挂 Bulk 单
    async bulkSigs(blockNumber: number , nonce: any) {
        
        const { path, r, v, s, orders_path } = await signBulk(this.orders, this.user, this.exchange, nonce as any)

        let result = []

        for (let i = 0; i < this.orders.length; i++) {
            let sig = {
                order: this.orders[i],
                r,
                v,
                s,
                extraSignature: orders_path[i],
                signatureVersion: SignatureVersion.Bulk,
                blockNumber,
                hash: hashWithoutDomain({ ...this.orders[i], nonce: nonce }),
            }

            result.push(sig)
        }

        return result
    }

    async bulkNoSigs(blockNumber: number) {
        let out = []
        for (let i = 0; i < this.orders.length; i++) {
            let sig = {
                order: this.orders[i],
                v: 27,
                r: ZERO_BYTES32,
                s: ZERO_BYTES32,
                extraSignature: this.extraSignatures[i],
                signatureVersion: SignatureVersion.Bulk,
                blockNumber,
            }
            out.push(sig)
        }
        return out
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
