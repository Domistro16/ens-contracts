import {
  WEB3AUTH_NETWORK,
  Web3AuthOptions,
} from '@web3auth/modal'

export const web3AuthOptions: Web3AuthOptions = {
  clientId: import.meta.env.CLIENT_ID || import.meta.env.VITE_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  defaultChainId: '0x61',
  uiConfig: {
    mode: "dark",
    defaultLanguage: "en",
    theme: {
      primary: "#768729",
    },
  },
}