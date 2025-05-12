import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { createConnector as createWagmiConnector } from '@wagmi/core'
import { BrowserRouter } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  Wallet,
  WalletDetailsParams,
} from '@rainbow-me/rainbowkit'
import App from './App.tsx'
import './index.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { bscTestnet } from 'viem/chains'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client'
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector'
import { Web3Auth } from '@web3auth/modal'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { UX_MODE, WEB3AUTH_NETWORK } from '@web3auth/base'
import { getEvmChainConfig } from '@web3auth/base'
import { rainbowWallet, metaMaskWallet, trustWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets'


const chainConfig = getEvmChainConfig(97, 'your_web3auth_client_id')

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: chainConfig as any },
})

const web3AuthInstance = new Web3Auth({
  clientId: import.meta.env.VITE_CLIENT_ID || '',
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
   uiConfig: {
    mode: "dark",
    defaultLanguage: "en",
    theme: {
      primary: "#768729",
    },
    uxMode: UX_MODE.REDIRECT,
    modalZIndex: "2147483647"
  }
});

export const rainbowWeb3AuthConnector = (): Wallet => ({
  id: 'web3auth',
  name: 'web3auth',
  rdns: 'web3auth',
  iconUrl: 'https://web3auth.io/images/web3authlog.png',
  iconBackground: '#fff',
  installed: true,
  downloadUrls: {},
  createConnector: (walletDetails: WalletDetailsParams) =>
    createWagmiConnector((config: any) => ({
      ...Web3AuthConnector({
        web3AuthInstance,
      })(config),
      ...walletDetails,
    })),
})

export const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/110610/creator/v2',
    // ← Replace this with your subgraph’s URL
  }),
  cache: new InMemoryCache(),
})

const config = getDefaultConfig({
  appName: 'Creator Domains',
  projectId: 'YOUR_PROJECT_ID',
  chains: [bscTestnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
  wallets: [
    {
      groupName: 'Sign up Or Login with your email',
      wallets: [rainbowWeb3AuthConnector],
    },
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        rainbowWeb3AuthConnector,
        rainbowWallet,
        trustWallet,
        coinbaseWallet,
      ],
    },
  ],
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config as any}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <ApolloProvider client={client}>
              <App />
            </ApolloProvider>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
