import { Contract, ethers, Wallet, Signature } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { OrderParameters, OrderWithNonce, TypedData } from './utils';

const { 
  eip712Hash, 
  hashStruct,

  encodeData,
  encodeType,
  findTypeDependencies,
  hashType,
  sanitizeData,
} = TypedDataUtils;

const eip712Fee = {
  name: 'Fee',
  fields: [
    { name: 'rate', type: 'uint16' },
    { name: 'recipient', type: 'address' },
  ],
};

const eip712Order = {
  name: 'Order',
  fields: [
    { name: 'trader', type: 'address' },
    { name: 'side', type: 'uint8' },
    { name: 'matchingPolicy', type: 'address' },
    { name: 'collection', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'paymentToken', type: 'address' },
    { name: 'price', type: 'uint256' },
    { name: 'listingTime', type: 'uint256' },
    { name: 'expirationTime', type: 'uint256' },
    { name: 'fees', type: 'Fee[]' },
    { name: 'salt', type: 'uint256' },
    { name: 'extraParams', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
  ],
};


function structToSign(order: OrderWithNonce, exchange: string): TypedData {

  return {
    name: eip712Order.name,
    fields: eip712Order.fields,
    domain: {
      name: 'DMX Exchange',
      version: '1.0',
      chainId: 5,
      verifyingContract: exchange,
    },
    data: order,
  };
  
}

export async function sign(order: OrderParameters, account: Wallet, exchange: Contract): Promise<Signature> {

  const nonce = await exchange.nonces(order.trader);
  
  const _struct_to_sign = structToSign({ ...order, nonce }, exchange.address);
  
  const _domain = _struct_to_sign.domain;
  const _types = {
    [eip712Fee.name]: eip712Fee.fields,
    [eip712Order.name]: eip712Order.fields,
  }

  const _value = _struct_to_sign.data;
  
  const signature = account
    ._signTypedData(_domain, _types, _value)
    .then(async (sigBytes) => {
      const sig = ethers.utils.splitSignature(sigBytes);
      return sig;
    });


  return signature;
}


export async function signBulk(orders: OrderParameters[], account: Wallet, exchange: Contract) {

  const { tree, root } = await getOrderTreeRoot(orders, exchange);

  const nonce = await exchange.nonces(orders[0].trader);
  
  const order_first = hashWithoutDomain({ ...orders[0], nonce });
  let path_first = ethers.utils.defaultAbiCoder.encode(['bytes32[]'], [tree.getHexProof(order_first)]);

  let orders_path = []
  for(let i = 0; i < orders.length; i++) {
    let order = hashWithoutDomain({ ...orders[i], nonce })
    let orderPath = ethers.utils.defaultAbiCoder.encode(['bytes32[]'], [tree.getHexProof(order)]);
    orders_path.push(orderPath);
  }

  const signature = await account
    ._signTypedData(
      {
        name: 'DMX Exchange',
        version: '1.0',
        chainId: 5,
        verifyingContract: exchange.address,
      },
      {
        Root: [{ name: 'root', type: 'bytes32' }],
      },
      { root },
    )
    .then((sigBytes) => {
      const sig = ethers.utils.splitSignature(sigBytes);
      return sig;
    });

  return {
    path: path_first,
    v: signature.v,
    r: signature.r,
    s: signature.s,
    orders_path: orders_path,
  };
}

// 获取 订单列表的 MerkleProof
async function getOrderTreeRoot(orders: OrderParameters[], exchange: Contract) {
  const leaves = await Promise.all(
    orders.map(async (order) => {
      const nonce = await exchange.nonces(order.trader);
      return hashWithoutDomain({ ...order, nonce });
    })
  )

  return getMerkleProof(leaves);
}

// 构建 MerkleTree, 然后返回 root 
function getMerkleProof(leaves: string[]) {
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
  const root = tree.getHexRoot();
  return { root, tree };
}

export function hash(parameters: any, exchange: Contract): string {
  parameters.nonce = parameters.nonce.toHexString();
  parameters.price = parameters.price.toHexString();

  const _data = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      [eip712Fee.name]: eip712Fee.fields,
      [eip712Order.name]: eip712Order.fields,
    },
    primaryType: 'Order',
    domain: {
      name: 'DMX Exchange',
      version: '1.0',
      chainId: 5,
      verifyingContract: exchange.address,
    },
    message: parameters,
  };
  
  const _version = SignTypedDataVersion.V4;
  const _hash = eip712Hash(_data, _version);

  return `0x${_hash.toString('hex')}`;

}

export function hashWithDomain(parameters: any, exchange: Contract, chainId: number = 5): string {
  parameters.nonce = parameters.nonce.toHexString();
  parameters.price = parameters.price.toHexString();

  const _data = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      [eip712Fee.name]: eip712Fee.fields,
      [eip712Order.name]: eip712Order.fields,
    },
    primaryType: 'Order',
    domain: {
      name: 'DMX Exchange',
      version: '1.0',
      chainId: chainId,
      verifyingContract: exchange.address,
    },
    message: parameters,
  };
  
  const _version = SignTypedDataVersion.V4;
  const _hash = eip712Hash(_data, _version);

  return `0x${_hash.toString('hex')}`;

}

export function hashWithoutDomain(parameters: any): string {
  parameters.nonce = parameters.nonce.toHexString();
  parameters.price = parameters.price.toHexString();

  const _primaryType = 'Order';
  const _data = parameters;
  const _types = {
    [eip712Fee.name]: eip712Fee.fields,
    [eip712Order.name]: eip712Order.fields,
  };
  const _version = SignTypedDataVersion.V4;
  const _hash = hashStruct(_primaryType, _data, _types, _version);

  return `0x${_hash.toString('hex')}`;
}
