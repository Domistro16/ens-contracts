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
import Referral from '../artifacts/contracts/ethregistrar/ReferralController.sol/ReferralController.json'
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
let reverseRegistrar: Address = '0x61a47Ca35Daa7289c38a3aFCC1C9a0BCb00524Bb'
let registrar: Address = '0x74321b65Ba60db5c9eF80D7de02f7051Df2C02B7'
let nameWrapper: Address = '0x6C066a755F954d53F701BCF6d691Cfc2e820Bc62'
let registry: Address = '0xCA20aEFf55F5f7d1dB4c7BCeA91BE69a70704c76'
let tokenOracle: Address = '0xAA285143CBCCe0E1f39bFa3667115CcbFC5d15e9'
const tokenAddresses: `0x${string}`[] = [
  '0xFa60D973F7642B748046464e165A65B7323b0DEE',
  '0x64544969ed7EBf5f083679233325356EbE738930',
]

// 4) Deploy the ENSRegistrarPaymaster contract
async function main() {
  console.log('deploying')
  const { viem, network } = hre
  const { deployer, owner } = await viem.getNamedClients()

  const refHash = await client.deployContract({
    abi: Referral.abi,
    bytecode: Referral.bytecode as `0x${string}`,
    args: [],
  })

  const receipt2 = await publicClient.waitForTransactionReceipt({
    hash: refHash,
  })
  if (!receipt2.contractAddress) {
    throw new Error('No contractAddress found in receipt2')
  }
  console.log('🏠 Referral Contract deployed at:', receipt2.contractAddress)
  console.log('Tx hash:', refHash)

  const txHash = await client.deployContract({
    abi: ControllerArtifact.abi,
    bytecode: ControllerArtifact.bytecode as `0x${string}`,
    args: [
      registrar,
      tokenOracle,
      60n,
      86400n,
      reverseRegistrar,
      nameWrapper,
      registry,
      owner.address,
      receipt2.contractAddress,
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

  const refhash = await client.writeContract({
    abi: Referral.abi,
    functionName: 'addController',
    address: receipt2.contractAddress,
    args: [receipt.contractAddress],
  })

  for (const tokenAddress of tokenAddresses) {
    const hash = await client.writeContract({
      abi: ControllerArtifact.abi,
      functionName: 'setToken',
      address: receipt.contractAddress,
      args: [tokenAddress],
    })
    console.log(`Adding ${tokenAddress} to ETHRegistrarController`)
    await publicClient.waitForTransactionReceipt({
      hash,
    })
  }

   const hash = await client.writeContract({
     abi: ControllerArtifact.abi,
     functionName: 'setBackend',
     address: receipt.contractAddress,
     args: [owner.address],
   })
   console.log(`Adding ${owner.address} to ETHRegistrarController`)
   await publicClient.waitForTransactionReceipt({
     hash,
   })

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
