import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import BaseRegistrarABI from '../../../artifacts/contracts/ethregistrar/BaseRegistrarImplementation.sol/BaseRegistrarImplementation.json'
import { keccak256, toBytes } from 'viem'
import { getDefaultProvider } from 'ethers'
import {}

interface RegistrationInfo {
  registeredAt: Date
  txHash: string
}

export function useENSRegistrationTime(
  name: string,
  {
    rpcUrl = 'https://endpoints.omniatech.io/v1/bsc/testnet/public', // or your Chapel RPC
    registrarAddress = '0xB4C95f28F762E7B42dCd6E108BB8C7fCf90Cb413', // your BaseRegistrar
    startBlock = 51420222, // optional startBlock filter
  }: {
    rpcUrl?: string
    registrarAddress?: string
    startBlock?: number
  } = {},
) {
  const [data, setData] = useState<RegistrationInfo | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const 

  useEffect(() => {
    if (!name) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    ;(async () => {
      try {
        const provider = getDefaultProvider('bscTestnet')
        const nodehash = keccak256(toBytes(name))
        const registrar = new ethers.Contract(
          registrarAddress,
          BaseRegistrarABI.abi,
          provider,
        )

        // filter for all NameRegistered events for this name
        const filter = registrar.filters.NameRegistered(nodehash, null, null)
        const logs = await registrar.queryFilter(filter, startBlock, 'latest')
        if (logs.length === 0) {
          throw new Error(`No registration event found for ${name}`)
        }

        // earliest log = first registration
        const firstLog = logs[0]
        const block = await provider.getBlock(firstLog.blockNumber)
        if (cancelled) return

        setData({
          registeredAt: new Date(block.timestamp * 1000),
          txHash: firstLog.transactionHash,
        })
      } catch (e: any) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [name, rpcUrl, registrarAddress, startBlock])

  return { data, isLoading, error }
}
