import { BigNumberish } from "ethers"

export const constants = {
  Controller: '0xB85759dd66E5554bf4Fc0e19cc71eC11e0f3FE2E' as `0x${string}`,
  Registry: '0x8390D472587cCAe988dD06Ccd456Ac70CcF39038' as `0x${string}`,
  ReverseRegistrar:
    '0x2E5ba310fDa0aD5dfA4CC5656FAEDDd4CC4c162b' as `0x${string}`,
  BaseRegistrar: '0x0393da9525982Be4C8b9812f8D2A877796fCA90b' as `0x${string}`,
  NameWrapper: '0x399c16D8156E1145912c106DD811702440242B93' as `0x${string}`,
  BulkRenewal: '0xB3aad8586b4796960060d0FaCBA8e001Ec7ecB7d' as `0x${string}`,
  PublicResolver: '0xe3b0181a7c7F5fA0dE6894062Ae2f15bFb41E283' as `0x${string}`,
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
