import 'dotenv/config'
import {
  createWalletClient,
  http,
  defineChain,
  createPublicClient,
  namehash,
  zeroAddress,
} from 'viem'
import hre, { deployments } from 'hardhat'
import { privateKeyToAccount } from 'viem/accounts'
import type { Chain, Address } from 'viem'
import { bscTestnet } from 'viem/chains'
import ControllerArtifact from '../artifacts/contracts/ethregistrar/ETHRegistrarController.sol/ETHRegistrarController.json'
import Namewrapper from '../artifacts/contracts/wrapper/NameWrapper.sol/NameWrapper.json'
import Registry from '../artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json'
import ReverseRegistrar from '../artifacts/contracts/reverseRegistrar/ReverseRegistrar.sol/ReverseRegistrar.json'
import OwnedResolver from '../artifacts/contracts/resolvers/OwnedResolver.sol/OwnedResolver.json'
import { createInterfaceId } from '../test/fixtures/createInterfaceId'

// 2) Initialize account from private key
const account = privateKeyToAccount(process.env.DEPLOYER_KEY as `0x${string}`)

// 3) Create a Wallet Client for BSC Testnet
const client = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(),
})

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
})
let priceOracle: Address = '0xB4bf40dCCd9Be471EbeE5E7d513fa679BA94Bd26'
let reverseRegistrar: Address = '0x078E09a9584c3Ec7DF706db42685D4eedf456FC9'
let registrar: Address = '0xB4C95f28F762E7B42dCd6E108BB8C7fCf90Cb413'
let nameWrapper: Address = '0x501CB529399486684f94c6f59F1b1617202DDE18'
let registry: Address = '0xC33387F371067b1Bdc48E694bf30EDB8deF7d4A0'
let tokenOracle: Address = '0x5fbed967c1d27ef166509a4c009c954d35a8400e'
// 4) Deploy the ENSRegistrarPaymaster contract
async function main() {
  console.log('deploying')
  const { viem, network } = hre
  const { deployer, owner } = await viem.getNamedClients()

  const txHash = await client.deployContract({
    abi: ControllerArtifact.abi,
    bytecode: ControllerArtifact.bytecode as `0x${string}`,
    args: [
      registrar,
      priceOracle,
      tokenOracle,
      60n,
      86400n,
      reverseRegistrar,
      nameWrapper,
      registry,
    ],
  })
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  })
  if (!receipt.contractAddress) {
    throw new Error('No contractAddress found in receipt')
  }
  console.log('🏠 Contract deployed at:', receipt.contractAddress)
  console.log('Tx hash:', txHash)

  if (network.name === 'mainnet') return

  const nameWrapperSetControllerHash = await client.writeContract({
    abi: Namewrapper.abi as any,
    functionName: 'setController',
    address: nameWrapper,
    args: [receipt.contractAddress, true],
  })
  console.log(
    `Adding ETHRegistrarController as a controller of NameWrapper (tx: ${nameWrapperSetControllerHash})...`,
  )
  const reverseRegistrarSetControllerHash = await client.writeContract({
    abi: ReverseRegistrar.abi,
    functionName: 'setController',
    address: reverseRegistrar,
    args: [receipt.contractAddress, true],
  })
  console.log(
    `Adding ETHRegistrarController as a controller of ReverseRegistrar (tx: ${reverseRegistrarSetControllerHash})...`,
  )

 /*  const setRecordHash = await client.writeContract({
    functionName: 'setRecord',
    abi: Registry.abi,
    address: registry,
    args: [
      namehash('creator'),
      deployer.address,
      '0x55995668Fd11d79a0b6D5eB71D6B9BE276AB4705',
      0,
    ],
  })

  console.log(setRecordHash)

  const setResolverHash = await client.writeContract({
    functionName: 'setResolver',
    abi: Registry.abi,
    address: registry,
    args: [namehash('creator'), '0x55995668Fd11d79a0b6D5eB71D6B9BE276AB4705'],
  })

  console.log(setResolverHash)
 */
  const artifact = await deployments.getArtifact('IETHRegistrarController')
  const interfaceId = createInterfaceId(artifact.abi)

  const resolver = await publicClient.readContract({
    functionName: 'resolver',
    abi: Registry.abi,
    args: [namehash('creator')],
    address: registry,
  })
  if (resolver === zeroAddress) {
    console.log(
      `No resolver set for .creator; not setting interface ${interfaceId} for creator Registrar Controller`,
    )
    return
  }

  const setInterfaceHash = await client.writeContract({
    functionName: 'setInterface',
    address: '0x55995668Fd11d79a0b6D5eB71D6B9BE276AB4705',
    abi: OwnedResolver.abi,
    args: [namehash('creator'), interfaceId, receipt.contractAddress],
  })
  console.log(
    `Setting ETHRegistrarController interface ID ${interfaceId} on .creator resolver (tx: ${setInterfaceHash})...`,
  )
}

main().catch(console.error)
