import { labelhash } from 'viem/ens'
import hre from 'hardhat'
async function main() {
  const { viem } = hre
  const { deployer, owner } = await viem.getNamedClients()

  // ─── CONFIGURE THESE ────────────────────────────────────────────────────────
  const root = await viem.getContract('Root', owner)
  const reverse = await viem.getContract('ReverseRegistrar', owner)
  const base = await viem.getContract('BaseRegistrarImplementation', owner)
  const controller = await viem.getContract('ETHRegistrarController', owner)
    const nameWrapper = await viem.getContract('NameWrapper', owner)
  const hash1 = await root.write.transferOwnership(
    ['0x86382b58ca8D0b3064207851950e719332E5F610'],
    {account: owner.account},
  )
  console.log(
    `Setting owner of .reverse to owner on root (tx: ${hash1})...`,
  )
  const hash2 = await reverse.write.transferOwnership(
    ['0x86382b58ca8D0b3064207851950e719332E5F610'],
    {account: owner.account},
  )
  const hash3 = await base.write.transferOwnership(
    ['0x86382b58ca8D0b3064207851950e719332E5F610'],
    {account: owner.account},
  )
  const hash4 = await controller.write.transferOwnership(
    ['0x86382b58ca8D0b3064207851950e719332E5F610'],
    {account: owner.account},
  )
  const hash5 = await nameWrapper.write.transferOwnership(
    ['0x86382b58ca8D0b3064207851950e719332E5F610'],
    {account: owner.account},
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
