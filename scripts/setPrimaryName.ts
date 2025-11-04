import hre from 'hardhat'
import { namehash } from 'viem'
async function main() {
  const { viem } = hre

  const { deployer } = await viem.getNamedClients()

  const reverseRegistrar = await viem.getContract('ReverseRegistrar', deployer)
  const resolver = await viem.getContract('PublicResolver', deployer)
  const setPrimaryNameHash = await reverseRegistrar.write.setNameForAddr([
    '0xa1255A2d90052B563F7bc09138f0EB67628050d7',
    '0xa1255A2d90052B563F7bc09138f0EB67628050d7',
    resolver.address,
    'admiano.safu'
  ])
  console.log(
    `Setting primary name for ${'0xa1255A2d90052B563F7bc09138f0EB67628050d7'} to admiano.safu (tx: ${setPrimaryNameHash})...`,
  )
  await viem.waitForTransactionSuccess(setPrimaryNameHash)
}

main().then(() => process.exit(0))
