import { task } from 'hardhat/config';
import { Contract } from 'ethers';
import { getAddress, getContract, updateAddresses } from './utils';
import { deploy, getAddressEnv, getNetwork, waitForTx } from './web3-utils';

task('execute', 'Execute').setAction(async (_, hre) => {

    const [signer] = await hre.ethers.getSigners();
    const { network } = getNetwork(hre);

    console.log(`Deploying exchange on ${network}`);
    console.log(`Deploying from: ${(await signer.getAddress()).toString()}`);

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

