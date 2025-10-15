import hre from 'hardhat'
import { namehash } from 'viem/ens'
async function main() {
  const { viem } = hre

  const wrapper = await viem.getContract('NameWrapper')
  const base = await viem.getContract('BaseRegistrarImplementation')
  const registry = await viem.getContract('ENSRegistry')

  const label = 'admiano'
  const node = namehash(label)
  const wrapped = await wrapper.read.isWrapped([node])

  if(wrapped) {
    const sendHash = await wrapper.write.()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
