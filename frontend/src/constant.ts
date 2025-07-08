import { BigNumberish } from "ethers"

export const constants = {
  Controller: '0xDf310Ea5f3cfdBaee15fa8B40386fCd3502a7B72' as `0x${string}`,
  Registry: '0xCA20aEFf55F5f7d1dB4c7BCeA91BE69a70704c76' as `0x${string}`,
  ReverseRegistrar:
    '0x61a47Ca35Daa7289c38a3aFCC1C9a0BCb00524Bb' as `0x${string}`,
  BaseRegistrar: '0x74321b65Ba60db5c9eF80D7de02f7051Df2C02B7' as `0x${string}`,
  NameWrapper: '0x6C066a755F954d53F701BCF6d691Cfc2e820Bc62' as `0x${string}`,
  BulkRenewal: '0x05d53F51f9Ec2A02985051a6336D1A1D4Fc4E887' as `0x${string}`,
  PublicResolver: '0x40fEA4A9D9dc09b61480a424fAD2f96F1433Acfc' as `0x${string}`,
}

export interface Params {
  /** The name to register */
  name: string

  /** Owner address (20-byte hex) */
  owner: `0x${string}`

  /** Registration duration in seconds (uint256) */
  duration: BigNumberish

  /** Secret commitment (32-byte hex) */
  secret: string

  /** Resolver contract address */
  resolver: string

  /** Array of ABI-encoded data blobs */
  data: string[]

  /** Whether to set up a reverse record */
  reverseRecord: boolean

  /** Owner-controlled fuses bitmap (fits in uint16) */
  ownerControlledFuses: number
}

export interface TokenParams {
  /** Token symbol or identifier */
  token: string

  /** Token contract address */
  tokenAddress: string
}
