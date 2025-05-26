import 'dotenv/config'
import { createWalletClient, http, defineChain, createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Chain, Address } from 'viem'
import { bscTestnet } from 'viem/chains'
import OracleArtifact from '../artifacts/contracts/ethregistrar/TokenPriceOracle.sol/TokenPriceOracle.json'

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
let oracleAddress: Address = '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526'
let cakeAddress: Address = '0x81faeDDfeBc2F8Ac524327d70Cf913001732224C'
let usd1Address: Address = '0xEca2605f0BCF2BA5966372C99837b1F182d3D620'
// 4) Deploy the ENSRegistrarPaymaster contract
async function main() {
  console.log('deploying')
  const txHash = await client.deployContract({
    abi: OracleArtifact.abi,
    bytecode: OracleArtifact.bytecode as `0x${string}`,
    args: [
      oracleAddress,
      cakeAddress,
      usd1Address,
      [0n, 0n, 20294266869609n, 5073566717402n, 158548959919n],
      100000000000000000000000000n,
      21n,
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  })
  if (!receipt.contractAddress) {
    throw new Error('No contractAddress found in receipt')
  }
  console.log('🏠 Contract deployed at:', receipt.contractAddress)

  console.log('Contract deployed at:', receipt.contractAddress)
  console.log('Tx hash:', txHash)
}

main().catch(console.error)
