import type { DeployFunction } from 'hardhat-deploy/types.js'
import type { Address } from 'viem'
import {parseUnits} from 'viem'

const func: DeployFunction = async function (hre) {
  const { network, viem } = hre

  let oracleAddress: Address = '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526'

  await viem.deploy('ExponentialPremiumPriceOracle', [
    oracleAddress,
    [0n, 0n, 20294266869609n, 5073566717402n, 158548959919n],
    100000000000000000000000000n,
    21n,
  ])
}

func.id = 'price-oracle'
func.tags = ['ethregistrar', 'ExponentialPremiumPriceOracle', 'DummyOracle']
func.dependencies = ['registry']

export default func