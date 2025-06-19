import 'dotenv/config'
import hre from 'hardhat'
import {
  createWalletClient,
  createPublicClient,
  http,
  namehash,
  zeroAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { bscTestnet } from 'viem/chains'

// Artifacts
import PublicResolverArtifact from '../artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json'
import ReverseRegistrarArtifact from '../artifacts/contracts/reverseRegistrar/ReverseRegistrar.sol/ReverseRegistrar.json'
import ENSRegistryArtifact from '../artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json'
import NameWrapperArtifact from '../artifacts/contracts/wrapper/NameWrapper.sol/NameWrapper.json'
import ControllerArtifact from '../artifacts/contracts/ethregistrar/ETHRegistrarController.sol/ETHRegistrarController.json'

// 1) Initialize deployer account from private key
const account = privateKeyToAccount(process.env.DEPLOYER_KEY as `0x${string}`)

// 2) Create Wallet & Public clients for BSC Testnet
const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(),
})
const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
})

async function main() {
  console.log('Deploying PublicResolver...')
  const { network } = hre

  // Addresses of already deployed contracts
  const registryAddress = '0xc33387f371067b1bdc48e694bf30edb8def7d4a0'
  const nameWrapperAddress = '0x501CB529399486684f94c6f59F1b1617202DDE18'
  const controllerAddress = '0xf3f80539300db138288874a9b54d4444e949be45'
  const reverseRegistrarAddress = '0x078E09a9584c3Ec7DF706db42685D4eedf456FC9'

  // Deploy PublicResolver
  const txHash =
    await walletClient.deployContract({
      abi: PublicResolverArtifact.abi,
      bytecode: PublicResolverArtifact.bytecode as `0x${string}`,
      args: [
        registryAddress,
        nameWrapperAddress,
        controllerAddress,
        reverseRegistrarAddress,
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

  // 1) Set default resolver on ReverseRegistrar
  console.log('Setting default resolver on ReverseRegistrar...')
  const tx1 = await walletClient.writeContract({
    abi: ReverseRegistrarArtifact.abi,
    address: reverseRegistrarAddress as `0x${string}`,
    functionName: 'setDefaultResolver',
    args: [receipt.contractAddress as `0x${string}`],
  })
  await publicClient.waitForTransactionReceipt({ hash: tx1 })
  console.log(`🔄 tx: ${tx1}`)

  // 2) Configure resolver.creator if owned by deployer
  const node = namehash('resolver.creator')
  const resolverOwner = await publicClient.readContract({
    abi: ENSRegistryArtifact.abi,
    address: registryAddress as `0x${string}`,
    functionName: 'owner',
    args: [node],
  })

  if (resolverOwner === account.address) {
    console.log('Setting resolver for resolver.creator...')
    const tx2 = await walletClient.writeContract({
      abi: ENSRegistryArtifact.abi,
      address: registryAddress as `0x${string}`,
      functionName: 'setResolver',
      args: [node, receipt.contractAddress as `0x${string}`],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx2 })
    console.log(`🔄 tx: ${tx2}`)

    console.log('Setting address record for resolver.creator...')
    const tx3 = await walletClient.writeContract({
      abi: PublicResolverArtifact.abi,
      address: receipt.contractAddress as `0x${string}`,
      functionName: 'setAddr',
      args: [node, receipt.contractAddress as `0x${string}`],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx3 })
    console.log(`🔄 tx: ${tx3}`)
  } else {
    console.log('resolver.creator is not owned by deployer, skipping')
  }
}

main().catch(console.error)
