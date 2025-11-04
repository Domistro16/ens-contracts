import hre from 'hardhat'
import { namehash } from 'viem/ens'
async function main() {
  const { viem } = hre
  const { deployer } = await hre.viem.getNamedClients()
  const wrapper = await viem.getContract('NameWrapper')
  const base = await viem.getContract('BaseRegistrarImplementation')
  const registry = await viem.getContract('ENSRegistry')

  const label = 'admiano'
  const node = namehash(`${label}.safu`)
  const wrapped = await wrapper.read.isWrapped([node])
  console.log(wrapped)
  console.log('Resolver set for', label)
  if (wrapped) {
    const sendHash = await wrapper.write.safeTransferFrom([
      deployer.address,
      '0xa1255A2d90052B563F7bc09138f0EB67628050d7',
      BigInt(node),
      1n,
      '0x',
    ])

    await viem.waitForTransactionSuccess(sendHash)
    console.log('Wrapped name sent:', label)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
