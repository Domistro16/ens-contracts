import hre from 'hardhat'

async function main() {
  const { viem } = hre
  const { deployer, owner } = await viem.getNamedClients()

  const reverse = await viem.getContract('ReverseRegistrar', owner)
  const domain = 'domistro'
  const authorizeOwner = await reverse.write.setController([
    owner.address, // Authorize the transaction caller
    true,
  ])

  await viem.waitForTransactionSuccess(authorizeOwner)

  // SET reverse name

  const txHash = await reverse.write.setNameForAddr([
    owner.address,
    owner.address,
    '0xe3b0181a7c7F5fA0dE6894062Ae2f15bFb41E283',
    `bonkon.creator`,
  ])

  await viem.waitForTransactionSuccess(txHash)
  console.log(txHash)
  /*  const tx = await reverse.simulate.setNameForAddr([
    '0x5829083A76d7367cdCfE166D87927ddd0F2465AD',
    '0x5829083A76d7367cdCfE166D87927ddd0F2465AD',
    '0xe3b0181a7c7F5fA0dE6894062Ae2f15bFb41E283',
    `${domain}.creator`,
  ])

  console.log('Simulated transaction:', tx)
  const txHash2 = await reverse.write.setNameForAddr([
    '0x5829083A76d7367cdCfE166D87927ddd0F2465AD',
    '0x5829083A76d7367cdCfE166D87927ddd0F2465AD',
    '0xe3b0181a7c7F5fA0dE6894062Ae2f15bFb41E283',
    `${domain}.creator`,
  ])
  console.log(txHash2)
  try {
    await viem.waitForTransactionSuccess(txHash2)
  } catch (err) {
    console.error('❌ Transaction 2 failed:', err)
    console.log('❗ Failed TX hash:', txHash2) // ✅ still log the hash
    throw err
  } 

  console.log(`✅ [mintWorker] Reverse record set in ${txHash2}`) */
}

main()
