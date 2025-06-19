import {
  WALLET_CONNECTORS,
  Web3Auth,
  WEB3AUTH_NETWORK,
  Web3AuthOptions,
} from '@web3auth/modal'
import { useRef, useEffect } from 'react'

export const web3AuthOptions: Web3AuthOptions = {
  clientId: import.meta.env.CLIENT_ID || import.meta.env.VITE_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  defaultChainId: '0x61'
}